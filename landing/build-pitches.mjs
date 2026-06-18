const fs = require("node:fs/promises");
const path = require("node:path");

const SITE_URL = "https://pitchmi.app";
const LANDING_DIR = path.join(process.cwd(), "landing");
const PAGES_DIR = path.join(LANDING_DIR, "p");

const SUPABASE_URL = "https://rcfehpjksmpjtvhrufhm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZmVocGprc21wanR2aHJ1ZmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDcsImV4cCI6MjA3NzU4MjgwN30.XYSRCeGBN74QYAtgcbSz2N47xvQWwVwC4rEZWCKcOpQ";

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
      pitch.town,
    "Ubicación disponible en Pitchmi"
  );
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
    pitch.date ||
    pitch.created_at ||
    ""
  );
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
  if (value.includes("fiesta") || value.includes("noche")) return "✦";
  if (value.includes("evento")) return "🎟️";
  if (value.includes("deporte")) return "◌";
  if (value.includes("lugar")) return "⌖";
  if (value.includes("experiencia")) return "◇";

  return "✦";
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

  return data.map(normalizePitch);
}

function createStructuredData(plan) {
  const eventData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: plan.title,
    description: plan.description,
    url: plan.url,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: plan.location,
      address: plan.location,
    },
    organizer: {
      "@type": "Organization",
      name: "Pitchmi",
      url: SITE_URL,
    },
  };

  if (plan.dateValue) {
    eventData.startDate = plan.dateValue;
  }

  if (plan.imageUrl) {
    eventData.image = [plan.imageUrl];
  }

  return JSON.stringify(eventData, null, 2).replaceAll("</script", "<\\/script");
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
    <title>${escapeHTML(plan.title)} | Pitchmi</title>
    <meta name="description" content="${escapeAttr(plan.metaDescription)}" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="canonical" href="${escapeAttr(plan.url)}" />

    <meta property="og:title" content="${escapeAttr(`${plan.title} | Pitchmi`)}" />
    <meta property="og:description" content="${escapeAttr(plan.metaDescription)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeAttr(plan.url)}" />
    ${ogImage}

    <script type="application/ld+json">
${createStructuredData(plan)}
    </script>

    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap");

      :root {
        --bg: #f7f4ef;
        --paper: #fffdf8;
        --text: #242321;
        --muted: #766f67;
        --line: rgba(44, 42, 40, 0.12);
        --sage: #8b9078;
        --sage-soft: #e3e4d8;
        --shadow: 0 22px 60px rgba(44, 42, 40, 0.08);
        --radius-xl: 34px;
        --radius-lg: 24px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.92), transparent 30%),
          radial-gradient(circle at 90% 8%, rgba(227, 228, 216, 0.72), transparent 26%),
          linear-gradient(180deg, #fbf8f2 0%, var(--bg) 52%, #f1ece3 100%);
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
        font-family: "Libre Baskerville", Georgia, serif;
        font-size: 17px;
        line-height: 1;
      }

      .logo-word {
        font-family: "Libre Baskerville", Georgia, serif;
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
        background: #242321;
        color: #fff;
        border-color: #242321;
        box-shadow: 0 14px 28px rgba(44, 42, 40, 0.17);
      }

      .button-light {
        background: rgba(255, 253, 248, 0.68);
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
        background: rgba(255, 253, 248, 0.72);
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
        color: #6d645b;
        padding: 7px 11px;
        font-size: 10px;
        letter-spacing: 0.12em;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 16px;
      }

      h1 {
        font-family: "Libre Baskerville", Georgia, serif;
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
        background: rgba(255, 253, 248, 0.62);
        border: 1px solid var(--line);
        padding: 24px;
      }

      .related h2 {
        font-family: "Libre Baskerville", Georgia, serif;
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
        font-family: "Libre Baskerville", Georgia, serif;
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
          <span class="logo-mark">✦</span>
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

  console.log(`Fetched ${plans.length} pitches from Supabase.`);

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
