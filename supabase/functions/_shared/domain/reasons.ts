import type { Category, Situation } from "./types.ts";

/**
 * Razón de una recomendación. Cada una corresponde a una regla que se
 * cumplió; no se generan razones que no provengan de una regla (decisión 0005).
 */
export type Reason =
  | { type: "interest"; category: Category }
  | { type: "priority_route"; situation: Situation }
  | { type: "local" }
  | { type: "closing_soon"; daysLeft: number }
  | { type: "meets_requirements" };

const CATEGORY_WITH_ARTICLE: Record<Category, string> = {
  employment: "el empleo",
  training: "la formación",
  scholarship: "las becas",
  subsidy: "los subsidios",
  entrepreneurship: "el emprendimiento",
};

const PRIORITY_ROUTE_TEXT: Record<Situation, string> = {
  neither: "Es una buena ruta si hoy no estás estudiando ni trabajando.",
  studying: "Es una buena opción mientras estudias.",
  working: "Es una buena opción mientras trabajas.",
  both: "Encaja con que estudias y trabajas al mismo tiempo.",
};

/** Texto en lenguaje claro de una razón (Fase 2, compromiso C1). */
export function describeReason(reason: Reason): string {
  switch (reason.type) {
    case "interest":
      return `Te interesa ${CATEGORY_WITH_ARTICLE[reason.category]}.`;
    case "priority_route":
      return PRIORITY_ROUTE_TEXT[reason.situation];
    case "local":
      return "Es en tu municipio.";
    case "closing_soon":
      if (reason.daysLeft === 0) return "Cierra hoy.";
      if (reason.daysLeft === 1) return "Cierra mañana.";
      return `Cierra en ${reason.daysLeft} días.`;
    case "meets_requirements":
      return "Cumples los requisitos de edad, ubicación, estudios, experiencia y horario.";
  }
}
