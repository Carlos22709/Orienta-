import type { MiddlewareHandler } from "hono";
import type { AuthUser, AuthVerifier } from "../deps.ts";
import { errorBody } from "../http/errors.ts";

/** Variables que las rutas protegidas leen del contexto de Hono. */
export type AppEnv = { Variables: { user: AuthUser } };

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * Exige un access_token válido de Supabase Auth en "Authorization: Bearer".
 * Responde 401 si falta o no es válido: es la señal que usa la cola de
 * silent refresh de la app para renovar la sesión (decisión 0002).
 */
export function requireUser(auth: AuthVerifier): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const token = BEARER.exec(c.req.header("Authorization") ?? "")?.[1];
    const user = token ? await auth.verifyAccessToken(token) : null;
    if (!user) {
      return c.json(
        errorBody(
          "unauthorized",
          "Tu sesión no es válida. Inicia sesión de nuevo.",
        ),
        401,
      );
    }
    c.set("user", user);
    await next();
  };
}
