import type {
  Availability,
  Category,
  EducationLevel,
  ExperienceLevel,
  OpportunityForRanking,
  Situation,
} from "../_shared/domain/types.ts";

/**
 * Dependencias de la API. createApp las recibe como parámetro para que las
 * pruebas usen versiones en memoria (api/testing/fakes.ts) y producción use
 * Supabase (api/infra/).
 */
export interface AppDependencies {
  auth: AuthVerifier;
  repository: Repository;
  /** Reloj inyectable: las reglas de vigencia, edad y TOTP dependen de "ahora". */
  now: () => Date;
  /** Secretos del servidor; null si no están configurados. */
  secrets: AppSecrets;
}

export interface AppSecrets {
  /** Clave AES-GCM de 32 bytes en Base64 para cifrar los secretos TOTP. */
  totpEncryptionKey: string | null;
  /** Secreto HS256 con el que se firma el elevated_token. */
  elevatedTokenSecret: string | null;
}

export type CriticalAction = "data_export" | "account_deletion";

/** Factor TOTP guardado; el secreto está cifrado con AES-GCM. */
export interface MfaFactor {
  secretCiphertext: Uint8Array;
  secretIv: Uint8Array;
  /** null mientras la inscripción no se confirma. */
  confirmedAt: string | null;
  /** Última ventana TOTP aceptada (anti-replay). */
  lastUsedStep: number | null;
}

export interface OpportunityView {
  opportunityId: string;
  title: string;
  firstViewedAt: string;
}

/** Oportunidad que la persona guardó con el ♡. */
export interface SavedOpportunityRecord {
  opportunity: OpportunityRecord;
  savedAt: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthVerifier {
  /** Devuelve el usuario del access_token, o null si no es válido o venció. */
  verifyAccessToken(token: string): Promise<AuthUser | null>;
}

export interface Municipality {
  code: string;
  name: string;
  departmentName: string;
}

/** Perfil guardado. Los campos admiten null porque se diligencia por pasos. */
export interface StoredProfile {
  birthDate: string | null;
  municipalityCode: string | null;
  educationLevel: EducationLevel | null;
  experienceLevel: ExperienceLevel | null;
  currentSituation: Situation | null;
  interests: Category[];
  availability: Availability | null;
  consentVersion: string;
  consentedAt: string;
}

/** Oportunidad con los campos que se muestran, además de los del dominio. */
export interface OpportunityRecord extends OpportunityForRanking {
  title: string;
  summaryPlain: string;
  entityName: string;
  officialUrl: string;
  sourceUrl: string;
  modality: "in_person" | "virtual" | "hybrid";
  requirements: string[];
  verifiedBy: string;
}

export interface Repository {
  /** Municipios en alcance (in_scope = true), ordenados por nombre. */
  listMunicipalities(): Promise<Municipality[]>;
  isMunicipalityInScope(code: string): Promise<boolean>;
  getProfile(userId: string): Promise<StoredProfile | null>;
  /** Crea o reemplaza el perfil completo (la ruta ya combinó los cambios). */
  saveProfile(userId: string, profile: StoredProfile): Promise<StoredProfile>;
  listActiveOpportunities(): Promise<OpportunityRecord[]>;
  getOpportunity(id: string): Promise<OpportunityRecord | null>;
  /** Registra la primera vez que la persona ve una oportunidad. */
  recordView(userId: string, opportunityId: string): Promise<void>;
  listOpportunityViews(userId: string): Promise<OpportunityView[]>;

  // --- Guardadas (♡) ---
  /** Guardadas de la persona, la más reciente primero. */
  listSavedOpportunities(userId: string): Promise<SavedOpportunityRecord[]>;
  /** Guarda una oportunidad; si ya estaba guardada, conserva la fecha original. */
  saveOpportunity(userId: string, opportunityId: string): Promise<void>;
  /** Quita una oportunidad de las guardadas; no falla si no estaba. */
  unsaveOpportunity(userId: string, opportunityId: string): Promise<void>;

  // --- Segundo factor y step-up (decisión 0002) ---
  getMfaFactor(userId: string): Promise<MfaFactor | null>;
  /** Guarda un secreto nuevo sin confirmar (reemplaza uno pendiente). */
  startMfaEnrollment(
    userId: string,
    encrypted: { ciphertext: Uint8Array; iv: Uint8Array },
  ): Promise<void>;
  /** Confirma un factor pendiente; false si no había uno pendiente. */
  confirmMfaFactor(
    userId: string,
    step: number,
    confirmedAt: string,
  ): Promise<boolean>;
  /** Registra la ventana usada de forma atómica; false si es repetición. */
  consumeTotpStep(userId: string, step: number): Promise<boolean>;
  createStepUpChallenge(challenge: {
    userId: string;
    tokenHash: string;
    action: CriticalAction;
    expiresAt: string;
  }): Promise<void>;
  /** Reto vigente y sin usar de esta persona, sin consumirlo. */
  findActiveStepUpChallenge(
    tokenHash: string,
    userId: string,
    now: Date,
  ): Promise<{ action: CriticalAction } | null>;
  /** Consume el reto de forma atómica; null si ya se usó o venció. */
  consumeStepUpChallenge(
    tokenHash: string,
  ): Promise<{ userId: string; action: CriticalAction } | null>;
  /** Elimina la cuenta; las tablas propias se borran en cascada. */
  deleteUser(userId: string): Promise<void>;
}
