// Tipos de las APIs propias del runtime de Supabase Edge Functions.
import "@supabase/functions-js/edge-runtime.d.ts";
import { createApp } from "./app.ts";
import {
  createSupabaseDependencies,
  readSupabaseConfig,
} from "./infra/supabase.ts";
import { createUnconfiguredDependencies } from "./infra/unconfigured.ts";

const config = readSupabaseConfig();
if (!config) {
  console.warn(
    "API sin configuración de Supabase: solo /api/health responderá correctamente.",
  );
}

const app = createApp(
  config
    ? createSupabaseDependencies(config)
    : createUnconfiguredDependencies(),
);

export default { fetch: app.fetch };
