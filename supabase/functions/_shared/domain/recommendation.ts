import {
  MAX_PER_CATEGORY,
  MAX_REASONS,
  MAX_RESULTS,
  MIN_RESULTS,
} from "./constants.ts";
import { toLocalDate } from "./dates.ts";
import { isEligible } from "./eligibility.ts";
import { scoreOpportunity } from "./ranking.ts";
import { describeReason } from "./reasons.ts";
import type { Category, OpportunityForRanking, Profile } from "./types.ts";
import { evaluateValidity, type Validity } from "./validity.ts";

export type ActiveValidity = Exclude<Validity, { kind: "closed" }>;

export interface Recommendation<T extends OpportunityForRanking> {
  opportunity: T;
  validity: ActiveValidity;
  score: number;
  /** Entre 1 y MAX_REASONS razones en lenguaje claro. */
  reasons: string[];
}

export interface RecommendationResult<T extends OpportunityForRanking> {
  items: Recommendation<T>[];
  /** true si hay menos de MIN_RESULTS recomendaciones (incluye 0). */
  insufficient: boolean;
}

/**
 * Recomienda entre cuatro y cinco oportunidades (decisión 0005):
 * 1. descarta las no vigentes y las no elegibles;
 * 2. puntúa y ordena las restantes de forma determinista;
 * 3. selecciona hasta MAX_RESULTS con máximo MAX_PER_CATEGORY por categoría,
 *    completando sin ese límite si no alcanzan.
 * Nunca rellena con oportunidades no elegibles.
 */
export function recommend<T extends OpportunityForRanking>(
  profile: Profile,
  opportunities: readonly T[],
  now: Date,
): RecommendationResult<T> {
  const today = toLocalDate(now);
  const candidates: Recommendation<T>[] = [];

  for (const opportunity of opportunities) {
    const validity = evaluateValidity(opportunity, now);
    if (validity.kind === "closed") continue;
    if (!isEligible(profile, opportunity, today)) continue;

    const { score, reasons } = scoreOpportunity(profile, opportunity, validity);
    candidates.push({
      opportunity,
      validity,
      score,
      reasons: reasons.slice(0, MAX_REASONS).map(describeReason),
    });
  }

  candidates.sort(compareCandidates);
  const items = selectWithDiversity(candidates).sort(compareCandidates);
  return { items, insufficient: items.length < MIN_RESULTS };
}

/**
 * Orden total: mayor puntaje; luego fecha límite más cercana (las abiertas al
 * final); luego verificación más reciente; luego id. El id garantiza que el
 * resultado no dependa del orden de entrada.
 */
function compareCandidates<T extends OpportunityForRanking>(
  a: Recommendation<T>,
  b: Recommendation<T>,
): number {
  if (a.score !== b.score) return b.score - a.score;

  const deadlineA = a.opportunity.deadline;
  const deadlineB = b.opportunity.deadline;
  if (deadlineA !== deadlineB) {
    if (deadlineA === null) return 1;
    if (deadlineB === null) return -1;
    // YYYY-MM-DD se puede comparar como texto.
    return deadlineA < deadlineB ? -1 : 1;
  }

  const verifiedA = Date.parse(a.opportunity.verifiedAt);
  const verifiedB = Date.parse(b.opportunity.verifiedAt);
  if (verifiedA !== verifiedB) return verifiedB - verifiedA;

  if (a.opportunity.id === b.opportunity.id) return 0;
  return a.opportunity.id < b.opportunity.id ? -1 : 1;
}

/** Recibe los candidatos ya ordenados y aplica el límite por categoría. */
function selectWithDiversity<C extends { opportunity: { category: Category } }>(
  sorted: readonly C[],
): C[] {
  const selected: C[] = [];
  const perCategory = new Map<Category, number>();

  for (const candidate of sorted) {
    if (selected.length === MAX_RESULTS) break;
    const category = candidate.opportunity.category;
    const count = perCategory.get(category) ?? 0;
    if (count >= MAX_PER_CATEGORY) continue;
    selected.push(candidate);
    perCategory.set(category, count + 1);
  }

  // Segunda pasada: si no hay suficientes categorías distintas, completa en
  // orden sin el límite por categoría.
  for (const candidate of sorted) {
    if (selected.length === MAX_RESULTS) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }

  return selected;
}
