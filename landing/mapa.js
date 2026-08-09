/**
 * El mapa de la portada, vivo.
 *
 * Antes era una FOTO de un mapa (`map-hero.jpg`, 2,2 MB) con cinco pines de
 * adorno y etiquetas inventadas: bonito de lejos, pero no se movía, no eran
 * planes de verdad y no llevaba a ningún sitio.
 *
 * Ahora es un mapa de verdad con los planes reales de Pitchmi. Tres decisiones
 * que conviene entender antes de tocar esto:
 *
 * 1. **Sin claves.** Se usa MapLibre con los tiles de OpenFreeMap, que no piden
 *    token. La app usa Mapbox, y aquí también se podría — pero eso obliga a
 *    publicar un token en el HTML y a vigilar la cuota. Si algún día se quiere
 *    Mapbox, se cambia `ESTILO` por la URL de estilo de Mapbox y se le pasa la
 *    clave; el resto del fichero vale igual.
 *
 * 2. **La foto se queda como red de seguridad.** El fondo de `.map` sigue siendo
 *    `map-hero.jpg` (ahora de 99 kB, no de 2,2 MB). Si MapLibre no carga o los
 *    tiles fallan, la sección se ve como antes en vez de quedarse en blanco. Los
 *    adornos —la rejilla, los rombos y los cinco pines falsos— sólo se esconden
 *    **cuando el mapa ha cargado de verdad**.
 *
 * 3. **El movimiento se puede desactivar.** Hay gente a la que el movimiento le
 *    marea, y el sistema operativo lo dice: si `prefers-reduced-motion` está
 *    puesto, el mapa se queda quieto. No es un detalle opcional.
 */

const ESTILO = "https://tiles.openfreemap.org/styles/positron";
const SUPABASE_URL = "https://rcfehpjksmpjtvhrufhm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nlfsq0cZpnVsG9NLqs98SQ_pE24OyTp";

// Cataluña, que es donde está la mayoría de los planes. Se recentra en cuanto
// llegan los de verdad.
const CENTRO = [2.17, 41.55];

const TINTA = "#6E4266";
const PAPEL = "#F7F2FA";
const MELOCOTON = "#FFF1E4";

const quieto =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function planesConSitio() {
  const url =
    `${SUPABASE_URL}/rest/v1/pitches` +
    `?select=id,title,category,lat,lng,is_public&limit=200`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()).filter(
    (p) =>
      p.is_public !== false &&
      Number.isFinite(Number(p.lat)) &&
      Number.isFinite(Number(p.lng))
  );
}

/**
 * La dirección de la página del plan.
 *
 * Tiene que dar EXACTAMENTE el mismo resultado que `slugify` de
 * `build-pitches.mjs`, porque esas páginas ya están generadas con ese nombre. Si
 * las dos se separan, el pin lleva a un 404.
 */
function direccionDelPlan(plan) {
  const base = String(plan.title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  const sufijo = String(plan.id || "").slice(0, 8);
  const slug = base ? (sufijo ? `${base}-${sufijo}` : base) : `plan-${plan.id}`;
  return `/p/${slug}/`;
}

/** El pin: círculo de papel con el icono de la categoría, como en la app. */
function pin(plan) {
  const el = document.createElement("a");
  el.className = "mapa-pin";
  el.href = direccionDelPlan(plan);
  el.title = plan.title || "Plan en Pitchmi";
  el.setAttribute("aria-label", plan.title || "Plan en Pitchmi");
  el.innerHTML = window.iconoCategoria
    ? window.iconoCategoria(plan.category, 17, 1.5)
    : "";
  return el;
}

/** Tiñe el mapa hacia el papel de Pitchmi, sin tocar la legibilidad de las calles. */
function tenir(map) {
  const capas = map.getStyle().layers || [];
  for (const capa of capas) {
    const id = capa.id;
    try {
      if (capa.type === "background") {
        map.setPaintProperty(id, "background-color", PAPEL);
      } else if (/water|agua|sea|ocean/i.test(id) && capa.type === "fill") {
        map.setPaintProperty(id, "fill-color", "#E4E8F5");
      } else if (/park|wood|forest|grass|green/i.test(id) && capa.type === "fill") {
        map.setPaintProperty(id, "fill-color", "#EDF0E6");
      } else if (/landuse|residential|building/i.test(id) && capa.type === "fill") {
        map.setPaintProperty(id, "fill-color", MELOCOTON);
      } else if (capa.type === "symbol") {
        map.setPaintProperty(id, "text-color", TINTA);
        map.setPaintProperty(id, "text-halo-color", "#FFFFFF");
      }
    } catch {
      // Una capa que no acepta esa propiedad no es un error: se salta.
    }
  }
}

async function arrancar() {
  const caja = document.getElementById("mapaVivo");
  if (!caja || typeof maplibregl === "undefined") return;

  const map = new maplibregl.Map({
    container: caja,
    style: ESTILO,
    center: CENTRO,
    zoom: 6.4,
    attributionControl: { compact: true },
    // Sin scroll con la rueda: en una portada, atrapar el scroll de la página es
    // de las cosas que más molestan. Se navega arrastrando o con los botones.
    scrollZoom: false,
    cooperativeGestures: true,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

  map.on("load", async () => {
    tenir(map);
    document.querySelector(".map")?.classList.add("map--vivo");

    let planes = [];
    try {
      planes = await planesConSitio();
    } catch (e) {
      console.warn("No se pudieron cargar los planes del mapa:", e);
    }

    if (planes.length > 0) {
      const limites = new maplibregl.LngLatBounds();
      for (const plan of planes) {
        const punto = [Number(plan.lng), Number(plan.lat)];
        new maplibregl.Marker({ element: pin(plan), anchor: "center" })
          .setLngLat(punto)
          .addTo(map);
        limites.extend(punto);
      }
      // Un vuelo suave hasta donde están los planes: es el movimiento que cuenta
      // algo, en vez de moverse por moverse.
      map.fitBounds(limites, {
        padding: 64,
        maxZoom: 9.5,
        duration: quieto ? 0 : 2600,
      });
    }

    if (!quieto) {
      // Y luego una deriva muy lenta, que se para en cuanto alguien toca el mapa.
      let derivando = true;
      const parar = () => {
        derivando = false;
      };
      ["mousedown", "touchstart", "wheel", "keydown"].forEach((ev) =>
        map.getCanvas().addEventListener(ev, parar, { once: true, passive: true })
      );
      setTimeout(function deriva() {
        if (!derivando) return;
        map.easeTo({
          bearing: (map.getBearing() + 6) % 360,
          duration: 9000,
          easing: (t) => t,
        });
        setTimeout(deriva, 9000);
      }, 3200);
    }
  });

  map.on("error", (e) => {
    // Si los tiles no llegan, se retira el lienzo y vuelve a verse la foto de
    // fondo. Mejor la de siempre que un rectángulo gris.
    console.warn("El mapa no cargó:", e?.error?.message || e);
    caja.style.display = "none";
    document.querySelector(".map")?.classList.remove("map--vivo");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", arrancar);
} else {
  arrancar();
}
