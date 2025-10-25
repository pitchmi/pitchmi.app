// app/(tabs)/index.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Platform, Pressable, StyleSheet, Text, View, Dimensions, ScrollView
} from "react-native";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { getBool } from "@/lib/storage";
import { TERMS_KEY } from "@/lib/constants";
import { subscribeSearchLinks } from "@/lib/links";
import { useSession } from "@/lib/session";
import { useToast } from "@/components/Toast";
import TermsGate from "@/components/TermsGate";
import BottomSheet, { type PitchPreview } from "@/components/ui/BottomSheet";
import TopBar from "@/components/ui/TopBar";
import { useDebounced } from "@/lib/useDebounced";
import { fetchPitches, searchPitches, type SearchResult } from "@/lib/pitches";
import { CATEGORY_COLORS, type CategoryKey } from "@/lib/categories";
import { formatRadius } from "@/lib/geo";

// Marca Pitchmi
const C = "#3d4e5e";              // color principal
const BRAND_C = C;                  // usar el mismo tono para títulos
const BLUE = "#2F6BFF";            // acento
const GLASS = "rgba(255,255,255,0.9)";

// Tipografías
const FONT_TITLE = "LibreBaskerville-Bold";
const FONT_TEXT  = "LibreBaskerville-Regular";

const W = Dimensions.get("window").width;
const clamp = (v:number, lo:number, hi:number)=>Math.max(lo, Math.min(hi, v));
const TITLE_SIZE = clamp(Math.round(W * 0.11), 38, 50);
const SUB_SIZE = 12;
const DEFAULT_BRAND_H = TITLE_SIZE + 8 + SUB_SIZE;

// UI
const SEARCH_H = 44;
const SEARCH_PAD_V = 6;
const INPUT_MIN_H = 28;

const RAIL_SIZE = 36;
const RAIL_TXT = 14;

const CHIP_PAD_V = 5;
const CHIP_PAD_H = 10;
const CHIP_FONT  = 13;

const CARD_W = Math.min(260, Math.round(W * 0.70));
const CARD_IMG_H = 86;

function CategoryPin({ color, live }: { color: string; live: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => { if (!live) return; const id = setInterval(() => setT(s=>s+1), 900); return () => clearInterval(id); }, [live]);
  const pulse = live ? 1 + (t % 2 === 0 ? 0.6 : 0) : 1;
  return (
    <View style={{ alignItems:"center" }}>
      {live && <View style={{ position:"absolute", width:36, height:36, borderRadius:18, backgroundColor:color, opacity:0.18, transform:[{ scale:pulse }] }} />}
      <View style={{ width:18, height:18, borderRadius:9, backgroundColor:color, borderWidth:2, borderColor:"#fff" }} />
      <View style={{ width:0, height:0, borderLeftWidth:6, borderRightWidth:6, borderTopWidth:8, borderLeftColor:"transparent", borderRightColor:"transparent", borderTopColor:color, marginTop:-1 }} />
    </View>
  );
}
const nowIsLive = (s?: string|null, e?: string|null) => !!s && !!e && Date.now() >= Date.parse(s) && Date.now() <= Date.parse(e);
const textOn = (hex:string) => {
  const h = hex.replace("#",""); const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return (0.299*r+0.587*g+0.114*b)/255 > 0.6 ? "#1a2330" : "#fff";
};

