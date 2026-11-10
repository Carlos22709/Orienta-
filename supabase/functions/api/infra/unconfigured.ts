import type { AppDependencies, Repository } from "../deps.ts";

/**
 * Dependencias que se usan si faltan SUPABASE_URL o la clave secret, por
 * ejemplo al servir la función con `npm run api:serve` sin Supabase.
 * /health sigue respondiendo; cualquier otra ruta falla con 500 y deja un
 * mensaje claro en los registros del servidor.
 */
const MISSING_CONFIG =
  "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Sirve la función con `npx supabase functions serve`.";

function fail(): Promise<never> {
  return Promise.reject(new Error(MISSING_CONFIG));
}

const unconfiguredRepository: Repository = {
  listMunicipalities: fail,
  isMunicipalityInScope: fail,
  getProfile: fail,
  saveProfile: fail,
  listActiveOpportunities: fail,
  getOpportunity: fail,
  recordView: fail,
};

export function createUnconfiguredDependencies(): AppDependencies {
  return {
    auth: { verifyAccessToken: fail },
    repository: unconfiguredRepository,
    now: () => new Date(),
  };
}
