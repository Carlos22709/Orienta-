import { createApp } from "../app.ts";
import type {
  AppDependencies,
  AppSecrets,
  AuthUser,
  AuthVerifier,
  CriticalAction,
  MfaFactor,
  Municipality,
  OpportunityRecord,
  OpportunityView,
  Repository,
  SavedOpportunityRecord,
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
export const OTHER_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "otra-persona@example.com",
};
export const VALID_TOKEN = "token-valido";
export const OTHER_USER_TOKEN = "token-otra-persona";
export const AUTH_HEADER = { Authorization: `Bearer ${VALID_TOKEN}` };

/** Secretos solo de prueba (no se usan fuera de las pruebas). */
export const TEST_SECRETS: AppSecrets = {
  // 32 bytes en cero codificados en Base64.
  totpEncryptionKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  elevatedTokenSecret: "secreto-de-prueba-para-tokens-elevados-32+",
};

export const TEST_MUNICIPALITIES: Municipality[] = [
  { code: "11001", name: "Bogotá, D.C.", departmentName: "Bogotá, D.C." },
  { code: "25175", name: "Chía", departmentName: "Cundinamarca" },
];

export class FakeAuth implements AuthVerifier {
  verifyAccessToken(token: string): Promise<AuthUser | null> {
    if (token === VALID_TOKEN) return Promise.resolve(TEST_USER);
    if (token === OTHER_USER_TOKEN) return Promise.resolve(OTHER_USER);
    return Promise.resolve(null);
  }
}

interface StoredChallenge {
  userId: string;
  tokenHash: string;
  action: CriticalAction;
  expiresAt: string;
  consumedAt: string | null;
}

export class InMemoryRepository implements Repository {
  profiles = new Map<string, StoredProfile>();
  opportunities: OpportunityRecord[] = [];
  views: Array<{ userId: string; opportunityId: string }> = [];
  saved: Array<{ userId: string; opportunityId: string; savedAt: string }> = [];
  mfaFactors = new Map<string, MfaFactor>();
  challenges: StoredChallenge[] = [];
  deletedUsers: string[] = [];

  /** El reloj es el mismo de la app para simular vencimientos. */
  constructor(private readonly now: () => Date = () => NOW) {}

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

  listOpportunityViews(userId: string): Promise<OpportunityView[]> {
    return Promise.resolve(
      this.views.filter((v) => v.userId === userId).map((v) => ({
        opportunityId: v.opportunityId,
        title: this.opportunities.find((o) => o.id === v.opportunityId)
          ?.title ?? "",
        firstViewedAt: this.now().toISOString(),
      })),
    );
  }

  listSavedOpportunities(userId: string): Promise<SavedOpportunityRecord[]> {
    return Promise.resolve(
      this.saved
        .filter((s) => s.userId === userId)
        .flatMap((s) => {
          const opportunity = this.opportunities.find((o) =>
            o.id === s.opportunityId
          );
          return opportunity ? [{ opportunity, savedAt: s.savedAt }] : [];
        })
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    );
  }

  saveOpportunity(userId: string, opportunityId: string) {
    const exists = this.saved.some((s) =>
      s.userId === userId && s.opportunityId === opportunityId
    );
    if (!exists) {
      this.saved.push({
        userId,
        opportunityId,
        savedAt: this.now().toISOString(),
      });
    }
    return Promise.resolve();
  }

  unsaveOpportunity(userId: string, opportunityId: string) {
    this.saved = this.saved.filter((s) =>
      !(s.userId === userId && s.opportunityId === opportunityId)
    );
    return Promise.resolve();
  }

  getMfaFactor(userId: string) {
    return Promise.resolve(this.mfaFactors.get(userId) ?? null);
  }

  startMfaEnrollment(
    userId: string,
    encrypted: { ciphertext: Uint8Array; iv: Uint8Array },
  ) {
    this.mfaFactors.set(userId, {
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      confirmedAt: null,
      lastUsedStep: null,
    });
    return Promise.resolve();
  }

  confirmMfaFactor(userId: string, step: number, confirmedAt: string) {
    const factor = this.mfaFactors.get(userId);
    if (!factor || factor.confirmedAt !== null) return Promise.resolve(false);
    factor.confirmedAt = confirmedAt;
    factor.lastUsedStep = step;
    return Promise.resolve(true);
  }

  // Misma regla que la función SQL consume_totp_step.
  consumeTotpStep(userId: string, step: number) {
    const factor = this.mfaFactors.get(userId);
    if (
      !factor || factor.confirmedAt === null ||
      (factor.lastUsedStep !== null && factor.lastUsedStep >= step)
    ) {
      return Promise.resolve(false);
    }
    factor.lastUsedStep = step;
    return Promise.resolve(true);
  }

  createStepUpChallenge(challenge: Omit<StoredChallenge, "consumedAt">) {
    this.challenges.push({ ...challenge, consumedAt: null });
    return Promise.resolve();
  }

  findActiveStepUpChallenge(tokenHash: string, userId: string, now: Date) {
    const found = this.challenges.find((c) =>
      c.tokenHash === tokenHash && c.userId === userId &&
      c.consumedAt === null && Date.parse(c.expiresAt) > now.getTime()
    );
    return Promise.resolve(found ? { action: found.action } : null);
  }

  // Misma regla que la función SQL consume_step_up_challenge.
  consumeStepUpChallenge(tokenHash: string) {
    const found = this.challenges.find((c) =>
      c.tokenHash === tokenHash && c.consumedAt === null &&
      Date.parse(c.expiresAt) > this.now().getTime()
    );
    if (!found) return Promise.resolve(null);
    found.consumedAt = this.now().toISOString();
    return Promise.resolve({ userId: found.userId, action: found.action });
  }

  deleteUser(userId: string) {
    this.deletedUsers.push(userId);
    this.profiles.delete(userId);
    this.mfaFactors.delete(userId);
    this.views = this.views.filter((v) => v.userId !== userId);
    this.saved = this.saved.filter((s) => s.userId !== userId);
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

/** Reloj manipulable para simular el paso del tiempo en las pruebas. */
export class TestClock {
  constructor(public current: Date = NOW) {}
  now = () => this.current;
  advanceSeconds(seconds: number) {
    this.current = new Date(this.current.getTime() + seconds * 1000);
  }
  unixSeconds() {
    return Math.floor(this.current.getTime() / 1000);
  }
}

/** Crea la app con dobles de prueba; cada prueba puede reemplazar alguno. */
export function createTestApp(overrides: Partial<AppDependencies> = {}) {
  const now = overrides.now ?? (() => NOW);
  const deps: AppDependencies = {
    auth: new FakeAuth(),
    repository: new InMemoryRepository(now),
    now,
    secrets: TEST_SECRETS,
    ...overrides,
  };
  return {
    app: createApp(deps),
    repository: deps.repository as InMemoryRepository,
  };
}
