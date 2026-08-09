import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://pitchmi.app";

// La carpeta se saca de DÓNDE ESTÁ ESTE FICHERO, no del directorio desde el que
// se lanza. Con `process.cwd()` el build escribía en `landing/landing/` si se
// ejecutaba desde dentro de `landing/`, y en Netlify el directorio base puede ser
// cualquiera de los dos.
const LANDING_DIR = path.dirname(fileURLToPath(import.meta.url));

/**
 * El nombre del sitio de cada plan, resuelto una vez con `geocodificar.mjs` y
 * commiteado. En la base de datos `place_name` está vacío en todos los planes, así
 * que sin esto las 94 páginas decían «Ubicación disponible en Pitchmi» — y una
 * página que nunca dice «Balat» no puede salir cuando alguien busca «restaurante
 * en Balat», que es justo para lo que existen estas páginas.
 */
let UBICACIONES = {};
try {
  UBICACIONES = JSON.parse(
    await fs.readFile(path.join(LANDING_DIR, "ubicaciones.json"), "utf8")
  );
} catch {
  console.warn("Sin ubicaciones.json: las páginas saldrán sin ciudad. Ejecuta: node landing/geocodificar.mjs");
}
const PAGES_DIR = path.join(LANDING_DIR, "p");

const SUPABASE_URL = "https://rcfehpjksmpjtvhrufhm.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_nlfsq0cZpnVsG9NLqs98SQ_pE24OyTp";

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll("\n", " ");
}

function stripAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

