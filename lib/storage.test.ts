// lib/storage.test.ts — Tests TS para storage (sin importar AsyncStorage)
// ==============================================
// @ts-nocheck
// Requisitos previos (una vez):
//   npm i -D jest @types/jest ts-jest
//   npx ts-jest config:init

import { getBool, setBool, __clearAllForTests } from "./storage";

describe("storage helpers (bool)", () => {
  beforeEach(async () => {
    await __clearAllForTests(); // limpiamos usando API expuesta del módulo
  });

  it("getBool devuelve false si no existe", async () => {
    await expect(getBool("nope")).resolves.toBe(false);
  });

  it("setBool(true) y getBool -> true", async () => {
    await setBool("k", true);
    await expect(getBool("k")).resolves.toBe(true);
  });

  it("setBool(false) y getBool -> false", async () => {
    await setBool("k2", false);
    await expect(getBool("k2")).resolves.toBe(false);
  });
});
