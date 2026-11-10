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
  /** Reloj inyectable: las reglas de vigencia y edad dependen de "hoy". */
  now: () => Date;
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
}