function truncate(value, maxLength = 155) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function parsePossibleArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function resolveImageUrl(value) {
  const image = String(value || "").trim();

  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:") ||
    image.startsWith("/")
  ) {
    return image;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/pitches/${image}`;
}

/**
 * Pide la foto redimensionada a Supabase en vez de la original.
 *
 * Es la misma transformación que se usa en la app (`lib/imagenes.ts`), donde bajó
 * una pantalla de portfolio de 121 MB a 1,3. `resize=contain` NO es opcional: con
 * sólo `width`, el servidor deja el alto igual y deforma la foto.
 */
function fotoWeb(url, ancho = 1200) {
  const texto = String(url || "");
  if (!texto.includes("/storage/v1/object/public/")) return texto;
  const base = texto.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const union = base.includes("?") ? "&" : "?";
  return `${base}${union}width=${ancho}&height=${ancho * 3}&resize=contain&quality=78`;
}

function getFirstImage(pitch) {
  const direct =
    pitch.image_url ||
    pitch.image ||
    pitch.cover_url ||
    pitch.cover_image ||
    pitch.cover_path ||
    "";

  if (direct) return resolveImageUrl(direct);

  const images = parsePossibleArray(pitch.images);
  if (images.length > 0) return resolveImageUrl(images[0]);

  const imageUrls = parsePossibleArray(pitch.image_urls);
  if (imageUrls.length > 0) return resolveImageUrl(imageUrls[0]);

  const imagePaths = parsePossibleArray(pitch.image_paths);
  if (imagePaths.length > 0) return resolveImageUrl(imagePaths[0]);

  return "";
}

function getCategory(pitch) {
  return safeText(pitch.category || pitch.type, "Plan");
}

function getLocation(pitch) {
  return safeText(
    pitch.location ||
      pitch.address ||
      pitch.place_name ||
      pitch.city ||
      pitch.town ||
      UBICACIONES[pitch.id],
    "Ubicación disponible en Pitchmi"
  );
}

/** ¿Sabemos de verdad dónde está, o es el texto de relleno? */
function tieneUbicacion(plan) {
  return Boolean(plan.location) && plan.location !== "Ubicación disponible en Pitchmi";
}

function getDescription(pitch) {
  return safeText(
    pitch.description || pitch.short_description || pitch.body,
    "Plan disponible en Pitchmi."
  );
}

function getDateValue(pitch) {
  return (
    pitch.live_start_at ||
    pitch.start_at ||
    pitch.starts_at ||
    pitch.event_start_at ||
    pitch.event_date ||
    pitch.date ||
    pitch.created_at ||
    ""
  );
}

function getAvailabilityStartValue(pitch) {
  return (
    pitch.live_start_at ||
    pitch.start_at ||
    pitch.starts_at ||
    pitch.event_start_at ||
    pitch.event_date ||
    pitch.date ||
    ""
  );
}

function getAvailabilityEndValue(pitch) {
  return (
    pitch.live_end_at ||
    pitch.end_at ||
    pitch.ends_at ||
    pitch.event_end_at ||
    pitch.end_date ||
    pitch.date_to ||
    pitch.date_end ||
    ""
  );
}

function parseDateTime(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isPitchDeleted(pitch) {
  const status = String(pitch.status || "").toLowerCase();
  const visibility = String(pitch.visibility || "").toLowerCase();

  return (
    Boolean(pitch.deleted_at) ||
    pitch.deleted === true ||
    pitch.is_deleted === true ||
    pitch.archived === true ||
    pitch.is_archived === true ||
    pitch.hidden === true ||
    pitch.is_hidden === true ||
    pitch.is_public === false ||
    status === "deleted" ||
    status === "archived" ||
    status === "hidden" ||
    status === "draft" ||
    status === "inactive" ||
    visibility === "private"
  );
}

function isPitchAvailable(pitch) {
  if (isPitchDeleted(pitch)) {
    return false;
  }

  const now = new Date();

  const endDate = parseDateTime(getAvailabilityEndValue(pitch));

  if (endDate && endDate < now) {
    return false;
  }

  const startDate = parseDateTime(getAvailabilityStartValue(pitch));

  if (!endDate && startDate) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (startDate < startOfToday) {
      return false;
    }
  }

  return true;
}

function formatDateLabel(value) {
  if (!value) return "Publicado recientemente";

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Publicado recientemente";
    }

    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Publicado recientemente";
  }
}

function getSymbolByCategory(category) {
  const value = String(category || "").toLowerCase();

  if (value.includes("mercad")) return "🌸";
  if (value.includes("concierto")) return "🎶";
  if (value.includes("feria")) return "🎪";
  if (value.includes("ruta")) return "⛰️";
  if (value.includes("gastronom")) return "🍽️";
  if (value.includes("fiesta") || value.includes("noche")) return "◍";
  if (value.includes("evento")) return "🎟️";
  if (value.includes("deporte")) return "◌";
  if (value.includes("lugar")) return "⌖";
  if (value.includes("experiencia")) return "◇";

  return "◌";
}

function normalizePitch(pitch) {
  const title = safeText(pitch.title || pitch.name, "Plan en Pitchmi");
  const description = getDescription(pitch);
  const category = getCategory(pitch);
  const location = getLocation(pitch);
  const dateValue = getDateValue(pitch);
  const imageUrl = getFirstImage(pitch);
  const baseSlug = safeText(slugify(title), `plan-${pitch.id}`);
  const idSuffix = String(pitch.id || "").slice(0, 8);
  const slug = idSuffix ? `${baseSlug}-${idSuffix}` : baseSlug;

  return {
    id: pitch.id,
    slug,
    title,
    description,
    metaDescription: truncate(description, 155),
    category,
    location,
    dateValue,
    dateLabel: formatDateLabel(dateValue),
    imageUrl,
    symbol: getSymbolByCategory(category),
    url: `${SITE_URL}/p/${slug}/`,
    createdAt: pitch.created_at || new Date().toISOString(),
    raw: pitch,
  };
}

async function fetchPitches() {
  const url = `${SUPABASE_URL}/rest/v1/pitches?select=*&order=created_at.desc&limit=500`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  const available = data.filter(isPitchAvailable);

  console.log(`Fetched ${data.length} pitches from Supabase.`);
  console.log(`Available pitches after filters: ${available.length}.`);
  console.log(`Filtered out ${data.length - available.length} unavailable pitches.`);

  return available.map(normalizePitch);
}

/** Los días de la semana como los nombra schema.org, en orden ISO (1 = lunes). */
const DIAS_SCHEMA = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday",
];

/**
 * Qué ES este plan, con la misma regla que usa la app:
 * horario semanal → negocio · fechas concretas → evento · nada → lugar.
 *
 * Importa porque Google los trata distinto: sólo a un negocio con
 * `openingHoursSpecification` le puede poner «Abierto ahora» al resultado.
 */
function tipoDePlan(pitch) {
  if (pitch.horario_semanal && Object.keys(pitch.horario_semanal).length > 0) {
    return "negocio";
  }
  const dias = parsePossibleArray(pitch.live_days);
  if (dias.length > 0) return "evento";
  return "lugar";
}

/**
 * Sólo se concreta el tipo donde estamos seguros; el resto cae en
 * `LocalBusiness`.
 *
 * Ojo con la tentación de mapear «arte» a `TouristAttraction`: la librería Minoa
 * Pera tiene horario semanal y salía como atracción turística. Es válido en
 * schema.org —una atracción también puede tener horario— pero el resultado con
 * «Abierto ahora» lo da `LocalBusiness` y sus subtipos. Si tiene horario, es un
 * negocio.
 */
const TIPO_SCHEMA_POR_CATEGORIA = {
  "gastronomía": "Restaurant",
  gastronomia: "Restaurant",
  fiesta: "BarOrPub",
  mercadillo: "Store",
};

/** Los tramos de `horario_semanal` en el formato que entiende Google. */
function horarioSchema(horario) {
  const salida = [];
  for (let i = 0; i < 7; i++) {
    const tramos = horario[String(i + 1)];
    if (!Array.isArray(tramos) || tramos.length === 0) continue;   // vacío = cerrado
    for (const tramo of tramos) {
      if (!tramo?.start || !tramo?.end) continue;
      salida.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DIAS_SCHEMA[i]}`,
        opens: tramo.start,
        closes: tramo.end,
      });
    }
  }
  return salida;
}

