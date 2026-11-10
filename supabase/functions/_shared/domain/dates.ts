import { TIME_ZONE } from "./constants.ts";

export const DAY_MS = 86_400_000;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convierte YYYY-MM-DD a la medianoche UTC de ese día y valida que exista. */
function toUtcMidnight(date: string): number {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    throw new RangeError(`Fecha inválida "${date}": se espera YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const parsed = new Date(time);
  // Date.UTC acepta 2026-13-01 y lo convierte en 2027-01-01; aquí se rechaza.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new RangeError(`Fecha inexistente "${date}".`);
  }
  return time;
}

/** Fecha calendario (YYYY-MM-DD) de un instante en la zona horaria dada. */
export function toLocalDate(instant: Date, timeZone = TIME_ZONE): string {
  // El formato en-CA produce exactamente YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** Días calendario de `from` a `to` (negativo si `to` es anterior). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMidnight(to) - toUtcMidnight(from)) / DAY_MS);
}

/** Edad cumplida en `today` para alguien nacido en `birthDate`. */
export function ageOn(birthDate: string, today: string): number {
  toUtcMidnight(birthDate);
  toUtcMidnight(today);
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [year, month, day] = today.split("-").map(Number);

  let age = year - birthYear;
  const birthdayNotReached = month < birthMonth ||
    (month === birthMonth && day < birthDay);
  if (birthdayNotReached) age -= 1;
  return age;
}
