import { assertEquals, assertThrows } from "@std/assert";
import { ageOn, daysBetween, toLocalDate } from "./dates.ts";

Deno.test("toLocalDate usa la fecha de Bogotá y no la de UTC", () => {
  // 23:59:59 del 9 de noviembre en Bogotá (UTC-5).
  assertEquals(toLocalDate(new Date("2026-11-10T04:59:59Z")), "2026-11-09");
  // Medianoche del 10 de noviembre en Bogotá.
  assertEquals(toLocalDate(new Date("2026-11-10T05:00:00Z")), "2026-11-10");
});

Deno.test("daysBetween cuenta días calendario entre dos fechas", () => {
  assertEquals(daysBetween("2026-11-09", "2026-11-16"), 7);
  assertEquals(daysBetween("2026-11-09", "2026-11-09"), 0);
  assertEquals(daysBetween("2026-11-09", "2026-11-08"), -1);
  // Cruza fin de mes y de año.
  assertEquals(daysBetween("2026-12-30", "2027-01-02"), 3);
});

Deno.test("ageOn cumple años solo a partir del día del cumpleaños", () => {
  assertEquals(ageOn("2000-11-10", "2026-11-09"), 25);
  assertEquals(ageOn("2000-11-09", "2026-11-09"), 26);
  assertEquals(ageOn("2000-11-08", "2026-11-09"), 26);
  assertEquals(ageOn("2000-12-01", "2026-11-09"), 25);
});

Deno.test("las fechas con formato inválido se rechazan", () => {
  assertThrows(() => daysBetween("09/11/2026", "2026-11-09"));
  assertThrows(() => ageOn("2026-13-01", "2026-11-09"));
});