/** El precio, con la misma lógica que la ficha de la app. */
function precioSchema(pitch) {
  if (pitch.is_free === true) {
    return { offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" } };
  }
  const min = Number(pitch.price_min_cents) || 0;
  const max = Number(pitch.price_max_cents) || 0;
  const uno = Number(pitch.price_cents) || 0;
  const moneda = String(pitch.currency || "EUR").toUpperCase();

  if (min > 0 && max > 0) {
    return {
      priceRange: `${min / 100}–${max / 100} ${moneda === "EUR" ? "€" : moneda}`,
      offers: {
        "@type": "AggregateOffer",
        lowPrice: min / 100,
        highPrice: max / 100,
        priceCurrency: moneda,
      },
    };
  }
  if (uno > 0) {
    return { offers: { "@type": "Offer", price: uno / 100, priceCurrency: moneda } };
  }
  return {};
}

function createStructuredData(plan) {
  const pitch = plan.raw || {};
  const tipo = tipoDePlan(pitch);

  const comun = {
    "@context": "https://schema.org",
    name: plan.title,
    description: plan.metaDescription,
    url: plan.url,
  };

  // Las fotos: todas las que haya, no sólo la portada.
  const fotos = parsePossibleArray(pitch.image_urls)
    .map((u) => fotoWeb(resolveImageUrl(u), 1200))
    .filter(Boolean)
    .slice(0, 6);
  if (fotos.length > 0) comun.image = fotos;
  else if (plan.imageUrl) comun.image = [plan.imageUrl];

  // Las coordenadas son lo que permite el «cerca de mí». Ya están en la base.
  const lat = Number(pitch.lat);
  const lng = Number(pitch.lng);
  const geo =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
      : null;

  // La web del sitio, si la puso quien publica. Sólo http(s): lo escribe una
  // persona y podría traer cualquier esquema.
  const enlace = String(pitch.enlace || "");
  const sameAs = /^https?:\/\//i.test(enlace) ? enlace : null;

  if (tipo === "negocio") {
    const categoria = String(plan.category || "").toLowerCase();
    const datos = {
      ...comun,
      "@type": TIPO_SCHEMA_POR_CATEGORIA[categoria] || "LocalBusiness",
      address: { "@type": "PostalAddress", addressLocality: plan.location },
      openingHoursSpecification: horarioSchema(pitch.horario_semanal),
      ...precioSchema(pitch),
    };
    if (geo) datos.geo = geo;
    if (sameAs) datos.sameAs = sameAs;
    return JSON.stringify(datos, null, 2).replaceAll("</script", "<\\/script");
  }

  if (tipo === "evento") {
    const datos = {
      ...comun,
      "@type": "Event",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: plan.location,
        address: { "@type": "PostalAddress", addressLocality: plan.location },
        ...(geo ? { geo } : {}),
      },
      organizer: { "@type": "Organization", name: "Pitchmi", url: SITE_URL },
      ...precioSchema(pitch),
    };
    if (plan.dateValue) datos.startDate = plan.dateValue;
    if (sameAs) datos.sameAs = sameAs;
    return JSON.stringify(datos, null, 2).replaceAll("</script", "<\\/script");
  }

  const datos = {
    ...comun,
    "@type": "TouristAttraction",
    address: { "@type": "PostalAddress", addressLocality: plan.location },
    ...precioSchema(pitch),
  };
  if (geo) datos.geo = geo;
  if (sameAs) datos.sameAs = sameAs;
  return JSON.stringify(datos, null, 2).replaceAll("</script", "<\\/script");
}

