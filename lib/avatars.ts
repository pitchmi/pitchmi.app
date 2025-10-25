// lib/avatars.ts
export const AVATARS = [
  { key: "avatar_01", src: require("@/assets/avatars/avatar_01.png") },
  { key: "avatar_02", src: require("@/assets/avatars/avatar_02.png") },
  { key: "avatar_03", src: require("@/assets/avatars/avatar_03.png") },
  { key: "avatar_04", src: require("@/assets/avatars/avatar_04.png") },
  { key: "avatar_05", src: require("@/assets/avatars/avatar_05.png") },
] as const;

export type AvatarKey = (typeof AVATARS)[number]["key"];
