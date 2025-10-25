// lib/map.ts
import type MapView from "react-native-maps";
import type { LatLng } from "react-native-maps";

export function fitToPoints(
  mapRef: React.RefObject<MapView | null>,
  points: LatLng[],
  edge = { top: 60, right: 60, bottom: 60, left: 60 }
) {
  if (!mapRef.current || points.length === 0) return;
  if (points.length === 1) {
    const p = points[0];
    mapRef.current.animateCamera({ center: p, zoom: 14 }, { duration: 300 });
    return;
  }
  mapRef.current.fitToCoordinates(points, { edgePadding: edge, animated: true });
}

export type ClusterWithChildren = {
  id: string;
  lat: number;
  lng: number;
  count: number;
  children: string[];
};

export function fitClusterByChildren(
  mapRef: React.RefObject<MapView | null>,
  cluster: ClusterWithChildren,
  idToCoord: Map<string, { latitude: number; longitude: number }>,
  edge = { top: 60, right: 60, bottom: 60, left: 60 }
) {
  if (!mapRef.current) return;
  const pts: LatLng[] = [];
  for (const id of cluster.children || []) {
    const c = idToCoord.get(id);
    if (c) pts.push({ latitude: c.latitude, longitude: c.longitude });
  }
  if (pts.length === 0) {
    fitToPoints(mapRef, [{ latitude: cluster.lat, longitude: cluster.lng }], edge);
    return;
  }
  fitToPoints(mapRef, pts, edge);
}
