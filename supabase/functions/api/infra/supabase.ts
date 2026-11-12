import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { decodeHex, encodeHex } from "@std/encoding";
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
import { findMissingFields, PROFILE_FIELDS } from "../profile-completeness.ts";

/**
 * Implementación real de las dependencias sobre Supabase.
 * Usa la clave secret (rol service_role), la única que puede leer las tablas
 * porque RLS no tiene políticas públicas (decisión 0001). Esta clave solo
 * existe en el servidor: nunca va en la app.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OPPORTUNITY_COLUMNS = [
  "id",
  "title",
  "summary_plain",
  "category",
  "entity_name",
  "official_url",
  "source_url",
  "deadline",
  "min_age",
  "max_age",
  "min_education",
  "min_experience",
  "availability",
  "municipality_codes",
  "modality",
  "requirements",
  "verified_by",
  "verified_at",
  "status",
].join(",");

export interface SupabaseConfig {
  url: string;
  secretKey: string;
  secrets: AppSecrets;
}

/**
 * Lee la configuración del entorno de la función. SUPABASE_URL y
 * SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase; TOTP_ENCRYPTION_KEY y
 * ELEVATED_TOKEN_SECRET son propios (supabase/.env en local y
 * `supabase secrets set` en la nube).
 */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = Deno.env.get("SUPABASE_URL");
  const secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secretKey) return null;
  return {
    url,
    secretKey,
    secrets: {
      totpEncryptionKey: Deno.env.get("TOTP_ENCRYPTION_KEY") ?? null,
      elevatedTokenSecret: Deno.env.get("ELEVATED_TOKEN_SECRET") ?? null,
    },
  };
}

export function createSupabaseDependencies(
  config: SupabaseConfig,
): AppDependencies {
  const client = createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    auth: new SupabaseAuthVerifier(client),
    repository: new SupabaseRepository(client),
    now: () => new Date(),
    secrets: config.secrets,
  };
}

/** Valida el access_token preguntándole a Supabase Auth por su usuario. */
export class SupabaseAuthVerifier implements AuthVerifier {
  constructor(private readonly client: SupabaseClient) {}

  async verifyAccessToken(token: string): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  }
}

export class SupabaseRepository implements Repository {
  constructor(private readonly db: SupabaseClient) {}

  async listMunicipalities(): Promise<Municipality[]> {
    const { data, error } = await this.db
      .from("municipalities")
      .select("code, name, department_name")
      .eq("in_scope", true)
      .order("name");
    if (error) throw new Error(`municipalities: ${error.message}`);
    return data.map((row) => ({
      code: row.code,
      name: row.name,
      departmentName: row.department_name,
    }));
  }

  async isMunicipalityInScope(code: string): Promise<boolean> {
    const { count, error } = await this.db
      .from("municipalities")
      .select("code", { count: "exact", head: true })
      .eq("code", code)
      .eq("in_scope", true);
    if (error) throw new Error(`municipalities: ${error.message}`);
    return (count ?? 0) > 0;
  }

