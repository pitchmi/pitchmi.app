/**
 * Los iconos de categoría de Pitchmi, en la web.
 *
 * Son **los mismos trazos** que en la app: portados uno a uno de
 * `components/CategoryIcon.tsx`, con el mismo `viewBox 0 0 24 24`, sólo línea y
 * sin relleno. Antes la web usaba emojis (🎙️ 🍅 🎪 🍽️ ⛰️) y eran de otra familia
 * visual: cada sistema operativo los dibuja distinto y no se parecen a nada de la
 * app.
 *
 * Si se cambia un icono en la app, hay que cambiarlo aquí también. No hay forma
 * de compartir el fichero: uno es React Native y el otro HTML.
 */

const TRAZOS_CATEGORIA = {
  "gastronomía": [
    'path d="M8 12V21"',
    'path d="M6 3V7a2 2 0 0 0 4 0V3"',
    'path d="M8 3v4"',
    'path d="M16 3c1.6 .8 1.6 6.5 .2 8.4-.3 .5-.2 .9-.2 1.5V21"',
  ],
  rutas: [
    'circle cx="7" cy="6.5" r="2"',
    'path d="M3 20 L10 10 L14 15 L17 11 L21 20 Z"',
  ],
  evento: [
    'path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 a2 2 0 0 0 0 4 a2 2 0 0 1 0 4 a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 a2 2 0 0 0 0-4 a2 2 0 0 1 0-4 Z"',
    'path d="M14 6V18" stroke-dasharray="1.5 2"',
  ],
  experiencias: [
    'path d="M12 3C8 3 6 6 6 9c0 3 2.5 5.5 4 7h4c1.5-1.5 4-4 4-7 0-3-2-6-6-6 Z"',
    'path d="M12 3V16"',
    'path d="M9 4C8 8 8 12 10 16"',
    'path d="M15 4C16 8 16 12 14 16"',
    'path d="M10.7 16 H13.3 L13 21.2 H11 Z"',
  ],
  salud: [
    'path d="M12 21C6.5 16.5 6.5 7.5 12 3.5 C17.5 7.5 17.5 16.5 12 21 Z"',
    'path d="M12 6V18.5"',
  ],
  concierto: [
    'path d="M12 3a3 3 0 0 1 3 3v3.5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3 Z"',
    'path d="M6.5 10.5a5.5 5.5 0 0 0 11 0"',
    'path d="M12 16V20.5"',
    'path d="M8.5 20.5 H15.5"',
  ],
  ferias: [
    'circle cx="12" cy="11" r="7.5"',
    'circle cx="12" cy="11" r="1.4"',
    'path d="M12 3.5V18.5"',
    'path d="M4.5 11H19.5"',
    'path d="M6.7 5.7 L17.3 16.3"',
    'path d="M17.3 5.7 L6.7 16.3"',
    'path d="M8 21 L12 18.5 L16 21"',
  ],
  mercadillo: [
    'path d="M5.5 6 H18.5 L20 9 H4 Z"',
    'path d="M4 9c1.3 1.8 2.7 1.8 4 0s2.7 1.8 4 0 2.7 1.8 4 0 2.7 1.8 4 0"',
    'path d="M5.5 12V19H18.5V12"',
    'path d="M5.5 19H18.5"',
  ],
  // Ojo: en la app este icono es una luna CON UN DESTELLO al lado, y el destello
  // es justo lo que está prohibido en el proyecto. Aquí va sólo la luna hasta que
  // se decida con qué se acompaña.
  fiesta: ['path d="M17 14.5A7.5 7.5 0 1 1 9.5 5 a6 6 0 0 0 7.5 9.5 Z"'],
  arte: [
    'path d="M12 4C7 4 3 7.6 3 12c0 4.4 3.8 8 8.6 8 1.1 0 1.7-1 1.3-2-.5-1.2 .4-2.3 1.7-2.3H16a3.3 3.3 0 0 0 0-6.6h-1c-1.3 0-2-1.1-1.5-2.3C14 4.9 13.5 4 12 4 Z"',
    'circle cx="7.5" cy="9.5" r="1.1"',
    'circle cx="7.5" cy="14" r="1"',
    'circle cx="11" cy="16.5" r="1"',
  ],
  "con animales": [
    'path d="M12 14c-2.2 0-4 1.5-4 3.2 0 1.3 1.4 1.8 4 1.8s4-.5 4-1.8c0-1.7-1.8-3.2-4-3.2 Z"',
    'circle cx="7.5" cy="11" r="1.5"',
    'circle cx="10.6" cy="8.5" r="1.5"',
    'circle cx="13.4" cy="8.5" r="1.5"',
    'circle cx="16.5" cy="11" r="1.5"',
  ],
  otros: [
    'circle cx="12" cy="12" r="8.5"',
    'path d="M8.5 15.5 L11 11 L15.5 8.5 L13 13 Z"',
  ],
};

/** Los nombres que llegan de la base de datos no siempre son la clave exacta. */
function claveCategoria(texto) {
  const v = String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  if (v.includes("gastro") || v.includes("comida") || v.includes("restaur")) return "gastronomía";
  if (v.includes("ruta") || v.includes("senderis")) return "rutas";
  if (v.includes("experienc")) return "experiencias";
  if (v.includes("salud") || v.includes("bienestar") || v.includes("termal")) return "salud";
  if (v.includes("concierto") || v.includes("musica")) return "concierto";
  if (v.includes("feria")) return "ferias";
  if (v.includes("mercad")) return "mercadillo";
  if (v.includes("fiesta") || v.includes("noche")) return "fiesta";
  if (v.includes("arte") || v.includes("museo") || v.includes("libr")) return "arte";
  if (v.includes("animal") || v.includes("mascota")) return "con animales";
  if (v.includes("evento")) return "evento";
  return "otros";
}

/**
 * El icono como SVG listo para insertar.
 *
 * `currentColor` a propósito: así hereda el color del texto de donde se ponga y
 * no hay que pasarle un color en cada sitio.
 */
function iconoCategoria(categoria, tamano = 22, grosor = 1.4) {
  const trazos = TRAZOS_CATEGORIA[claveCategoria(categoria)] || TRAZOS_CATEGORIA.otros;
  const cuerpo = trazos
    .map((t) => `<${t} fill="none" stroke="currentColor" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round" />`)
    .join("");
  return (
    `<svg class="cat-icono" width="${tamano}" height="${tamano}" viewBox="0 0 24 24" ` +
    `aria-hidden="true" focusable="false">${cuerpo}</svg>`
  );
}

if (typeof window !== "undefined") {
  window.iconoCategoria = iconoCategoria;
  window.claveCategoria = claveCategoria;
}
