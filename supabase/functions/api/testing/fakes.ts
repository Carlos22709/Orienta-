import { createApp } from "../app.ts";
import type {
  AppDependencies,
  AuthUser,
  AuthVerifier,
  Municipality,
  OpportunityRecord,
  Repository,
  StoredProfile,
} from "../deps.ts";
import { makeOpportunity, NOW } from "../../_shared/domain/testing/fixtures.ts";

/**
 * Dobles de prueba en memoria. Son ficticios y solo se usan en pruebas: no
 * representan personas ni convocatorias reales (AGENTS.md).
 */

export const TEST_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "prueba@example.com",
};
export const VALID_TOKEN = "token-valido";
export const AUTH_HEADER = { Authorization: `Bearer ${VALID_TOKEN}` };

export const TEST_MUNICIPALITIES: Municipality[] = [
  { code: "11001", name: "Bogotá, D.C.", departmentName: "Bogotá, D.C." },
  { code: "25175", name: "Chía", departmentName: "Cundinamarca" },
];

export class FakeAuth implements AuthVerifier {
  verifyAccessToken(token: string): Promise<AuthUser | null> {
    return Promise.resolve(token === VALID_TOKEN ? TEST_USER : null);
  }
}

export class InMemoryRepository implements Repository {
  profiles = new Map<string, StoredProfile>();
  opportunities: OpportunityRecord[] = [];
  views: Array<{ userId: string; opportunityId: string }> = [];

  listMunicipalities() {
    return Promise.resolve(TEST_MUNICIPALITIES);
  }

  isMunicipalityInScope(code: string) {
    return Promise.resolve(TEST_MUNICIPALITIES.some((m) => m.code === code));
  }

  getProfile(userId: string) {
    return Promise.resolve(this.profiles.get(userId) ?? null);
  }

  saveProfile(userId: string, profile: StoredProfile) {
    this.profiles.set(userId, profile);
    return Promise.resolve(profile);
  }

  listActiveOpportunities() {
    return Promise.resolve(
      this.opportunities.filter((o) => o.status === "active"),
    );
  }

  getOpportunity(id: string) {
    return Promise.resolve(this.opportunities.find((o) => o.id === id) ?? null);
  }

  recordView(userId: string, opportunityId: string) {
    const seen = this.views.some((v) =>
      v.userId === userId && v.opportunityId === opportunityId
    );
    if (!seen) this.views.push({ userId, opportunityId });
    return Promise.resolve();
  }
}

/** Perfil completo y válido de una persona de 19 años en Chía. */
export const COMPLETE_PROFILE: StoredProfile = {
  birthDate: "2007-03-15",
  municipalityCode: "25175",
  educationLevel: "secondary",
  experienceLevel: "none",
  currentSituation: "neither",
  interests: ["training", "subsidy"],
  availability: "flexible",
  consentVersion: "2026-11-09",
  consentedAt: "2026-11-09T15:00:00.000Z",
};

/** Oportunidad ficticia con los campos de presentación completos. */
export function makeOpportunityRecord(
  overrides: Partial<OpportunityRecord> = {},
): OpportunityRecord {
  const base = makeOpportunity(overrides);
  return {
    title: `Oportunidad de prueba ${base.id}`,
    summaryPlain: "Resumen en lenguaje claro de una oportunidad de prueba.",
    entityName: "Entidad de prueba",
    officialUrl: "https://example.com/inscripcion",
    sourceUrl: "https://example.com/convocatoria",
    modality: "virtual",
    requirements: ["Tener entre 18 y 28 años."],
    verifiedBy: "Equipo de prueba",
    ...base,
    ...overrides,
  };
}

/** Crea la app con dobles de prueba; cada prueba puede reemplazar alguno. */
export function createTestApp(overrides: Partial<AppDependencies> = {}) {
  const repository = new InMemoryRepository();
  const deps: AppDependencies = {
    auth: new FakeAuth(),
    repository,
    now: () => NOW,
    ...overrides,
  };
  return {
    app: createApp(deps),
    repository: deps.repository as InMemoryRepository,
  };
}