  async getProfile(userId: string): Promise<StoredProfile | null> {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`profiles: ${error.message}`);
    return data ? toStoredProfile(data) : null;
  }

  async saveProfile(
    userId: string,
    profile: StoredProfile,
  ): Promise<StoredProfile> {
    const { data, error } = await this.db
      .from("profiles")
      .upsert({
        user_id: userId,
        birth_date: profile.birthDate,
        municipality_code: profile.municipalityCode,
        education_level: profile.educationLevel,
        experience_level: profile.experienceLevel,
        current_situation: profile.currentSituation,
        interests: profile.interests,
        availability: profile.availability,
        completed_steps: PROFILE_FIELDS.length -
          findMissingFields(profile).length,
        consent_version: profile.consentVersion,
        consented_at: profile.consentedAt,
      })
      .select("*")
      .single();
    if (error) throw new Error(`profiles: ${error.message}`);
    return toStoredProfile(data);
  }

  async listActiveOpportunities(): Promise<OpportunityRecord[]> {
    const { data, error } = await this.db
      .from("opportunities")
      .select(OPPORTUNITY_COLUMNS)
      .eq("status", "active");
    if (error) throw new Error(`opportunities: ${error.message}`);
    return (data as unknown as OpportunityRow[]).map(toOpportunityRecord);
  }

  async getOpportunity(id: string): Promise<OpportunityRecord | null> {
    // Un id con formato inválido no existe; se evita el error de Postgres.
    if (!UUID.test(id)) return null;
    const { data, error } = await this.db
      .from("opportunities")
      .select(OPPORTUNITY_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`opportunities: ${error.message}`);
    return data ? toOpportunityRecord(data as unknown as OpportunityRow) : null;
  }

  async recordView(userId: string, opportunityId: string): Promise<void> {
    const { error } = await this.db
      .from("opportunity_views")
      .upsert(
        { user_id: userId, opportunity_id: opportunityId },
        { onConflict: "user_id,opportunity_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(`opportunity_views: ${error.message}`);
  }

  async listOpportunityViews(userId: string): Promise<OpportunityView[]> {
    const { data, error } = await this.db
      .from("opportunity_views")
      .select("opportunity_id, first_viewed_at, opportunities(title)")
      .eq("user_id", userId)
      .order("first_viewed_at");
    if (error) throw new Error(`opportunity_views: ${error.message}`);
    // deno-lint-ignore no-explicit-any
    return (data as any[]).map((row) => ({
      opportunityId: row.opportunity_id,
      title: row.opportunities?.title ?? "",
      firstViewedAt: row.first_viewed_at,
    }));
  }

  // --- Guardadas (♡) ---

  async listSavedOpportunities(
    userId: string,
  ): Promise<SavedOpportunityRecord[]> {
    const { data, error } = await this.db
      .from("saved_opportunities")
      .select(`saved_at, opportunities(${OPPORTUNITY_COLUMNS})`)
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });
    if (error) throw new Error(`saved_opportunities: ${error.message}`);
    // deno-lint-ignore no-explicit-any
    return (data as any[])
      .filter((row) => row.opportunities)
      .map((row) => ({
        opportunity: toOpportunityRecord(row.opportunities as OpportunityRow),
        savedAt: row.saved_at,
      }));
  }

  async saveOpportunity(userId: string, opportunityId: string): Promise<void> {
    // ignoreDuplicates: guardar dos veces no cambia la fecha original.
    const { error } = await this.db
      .from("saved_opportunities")
      .upsert(
        { user_id: userId, opportunity_id: opportunityId },
        { onConflict: "user_id,opportunity_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(`saved_opportunities: ${error.message}`);
  }

  async unsaveOpportunity(
    userId: string,
    opportunityId: string,
  ): Promise<void> {
    if (!UUID.test(opportunityId)) return;
    const { error } = await this.db
      .from("saved_opportunities")
      .delete()
      .eq("user_id", userId)
      .eq("opportunity_id", opportunityId);
    if (error) throw new Error(`saved_opportunities: ${error.message}`);
  }

  // --- Segundo factor y step-up ---

  async getMfaFactor(userId: string): Promise<MfaFactor | null> {
    const { data, error } = await this.db
      .from("mfa_factors")
      .select("secret_ciphertext, secret_iv, confirmed_at, last_used_step")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`mfa_factors: ${error.message}`);
    if (!data) return null;
    return {
      secretCiphertext: fromBytea(data.secret_ciphertext),
      secretIv: fromBytea(data.secret_iv),
      confirmedAt: data.confirmed_at,
      lastUsedStep: data.last_used_step === null
        ? null
        : Number(data.last_used_step),
    };
  }

  async startMfaEnrollment(
    userId: string,
    encrypted: { ciphertext: Uint8Array; iv: Uint8Array },
  ): Promise<void> {
    const { error } = await this.db.from("mfa_factors").upsert({
      user_id: userId,
      secret_ciphertext: toBytea(encrypted.ciphertext),
      secret_iv: toBytea(encrypted.iv),
      confirmed_at: null,
      last_used_step: null,
    });
    if (error) throw new Error(`mfa_factors: ${error.message}`);
  }

  async confirmMfaFactor(
    userId: string,
    step: number,
    confirmedAt: string,
  ): Promise<boolean> {
    const { data, error } = await this.db
      .from("mfa_factors")
      .update({ confirmed_at: confirmedAt, last_used_step: step })
      .eq("user_id", userId)
      .is("confirmed_at", null)
      .select("user_id");
    if (error) throw new Error(`mfa_factors: ${error.message}`);
    return data.length === 1;
  }

  async consumeTotpStep(userId: string, step: number): Promise<boolean> {
    const { data, error } = await this.db.rpc("consume_totp_step", {
      p_user_id: userId,
      p_step: step,
    });
    if (error) throw new Error(`consume_totp_step: ${error.message}`);
    return data === true;
  }

  async createStepUpChallenge(challenge: {
    userId: string;
    tokenHash: string;
    action: CriticalAction;
    expiresAt: string;
  }): Promise<void> {
    const { error } = await this.db.from("step_up_challenges").insert({
      user_id: challenge.userId,
      token_hash: challenge.tokenHash,
      action: challenge.action,
      expires_at: challenge.expiresAt,
    });
    if (error) throw new Error(`step_up_challenges: ${error.message}`);
  }

  async findActiveStepUpChallenge(
    tokenHash: string,
    userId: string,
    now: Date,
  ): Promise<{ action: CriticalAction } | null> {
    const { data, error } = await this.db
      .from("step_up_challenges")
      .select("action")
      .eq("token_hash", tokenHash)
      .eq("user_id", userId)
      .is("consumed_at", null)
      .gt("expires_at", now.toISOString())
      .maybeSingle();
    if (error) throw new Error(`step_up_challenges: ${error.message}`);
    return data ? { action: data.action } : null;
  }

  async consumeStepUpChallenge(
    tokenHash: string,
  ): Promise<{ userId: string; action: CriticalAction } | null> {
    const { data, error } = await this.db.rpc("consume_step_up_challenge", {
      p_token_hash: tokenHash,
    });
    if (error) throw new Error(`consume_step_up_challenge: ${error.message}`);
    const row = (data as Array<{ user_id: string; action: CriticalAction }>)
      ?.[0];
    return row ? { userId: row.user_id, action: row.action } : null;
  }

  async deleteUser(userId: string): Promise<void> {
    // Borrar el usuario de Supabase Auth elimina en cascada perfil, vistas,
    // guardadas, factor TOTP y retos (ON DELETE CASCADE en las migraciones).
    const { error } = await this.db.auth.admin.deleteUser(userId);
    if (error) throw new Error(`auth.admin.deleteUser: ${error.message}`);
  }
}

