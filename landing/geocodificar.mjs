/**
 * Rellena `ubicaciones.json`: el nombre del sitio de cada plan, sacado de sus
 * coordenadas.
 *
 * Por qué existe: en la base de datos `place_name` está vacío en TODOS los planes,
 * así que las 94 páginas de la web decían «Ubicación disponible en Pitchmi». Una
 * página que nunca dice «Balat» no puede salir cuando alguien busca «restaurante
 * en Balat», y ése es justo el motivo de tener estas páginas.
 *
 * Cómo se usa:
 *
 *     node landing/geocodificar.mjs
 *
 * Sólo pide las que faltan y **el resultado se commitea**, así que el build de
 * Netlify no depende de ningún servicio externo: lee el fichero y listo.
 *
 * Se respeta la política de uso de Nominatim: una petición por segundo y un
 * User-Agent que dice quién llama. Si algún día son miles de planes, esto se
 * sustituye por guardar la ciudad al publicar (que es lo que debería pasar: la
 * app ya resuelve el nombre del sitio en el móvil, sólo hay que guardarlo).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FICHERO = path.join(AQUI, "ubicaciones.json");

const SUPABASE_URL = "https://rcfehpjksmpjtvhrufhm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nlfsq0cZpnVsG9NLqs98SQ_pE24OyTp";
const AGENTE = "pitchmi-landing-build/1.0 (admin@pitchmi.app)";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * De la respuesta de Nominatim al texto que se lee bien: «Balat, Estambul».
 *
 * Se evita repetir el barrio si coincide con la ciudad, y se recorta «Mahallesi»,
 * «Barrio de» y compañía, que en un título ocupan sitio y no aportan.
 */
function etiqueta(direccion) {
  const limpia = (v) =>
    String(v || "")
      .replace(/\b(Mahallesi|Mahalle|Barrio de|Distrito de)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const barrio = limpia(direccion.suburb || direccion.neighbourhood || direccion.quarter);
  const ciudad = limpia(
    direccion.city || direccion.town || direccion.village || direccion.municipality
  );
  const provincia = limpia(direccion.state || direccion.province || direccion.county);

  const partes = [];
  if (barrio && barrio.toLowerCase() !== ciudad.toLowerCase()) partes.push(barrio);
  if (ciudad) partes.push(ciudad);
  if (partes.length === 0 && provincia) partes.push(provincia);
  return partes.slice(0, 2).join(", ");
}

async function leerCache() {
  try {
    return JSON.parse(await fs.readFile(FICHERO, "utf8"));
  } catch {
    return {};
  }
}

async function planes() {
  const url = `${SUPABASE_URL}/rest/v1/pitches?select=id,title,lat,lng&limit=500`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()).filter(
    (p) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))
  );
}

async function unaVez(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}` +
    `&format=json&zoom=14&accept-language=es`;
  const res = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const datos = await res.json();
  return etiqueta(datos.address || {});
}

async function main() {
  const cache = await leerCache();
  const lista = await planes();
  const faltan = lista.filter((p) => !cache[p.id]);

  console.log(`${lista.length} planes con coordenadas · ${faltan.length} por resolver.`);

  // Se guarda SOBRE LA MARCHA, no al final. A una petición por segundo esto
  // tarda minutos, y si el proceso se corta a mitad —un timeout, un Ctrl+C— con
  // el guardado al final se pierde todo el trabajo y hay que volver a pedirlo.
  // Ordenado por clave para que el diff de git sólo enseñe lo que ha cambiado.
  const guardar = async () =>
    fs.writeFile(
      FICHERO,
      `${JSON.stringify(Object.fromEntries(Object.entries(cache).sort()), null, 2)}\n`,
      "utf8"
    );

  let hechos = 0;
  for (const plan of faltan) {
    try {
      const nombre = await unaVez(plan.lat, plan.lng);
      if (nombre) {
        cache[plan.id] = nombre;
        hechos += 1;
        await guardar();
        console.log(`  ${nombre}  ←  ${String(plan.title).slice(0, 40)}`);
      } else {
        console.log(`  (sin nombre)  ←  ${String(plan.title).slice(0, 40)}`);
      }
    } catch (e) {
      console.log(`  fallo en ${String(plan.title).slice(0, 40)}: ${e.message}`);
    }
    await esperar(1100); // una por segundo, como pide Nominatim
  }

  await guardar();
  console.log(`Guardadas ${Object.keys(cache).length} ubicaciones (${hechos} nuevas).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
