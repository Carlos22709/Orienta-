// Tipos de las APIs propias del runtime de Supabase Edge Functions.
import "@supabase/functions-js/edge-runtime.d.ts";
import { createApp } from "./app.ts";

const app = createApp();

export default { fetch: app.fetch };