/**
 * El título que sale en Google. Lleva el sitio, porque la gente busca «restaurante
 * en balat», no el nombre exacto del local — sin la ciudad compites sólo por el
 * nombre, que es la búsqueda que ya te encuentra.
 *
 * Se recorta a 60 caracteres antes de « | Pitchmi»: por encima de eso Google
 * corta el título y la parte útil se pierde.
 */
function tituloSEO(plan) {
  // Si el título ya nombra el sitio, no se repite: «La Fontcalda — Gandesa
  // (Tarragona) — Bot» tiene dos guiones y dice el lugar dos veces. Se compara sin
  // acentos y en minúsculas, palabra por palabra de la ubicación.
  const enTitulo = (texto) =>
    stripAccents(String(plan.title)).toLowerCase().includes(stripAccents(texto).toLowerCase());
  // No se añade nada si el título ya trae un guión largo o un paréntesis: cuando
  // Alida escribe «La Fontcalda — Gandesa (Tarragona)» el lugar ya está dicho, y
  // añadir « — Bot» deja dos guiones y dos sitios distintos en la misma línea.
  const yaLoDice = /[—(]/.test(String(plan.title));

  // Y del resto se añade SÓLO lo que el título no diga ya, parte por parte.
  //
  // La primera versión descartaba la ubicación entera si el título mencionaba
  // cualquier trozo: «TurguT restaurant Balat» con ubicación «Balat, Estambul» se
  // quedaba sin nada, y perdía «Estambul», que es la palabra por la que la gente
  // busca de verdad. Ahora queda «TurguT restaurant Balat — Estambul».
  const partes =
    tieneUbicacion(plan) && !yaLoDice
      ? plan.location.split(/,\s*/).filter((parte) => parte.length > 2 && !enTitulo(parte))
      : [];

  const sitio = partes.length > 0 ? ` — ${partes.join(", ")}` : "";
  let base = `${plan.title}${sitio}`;
  if (base.length > 60) base = `${base.slice(0, 57).trim()}…`;
  return `${base} | Pitchmi`;
}

function createPlanHTML(plan, relatedPlans) {
  const related = relatedPlans
    .filter((item) => item.slug !== plan.slug)
    .slice(0, 3);

  const relatedHTML = related
    .map(
      (item) => `
        <a class="related-card" href="/p/${escapeAttr(item.slug)}/">
          <div class="related-symbol">${escapeHTML(item.symbol)}</div>
          <div>
            <p>${escapeHTML(item.title)}</p>
            <span>${escapeHTML(item.location)}</span>
          </div>
        </a>
      `
    )
    .join("");

  const mediaBackground = plan.imageUrl
    ? `background-image: linear-gradient(135deg, rgba(36,35,33,0.12), rgba(36,35,33,0.12)), url('${escapeAttr(plan.imageUrl)}');`
    : "";

  const ogImage = plan.imageUrl
    ? `<meta property="og:image" content="${escapeAttr(plan.imageUrl)}" />`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHTML(tituloSEO(plan))}</title>
    <meta name="description" content="${escapeAttr(plan.metaDescription)}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" type="image/png" sizes="512x512" href="/favicon.png?v=3" />
<link rel="shortcut icon" type="image/png" href="/favicon.png?v=3" />
<link rel="apple-touch-icon" href="/favicon.png?v=3" />
<meta name="theme-color" content="#F8EFF4" />
<link rel="canonical" href="${escapeAttr(plan.url)}" />

    <meta property="og:title" content="${escapeAttr(tituloSEO(plan))}" />
    <meta property="og:description" content="${escapeAttr(plan.metaDescription)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeAttr(plan.url)}" />
    ${ogImage}

    <script type="application/ld+json">
${createStructuredData(plan)}
    </script>

    <style>
      @import url("https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500;1,600&display=swap");

      :root {
        --bg: #F7F2FA;
        --paper: rgba(255, 255, 255, 0.92);
        --text: #6E4266;
        --muted: #8A5F80;
        --line: rgba(44, 42, 40, 0.12);
        --sage: #8A5410;
        --sage-soft: #FFF0DE;
        --shadow: 0 22px 60px rgba(110, 66, 102, 0.10);
        --radius-xl: 34px;
        --radius-lg: 24px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Baloo 2", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.92), transparent 30%),
          radial-gradient(circle at 90% 8%, rgba(227, 228, 216, 0.72), transparent 26%),
          linear-gradient(180deg, #F3ECFF 0%, var(--bg) 52%, #FFF1E4 100%);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .page {
        width: min(1120px, 100%);
        margin: 0 auto;
        padding: 34px clamp(18px, 5vw, 72px) 34px;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: clamp(42px, 7vw, 78px);
      }

      .logo {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        width: fit-content;
        gap: 8px;
      }

      .logo-mark {
        font-family: "Playfair Display", Georgia, serif;
        font-style: italic;
        font-size: 17px;
        line-height: 1;
      }

      .logo-word {
        font-family: "Playfair Display", Georgia, serif;
        font-style: italic;
        font-size: 19px;
        letter-spacing: 0.34em;
        font-weight: 400;
      }

      .logo-line {
        width: 1px;
        height: 24px;
        background: var(--text);
        opacity: 0.82;
      }

      .button {
        min-height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(44, 42, 40, 0.18);
        padding: 0 17px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 650;
        cursor: pointer;
        white-space: nowrap;
      }

      .button-dark {
        background: #6E4266;
        color: #fff;
        border-color: #6E4266;
        box-shadow: 0 14px 28px rgba(110, 66, 102, 0.17);
      }

      .button-light {
        background: rgba(255, 255, 255, 0.68);
        color: var(--text);
      }

      .back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--muted);
        font-size: 13px;
        font-weight: 650;
        margin-bottom: 22px;
      }

      .detail {
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        gap: 0;
        border-radius: var(--radius-xl);
        overflow: hidden;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
        box-shadow: var(--shadow);
      }

      .media {
        min-height: 520px;
        background:
          radial-gradient(circle at 28% 24%, rgba(255, 255, 255, 0.64), transparent 22%),
          linear-gradient(135deg, #e8e1d7, #c9c2b2);
        background-size: cover;
        background-position: center;
        display: grid;
        place-items: center;
        font-size: 68px;
        ${mediaBackground}
      }

      .content {
        padding: clamp(26px, 4vw, 48px);
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .category {
        display: inline-flex;
        width: fit-content;
        border-radius: 999px;
        background: rgba(184, 176, 155, 0.18);
        color: #8A5F80;
        padding: 7px 11px;
        font-size: 10px;
        letter-spacing: 0.12em;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 16px;
      }

      h1 {
        font-family: "Playfair Display", Georgia, serif;
        font-style: italic;
        font-size: clamp(38px, 5vw, 62px);
        line-height: 1.02;
        font-weight: 400;
        letter-spacing: -0.06em;
        margin: 0 0 18px;
      }

      .meta {
        display: grid;
        gap: 7px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 22px;
      }

      .description {
        color: #45413c;
        font-size: 15.5px;
        line-height: 1.78;
        margin: 0 0 28px;
        white-space: pre-line;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .related {
        margin-top: 28px;
        border-radius: var(--radius-xl);
        background: rgba(255, 255, 255, 0.62);
        border: 1px solid var(--line);
        padding: 24px;
      }

      .related h2 {
        font-family: "Playfair Display", Georgia, serif;
        font-style: italic;
        font-weight: 400;
        letter-spacing: -0.045em;
        font-size: 30px;
        margin: 0 0 16px;
      }

      .related-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .related-card {
        display: grid;
        grid-template-columns: 42px 1fr;
        gap: 12px;
        align-items: center;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.62);
        padding: 14px;
      }

      .related-symbol {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: var(--sage-soft);
      }

      .related-card p {
        margin: 0 0 4px;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.35;
      }

      .related-card span {
        color: var(--muted);
        font-size: 12px;
      }

      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding-top: 34px;
        color: var(--muted);
        font-size: 12.5px;
      }

      .footer-logo {
        font-family: "Playfair Display", Georgia, serif;
        font-style: italic;
        letter-spacing: 0.34em;
        color: var(--text);
      }

      .footer-links {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      @media (max-width: 900px) {
        .detail {
          grid-template-columns: 1fr;
        }

        .media {
          min-height: 340px;
        }

        .related-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        .page {
          padding: 22px 14px;
        }

        .header {
          align-items: flex-start;
          flex-direction: column;
        }

        h1 {
          font-size: 44px;
        }

        footer {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    </style>
  </head>

  <body>
    <div class="page">
      <header class="header">
        <a class="logo" href="/" aria-label="Pitchmi">
            <span class="logo-line"></span>
          <span class="logo-word">PITCHMI</span>
          <span class="logo-line"></span>
          <span class="logo-mark">▾</span>
        </a>

        <a
          class="button button-dark"
          href="https://apps.apple.com/es/app/pitchmi/id6754662676"
          target="_blank"
          rel="noopener noreferrer"
        >
          Descargar la app
        </a>
      </header>

      <main>
        <a class="back" href="/planes.html">← Ver todos los planes</a>

        <article class="detail">
          <div class="media">${plan.imageUrl ? "" : escapeHTML(plan.symbol)}</div>

          <div class="content">
            <div class="category">${escapeHTML(plan.category)}</div>
            <h1>${escapeHTML(plan.title)}</h1>

            <div class="meta">
              <span>📍 ${escapeHTML(plan.location)}</span>
              <span>🗓️ ${escapeHTML(plan.dateLabel)}</span>
            </div>

            <p class="description">${escapeHTML(plan.description)}</p>

            <div class="actions">
              <a
                class="button button-dark"
                href="https://apps.apple.com/es/app/pitchmi/id6754662676"
                target="_blank"
                rel="noopener noreferrer"
              >
                Descargar en App Store
              </a>

              <a class="button button-light" href="/planes.html">
                Ver más planes
              </a>
            </div>
          </div>
        </article>

        ${
          relatedHTML
            ? `
              <section class="related">
                <h2>Más planes</h2>
                <div class="related-grid">
                  ${relatedHTML}
                </div>
              </section>
            `
            : ""
        }
      </main>

      <footer>
        <div class="footer-logo">PITCHMI</div>

        <div class="footer-links">
          <a href="/">Inicio</a>
          <a href="/planes.html">Planes</a>
          <a href="/privacy.html">Privacidad</a>
          <a href="mailto:admin@pitchmi.app">Contacto</a>
        </div>
      </footer>
    </div>
  </body>
</html>`;
}

function createSitemap(plans) {
  const today = new Date().toISOString();

  const staticUrls = [
    {
      loc: `${SITE_URL}/`,
      lastmod: today,
      priority: "1.0",
    },
    {
      loc: `${SITE_URL}/planes.html`,
      lastmod: today,
      priority: "0.9",
    },
    {
      loc: `${SITE_URL}/privacy.html`,
      lastmod: today,
      priority: "0.3",
    },
  ];

  const planUrls = plans.map((plan) => ({
    loc: plan.url,
    lastmod: plan.createdAt || today,
    priority: "0.8",
  }));

  const urls = [...staticUrls, ...planUrls];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${escapeHTML(item.loc)}</loc>
    <lastmod>${new Date(item.lastmod).toISOString()}</lastmod>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
}

function createRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

async function removeGeneratedPages() {
  await fs.rm(PAGES_DIR, { recursive: true, force: true });
  await fs.mkdir(PAGES_DIR, { recursive: true });
}

async function writePlanPages(plans) {
  for (const plan of plans) {
    const folder = path.join(PAGES_DIR, plan.slug);
    const file = path.join(folder, "index.html");

    await fs.mkdir(folder, { recursive: true });

    const related = plans.filter((item) => item.category === plan.category);
    const html = createPlanHTML(plan, related.length > 1 ? related : plans);

    await fs.writeFile(file, html, "utf8");
  }
}

async function writeSitemap(plans) {
  await fs.writeFile(
    path.join(LANDING_DIR, "sitemap.xml"),
    createSitemap(plans),
    "utf8"
  );
}

async function writeRobots() {
  await fs.writeFile(path.join(LANDING_DIR, "robots.txt"), createRobots(), "utf8");
}

async function main() {
  console.log("Pitchmi SEO build started...");

  const plans = await fetchPitches();

  await removeGeneratedPages();
  await writePlanPages(plans);
  await writeSitemap(plans);
  await writeRobots();

  console.log(`Generated ${plans.length} SEO pages.`);
  console.log("Generated sitemap.xml.");
  console.log("Generated robots.txt.");
  console.log("Pitchmi SEO build finished.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
