import React from "react";
import { View } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  Rect,
} from "react-native-svg";

export default function HeaderAura({
  height = 132,
  edge = 22,
}: {
  height?: number;
  edge?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
        zIndex: 18,
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          {/* Top wash: blanco → transparente */}
          <SvgLinearGradient id="topWash" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </SvgLinearGradient>

          {/* Halo azul suave detrás del título */}
          <SvgRadialGradient
            id="halo"
            cx="50%"
            cy="35%"
            rx="50%"
            ry="65%"
            fx="50%"
            fy="35%"
          >
            <Stop offset="0" stopColor="#cfe6ff" stopOpacity={0.9} />
            <Stop offset="0.55" stopColor="#e7f1ff" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </SvgRadialGradient>

          {/* Nieblas laterales */}
          <SvgLinearGradient id="leftFog" x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </SvgLinearGradient>
          <SvgLinearGradient id="rightFog" x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
            <Stop offset="1" stopColor="#ffffff" stopOpacity={0.9} />
          </SvgLinearGradient>
        </Defs>

        {/* capa top */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#topWash)" />
        {/* halo central */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#halo)" />
        {/* bordes */}
        <Rect x="0" y="0" width={edge} height="100%" fill="url(#leftFog)" />
        <Rect
          x="100%"
          y="0"
          width={edge}
          height="100%"
          fill="url(#rightFog)"
          transform={`translate(-${edge},0)`}
        />
      </Svg>
    </View>
  );
}
