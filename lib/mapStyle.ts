// lib/mapStyle.ts
export const ICE_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f9fcfd" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3d4e5e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f9fcfd" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8899a7" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e6f1f5" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#eaf7fa" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#dce8ed" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#d9f0f9" }],
  },
];