export default function HomeMap() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { session } = useSession();
  const toast = useToast();

  const [region, setRegion] = useState<Region|null>(null);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(0);

  const [query, setQuery] = useState("");
  const q = useDebounced(query, 300);
  const [sugs, setSugs] = useState<SearchResult[]>([]);
  const [sheetData, setSheetData] = useState<PitchPreview|null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showTermsGate, setShowTermsGate] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const CAT_KEYS = useMemo(() => Object.keys(CATEGORY_COLORS) as CategoryKey[], []);
  const [activeCat, setActiveCat] = useState<CategoryKey | null>(null);

  const TITLE_TOP = insets.top + 4;
  const [brandH, setBrandH] = useState(DEFAULT_BRAND_H);
  const SEARCH_TOP = TITLE_TOP + brandH + 8;
  const CHIPS_TOP  = SEARCH_TOP + SEARCH_H + 10;
  const RAIL_TOP   = CHIPS_TOP + 64;

  const [pitches, setPitches] = useState<any[]>([]);
  const PAGE = 200;

  useEffect(() => { const u = subscribeSearchLinks(({ q }) => { if (typeof q === "string") setQuery(q); }); return u; }, []);
  useEffect(() => { (async () => setShowTermsGate(!(await getBool(TERMS_KEY))))(); }, []);

  const getLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permiso denegado","Activa la localización para centrar el mapa."); return null; }
    const loc = await Location.getCurrentPositionAsync({});
    const next: Region = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 };
    setRegion(next);
    return next;
  }, []);

  const loadPitches = useCallback(async () => {
    const rows = await fetchPitches(null, q ?? "", 0, PAGE);
    setPitches(rows);
  }, [q]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { await getLocation(); await loadPitches(); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [getLocation, loadPitches]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = query.trim();
      if (s.length < 2) { if (alive) setSugs([]); return; }
      try { const rows = await searchPitches(s, 8); if (alive) setSugs(rows); }
      catch { if (alive) setSugs([]); }
    })();
    return () => { alive = false; };
  }, [query]);

  const recenter = useCallback(async () => { const loc = await getLocation(); if (loc) mapRef.current?.animateToRegion(loc, 350); }, [getLocation]);
  const cycleRadius = useCallback(async () => { const next = radius===0?1000:radius===1000?5000:radius===5000?20000:0; setRadius(next); toast.show(`Radio: ${formatRadius(next)}`); await Haptics.selectionAsync(); }, [radius, toast]);
  const goNewPitch = useCallback(async () => { if (!session) { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toast.show("Inicia sesión para publicar"); router.push("/auth"); return; } router.push("/new-pitch"); }, [session, toast]);

  const openSheet = useCallback((p:any) => {
    setSheetData({ id:p.id, title:p.title, description:p.description ?? null, image_url:p.image_url ?? null, image_urls:p.image_urls ?? null, lat:p.lat, lng:p.lng, live_start_at:p.live_start_at ?? null, live_end_at:p.live_end_at ?? null });
    setSheetOpen(true);
  }, []);

  const visible = useMemo(() => {
    if (!region) return pitches.slice(0, PAGE);
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const minLat = latitude - latitudeDelta / 1.8, maxLat = latitude + latitudeDelta / 1.8;
    const minLng = longitude - longitudeDelta / 1.8, maxLng = longitude + longitudeDelta / 1.8;
    let rows = pitches.filter(p => p.lat>=minLat && p.lat<=maxLat && p.lng>=minLng && p.lng<=maxLng);
    if (activeCat) rows = rows.filter(p => ((p as any).category ?? "otros") === activeCat);
    return rows.slice(0, PAGE);
  }, [pitches, region, activeCat]);

  if (loading || !region) {
    return (
      <View style={{ flex:1, backgroundColor:"#f9fcfd", alignItems:"center", justifyContent:"center" }}>
        <StatusBar style="dark" />
        <ActivityIndicator />
        <Text style={{ marginTop:8, color:C }}>Cargando…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:"#f9fcfd" }}>
      <StatusBar style="dark" />

      {/* MAPA */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        provider={Platform.OS==="android"?PROVIDER_GOOGLE:undefined}
        showsUserLocation
      >
        {visible.map((p) => {
          const color = CATEGORY_COLORS[((p as any).category as CategoryKey) ?? "otros"] ?? "#2f6bff";
          const live = nowIsLive((p as any).live_start_at, (p as any).live_end_at);
          return (
            <Marker key={p.id} coordinate={{ latitude:p.lat, longitude:p.lng }} onPress={()=>openSheet(p)}>
              <CategoryPin color={color} live={live} />
            </Marker>
          );
        })}
      </MapView>

      {/* SCRIM: gradiente más presente y más alto */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,1)", "rgba(255,255,255,0.94)", "rgba(255,255,255,0)"]}
        locations={[0, 0.4, 0.92]}
        style={[styles.headerScrim, { height: CHIPS_TOP + 20 }]}
      />

      {/* HEADER con más aire sobre el menú */}
      <View style={[styles.headerAbs, { top: TITLE_TOP }]} pointerEvents="box-none">
        <Pressable onPress={()=>setMenuOpen(true)} style={styles.menuPill} accessibilityLabel="Abrir menú">
          <Text style={styles.menuIcon}>☰</Text>
          <Text style={styles.menuLabel}> Menú</Text>
        </Pressable>

        <View onLayout={(e)=> setBrandH(Math.ceil(e.nativeEvent.layout.height))} style={styles.brandWrap}>
          <Text style={styles.brandTitle}>Pitchmi</Text>
          <Text style={styles.brandSub}>tu mapa del ahora</Text>
        </View>
      </View>

      {/* BUSCADOR fino */}
      <View pointerEvents="box-none" style={[styles.abs, { top: SEARCH_TOP, left:18, right:18 }]}>
        <TopBar
          style={[styles.searchBox, { height: SEARCH_H, paddingVertical: SEARCH_PAD_V }]}
          inputStyle={{ backgroundColor:"transparent", minHeight: INPUT_MIN_H }}
          query={query}
          setQuery={setQuery}
          placeholder="Buscar por título o descripción…"
          onSubmit={() => fetchPitches(null, q ?? "", 0, PAGE).then(setPitches)}
          suggestions={sugs.map(s=>({ id:s.id, title:s.title, description:s.description ?? "" }))}
          onPick={(id)=>{ const row=sugs.find(x=>x.id===id); if(!row) return; setSugs([]); openSheet(row); }}
          onFocusInput={()=>setSheetOpen(false)}
        />
      </View>

      {/* CATEGORÍAS delgadas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.abs, { top: CHIPS_TOP }]}
        contentContainerStyle={{ paddingHorizontal:18, gap:8 }}
      >
        <Pressable
          onPress={()=>setActiveCat(null)}
          style={[styles.chip, { backgroundColor:"#fff", borderWidth: activeCat?0:2, borderColor:"rgba(0,0,0,0.08)" }]}
        >
          <Text style={[styles.chipTxt, { color:C }]}>Todo</Text>
        </Pressable>

        {(Object.keys(CATEGORY_COLORS) as CategoryKey[]).map((k)=>{
          const bg = CATEGORY_COLORS[k] ?? "#999";
          const tc = textOn(bg);
          const active = activeCat === k;
          return (
            <Pressable
              key={k}
              onPress={()=>setActiveCat(active ? null : k)}
              style={[styles.chip, { backgroundColor:bg, borderWidth: active ? 2 : 0, borderColor: active ? "rgba(0,0,0,0.12)" : "transparent" }]}
            >
              <Text style={[styles.chipTxt, { color: tc }]}>{k}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* RAIL más abajo */}
      <View pointerEvents="box-none" style={[styles.abs, { top: RAIL_TOP, right:16, alignItems:"flex-end" }]}>
        <Pressable style={styles.railRound} onPress={recenter}><Text style={styles.railTxt}>◎</Text></Pressable>
        <Pressable style={[styles.railRound, { marginTop:10 }]} onPress={cycleRadius}><Text style={styles.railTxt}>R</Text></Pressable>
      </View>

      {/* FAB */}
      <Pressable style={styles.fabPlus} onPress={goNewPitch}><Text style={styles.fabPlusTxt}>＋</Text></Pressable>

      {/* CARRUSEL transparente */}
      {visible.length>0 && (
        <View style={styles.carouselWrap} pointerEvents="box-none">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal:14, gap:12, paddingVertical:0 }}
          >
            {visible.slice(0,12).map((p)=>(
              <Pressable key={p.id} style={styles.card} onPress={()=>openSheet(p)}>
                <Image source={p.image_url ? { uri:p.image_url } : require("@/assets/placeholder.png")} style={styles.cardImg} />
                <View style={{ padding:10 }}>
                  <Text numberOfLines={2} style={styles.cardTitle}>{p.title}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <BottomSheet visible={sheetOpen} data={sheetData} onClose={()=>setSheetOpen(false)} />
      <TermsGate visible={showTermsGate} onDismiss={()=>setShowTermsGate(false)} />

      {menuOpen && (
        <View style={styles.menuBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={()=>setMenuOpen(false)} />
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Menú</Text>
            <Pressable style={styles.menuItem} onPress={()=>{ setMenuOpen(false); router.push("/auth"); }}><Text style={styles.menuItemTxt}>Entrar / Registrar</Text></Pressable>
            <Pressable style={styles.menuItem} onPress={()=>{ setMenuOpen(false); router.push("/new-pitch"); }}><Text style={styles.menuItemTxt}>New Pitch</Text></Pressable>
            <Pressable style={styles.menuItem} onPress={()=>{ setMenuOpen(false); router.push("/portafolio"); }}><Text style={styles.menuItemTxt}>Portafolio</Text></Pressable>
            <Pressable style={styles.menuItem} onPress={()=>{ setMenuOpen(false); router.push("/(tabs)/legal"); }}><Text style={styles.menuItemTxt}>Términos y Condiciones</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  abs:{ position:"absolute", left:0, right:0, zIndex:55 },

  headerScrim:{ position:"absolute", top:0, left:0, right:0, zIndex:50 },

  headerAbs:{ position:"absolute", left:0, right:0, zIndex:60, paddingHorizontal:18 },
  brandWrap:{ alignItems:"center", paddingBottom:4, paddingTop:12 },
  brandTitle:{
    fontFamily: FONT_TITLE,
    fontSize:TITLE_SIZE,
    color:BRAND_C,
    letterSpacing:0.2,
    textShadowColor:"rgba(255,255,255,0.9)",
    textShadowOffset:{ width:0, height:1 },
    textShadowRadius:8,
  },
  brandSub:{
    marginTop:6,
    color:BRAND_C,
    opacity:0.9,
    fontSize:SUB_SIZE,
    letterSpacing:3,
    fontWeight:"700",
    fontFamily: FONT_TEXT,
    textShadowColor:"rgba(255,255,255,0.7)",
    textShadowOffset:{ width:0, height:1 },
    textShadowRadius:4,
  },

  menuPill:{ position:"absolute", right:18, top:0, flexDirection:"row", alignItems:"center", backgroundColor:"#E6F0FF", paddingHorizontal:12, paddingVertical:8, borderRadius:16, shadowColor:"#000", shadowOpacity:0.10, shadowRadius:6, shadowOffset:{width:0,height:3}, elevation:3 },
  menuIcon:{ color:BRAND_C, fontSize:14, fontWeight:"800" },
  menuLabel:{ color:BRAND_C, fontSize:15, fontWeight:"700", fontFamily: FONT_TEXT },

  searchBox:{ backgroundColor:"#fff", borderRadius:14, shadowColor:"#000", shadowOpacity:0.12, shadowRadius:10, shadowOffset:{ width:0, height:4 }, elevation:4 },

  chip:{
    paddingHorizontal: CHIP_PAD_H,
    paddingVertical:   CHIP_PAD_V,
    borderRadius: 14,
    shadowColor:"#000",
    shadowOpacity:0.06,
    shadowRadius:4,
    shadowOffset:{width:0,height:2},
    elevation:2,
    alignSelf:"flex-start",
  },
  chipTxt:{ fontSize: CHIP_FONT, fontWeight: "700", fontFamily: FONT_TEXT },

  railRound:{ width:RAIL_SIZE, height:RAIL_SIZE, borderRadius:RAIL_SIZE/2, backgroundColor:GLASS, alignItems:"center", justifyContent:"center", shadowColor:"#000", shadowOpacity:0.1, shadowRadius:6, shadowOffset:{width:0,height:3}, elevation:3 },
  railTxt:{ color:C, fontSize:RAIL_TXT, fontWeight:"700" },

  fabPlus:{ position:"absolute", right:16, bottom:200, width:56, height:56, borderRadius:28, backgroundColor:BLUE, alignItems:"center", justifyContent:"center", zIndex:55, shadowColor:"#000", shadowOpacity:0.18, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:6 },
  fabPlusTxt:{ color:"#fff", fontSize:28, fontWeight:"800", marginTop:-2 },

  // carrusel transparente
  carouselWrap:{ position:"absolute", left:0, right:0, bottom:18, zIndex:56, backgroundColor:"transparent", borderRadius:0, paddingVertical:0, shadowOpacity:0, elevation:0 },
  card:{ width:CARD_W, backgroundColor:"#fff", borderRadius:14, overflow:"hidden", shadowColor:"#000", shadowOpacity:0.12, shadowRadius:8, shadowOffset:{ width:0, height:4 }, elevation:3 },
  cardImg:{ width:"100%", height:CARD_IMG_H, backgroundColor:"#eef2f6" },
  cardTitle:{ color:C, fontSize:15, fontWeight:"700", fontFamily: FONT_TEXT },

  menuBackdrop:{ ...StyleSheet.absoluteFillObject, zIndex:70, justifyContent:"flex-start", alignItems:"flex-end" },
  menuCard:{ marginTop:90, marginRight:14, width:240, backgroundColor:"#fff", borderRadius:16, paddingVertical:12, paddingHorizontal:12, shadowColor:"#000", shadowOpacity:0.2, shadowRadius:10, shadowOffset:{ width:0, height:6 }, elevation:8 },
  menuTitle:{ color:C, fontSize:16, fontWeight:"700", marginBottom:6, paddingHorizontal:4 },
  menuItem:{ paddingVertical:10, paddingHorizontal:8, borderRadius:10 },
  menuItemTxt:{ color:C, fontSize:15, fontWeight:"600" },
});
