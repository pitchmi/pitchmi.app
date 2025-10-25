// components/ui/MapMiniPicker.tsx
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";

const C = "#3d4e5e";

export type LatLng = { lat: number; lng: number };

export default function MapMiniPicker({
  value,
  onChange,
  height = 180,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  height?: number;
}) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(
    value
      ? {
          latitude: value.lat,
          longitude: value.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : null
  );

  useEffect(() => {
    if (!value) return;
    setRegion((r) => ({
      latitude: value.lat,
      longitude: value.lng,
      latitudeDelta: r?.latitudeDelta ?? 0.01,
      longitudeDelta: r?.longitudeDelta ?? 0.01,
    }));
  }, [value]);

  const recenterMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      ...(Platform.OS === "android" ? { mayShowUserSettingsDialog: true } : {}),
    });
    const next: Region = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current?.animateToRegion(next, 300);
    onChange({ lat: next.latitude, lng: next.longitude });
    setRegion(next);
  };

  return (
    <View style={{ borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(61,78,94,0.15)" }}>
      <MapView
        ref={mapRef}
        style={{ height }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={
          region ?? { latitude: 41.387, longitude: 2.17, latitudeDelta: 0.15, longitudeDelta: 0.15 }
        }
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onChange({ lat: latitude, lng: longitude });
          setRegion((r) => ({
            latitude,
            longitude,
            latitudeDelta: r?.latitudeDelta ?? 0.01,
            longitudeDelta: r?.longitudeDelta ?? 0.01,
          }));
        }}
        showsCompass={false}
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {!!value && (
          <Marker
            draggable
            coordinate={{ latitude: value.lat, longitude: value.lng }}
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              onChange({ lat: latitude, lng: longitude });
            }}
          />
        )}
      </MapView>

      <View style={{ position: "absolute", right: 10, bottom: 10 }}>
        <Pressable
          onPress={recenterMe}
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            borderWidth: 1,
            borderColor: "rgba(61,78,94,0.15)",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: C, fontWeight: "700" }}>Usar mi ubicación</Text>
        </Pressable>
      </View>
    </View>
  );
}
