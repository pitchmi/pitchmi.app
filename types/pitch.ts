// types/pitch.ts
export type Pitch = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  lat: number;
  lng: number;
  image_url?: string | null;
  image_urls?: string[] | null;
  live_start_at?: string | null;
  live_end_at?: string | null;
  category?:
    | "gastronomia"
    | "lugares"
    | "fiesta"
    | "rutas"
    | "mercadillos"
    | "noche"
    | "ferias"
    | "evento"
    | "deporte"
    | "otros"
    | null;
  created_at?: string;
};
