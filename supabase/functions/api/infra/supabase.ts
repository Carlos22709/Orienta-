import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AppDependencies,
  AuthUser,
  AuthVerifier,
  Municipality,
  OpportunityRecord,
  Repository,
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
}

/** Lee la configuración que el runtime de Supabase inyecta en la función. */
export function readSupabaseConfig(): SupabaseConfig | null {
  const url = Deno.env.get("SUPABASE_URL");
  const secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return url && secretKey ? { url, secretKey } : null;
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
