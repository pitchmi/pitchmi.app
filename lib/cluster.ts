// lib/cluster.ts
// Clustering por grid en Web Mercator para react-native-maps
// API: clusterGrid(points, region, cellSizePx)
// Devuelve: Array de { type:"cluster", ... } | { type:"point", ... }

import { Dimensions } from "react-native";
import type { Region } from "react-native-maps";

/** Punto básico que tu mapa consume */
export type ClusterPoint = {
  id: string;
  lat: number;
  lng: number;
  // campos opcionales que solemos propagar al callout
  title?: string;
  user_id?: string;
  image_url?: string | null;
  description?: string | null;
};

export type GridCluster = {
  type: "cluster";
  id: string;          // id derivado de la celda
  lat: number;
  lng: number;
  count: number;
  // opcional, útil si quieres abrir un modal con los hijos
  children: ClusterPoint[];
};

export type GridPoint = ClusterPoint & { type: "point" };

export type ClusterOutput = GridCluster | GridPoint;

// --- util: zoom & proyección (Web Mercator) ---

const TILE_SIZE = 256;

/** Aproxima nivel de zoom desde longitudeDelta (Google/Apple style) */
export function zoomFromRegion(region: Region): number {
  // 360° de ancho / delta actual => escala; log2 para zoom
  const zoom = Math.log2(360 / region.longitudeDelta);
  // clamp a [1..20] por seguridad
  return Math.max(1, Math.min(20, zoom));
}

/** Proyecta lat/lon a coordenadas de "mundo" en píxeles al zoom dado */
export function project(lat: number, lng: number, zoom: number) {
  const siny = Math.sin((lat * Math.PI) / 180);
  const x = ((lng + 180) / 360) * TILE_SIZE * Math.pow(2, zoom);
  const y =
    (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) *
    TILE_SIZE *
    Math.pow(2, zoom);
  return { x, y };
}

/** Inversa de project: de píxeles del mundo a lat/lon */
export function unproject(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

// --- clustering ---

/**
 * Crea clusters por celda de grid en coordenadas de pantalla (px) para un region dado.
 * cellSizePx: tamaño de celda en píxeles (recomendado 48–72). Tú usas 64 en index.tsx.
 */
export function clusterGrid(
  points: ClusterPoint[],
  region: Region,
  cellSizePx = 64
): ClusterOutput[] {
  if (!points.length) return [];

  const zoom = zoomFromRegion(region);

  // Tamaño de pantalla (solo para orientar densidades; no hace falta exactitud)
  const { width, height } = Dimensions.get("window");
  // Nota: no necesitamos mapear a px de pantalla; usamos "world px" y celdas en px también.

  // Agrupa por celda
  type Bucket = {
    sumX: number;
    sumY: number;
    count: number;
    items: ClusterPoint[];
  };
  const buckets = new Map<string, Bucket>();

  const toCellKey = (x: number, y: number) => {
    const cx = Math.floor(x / cellSizePx);
    const cy = Math.floor(y / cellSizePx);
    return `${cx}:${cy}`;
  };

  for (const p of points) {
    const { x, y } = project(p.lat, p.lng, zoom);
    const key = toCellKey(x, y);
    const b = buckets.get(key);
    if (b) {
      b.sumX += x;
      b.sumY += y;
      b.count += 1;
      b.items.push(p);
    } else {
      buckets.set(key, { sumX: x, sumY: y, count: 1, items: [p] });
    }
  }

  const out: ClusterOutput[] = [];
  for (const [key, b] of buckets.entries()) {
    if (b.count === 1) {
      const p = b.items[0];
      out.push({ ...p, type: "point" });
      continue;
    }
    const cx = b.sumX / b.count;
    const cy = b.sumY / b.count;
    const { lat, lng } = unproject(cx, cy, zoom);
    out.push({
      type: "cluster",
      id: `c:${key}`,
      lat,
      lng,
      count: b.count,
      children: b.items,
    });
  }

  // Orden opcional: clusters primero para evitar tap targets solapados
  out.sort((a, b) => {
    if (a.type === "cluster" && b.type === "point") return -1;
    if (a.type === "point" && b.type === "cluster") return 1;
    // por densidad
    if (a.type === "cluster" && b.type === "cluster") return b.count - a.count;
    return 0;
  });

  return out;
}

/**
 * Helper: a veces quieres "expandir" un cluster cuando el usuario toca.
 * Devuelve un radio sugerido para animar zoom (reduce deltas a la mitad).
 */
export function nextZoomRegion(region: Region) {
  return {
    ...region,
    latitudeDelta: region.latitudeDelta * 0.5,
    longitudeDelta: region.longitudeDelta * 0.5,
  };
}