// PostgREST intercambia bytea como texto hexadecimal con prefijo "\x".
function toBytea(bytes: Uint8Array): string {
  return `\\x${encodeHex(bytes)}`;
}

function fromBytea(value: string): Uint8Array {
  return decodeHex(value.startsWith("\\x") ? value.slice(2) : value);
}

// --- Conversión de filas (snake_case) a objetos de la API (camelCase) ---

// deno-lint-ignore no-explicit-any
function toStoredProfile(row: any): StoredProfile {
  return {
    birthDate: row.birth_date,
    municipalityCode: row.municipality_code,
    educationLevel: row.education_level,
    experienceLevel: row.experience_level,
    currentSituation: row.current_situation,
    interests: row.interests ?? [],
    availability: row.availability,
    consentVersion: row.consent_version,
    consentedAt: row.consented_at,
  };
}

interface OpportunityRow {
  id: string;
  title: string;
  summary_plain: string;
  category: OpportunityRecord["category"];
  entity_name: string;
  official_url: string;
  source_url: string;
  deadline: string | null;
  min_age: number | null;
  max_age: number | null;
  min_education: OpportunityRecord["minEducation"];
  min_experience: OpportunityRecord["minExperience"];
  availability: OpportunityRecord["availability"];
  municipality_codes: string[] | null;
  modality: OpportunityRecord["modality"];
  requirements: string[];
  verified_by: string;
  verified_at: string;
  status: OpportunityRecord["status"];
}

function toOpportunityRecord(row: OpportunityRow): OpportunityRecord {
  return {
    id: row.id,
    title: row.title,
    summaryPlain: row.summary_plain,
    category: row.category,
    entityName: row.entity_name,
    officialUrl: row.official_url,
    sourceUrl: row.source_url,
    deadline: row.deadline,
    minAge: row.min_age,
    maxAge: row.max_age,
    minEducation: row.min_education,
    minExperience: row.min_experience,
    availability: row.availability,
    municipalityCodes: row.municipality_codes,
    modality: row.modality,
    requirements: row.requirements,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    status: row.status,
  };
}
