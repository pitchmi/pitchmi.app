// lib/radius.test.ts — Tests TS para nextRadius
// ==============================================
// @ts-nocheck
// Requisitos previos (una vez):
//   npm i -D jest @types/jest ts-jest
//   npx ts-jest config:init

import { nextRadius } from "./radius";

describe("nextRadius", () => {
  it("0 -> 1000", () => {
    expect(nextRadius(0)).toBe(1000);
  });
  it("1000 -> 5000", () => {
    expect(nextRadius(1000)).toBe(5000);
  });
  it("5000 -> 20000", () => {
    expect(nextRadius(5000)).toBe(20000);
  });
  it("20000 -> 0", () => {
    expect(nextRadius(20000)).toBe(0);
  });
});
