import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
// Types
import { tRPCError } from "../utils/types/types";
// Funcs
import { ParseCookies } from "../utils/UtilsFunc";

// The app's context - is generated for each incoming request
// Will be available as `ctx` in all your resolvers
export interface ContextShape {
  host: string;
  AuthToken: string;
}

export interface HandlerRequestShape<T = any> {
  input: T;
  ctx: ContextShape;
  type: trpc.ProcedureType;
}

export function createContext(
  opts?: trpcNext.CreateNextContextOptions
): ContextShape {
  const {
    headers: { host, cookie },
  } = opts?.req;

  const { success, data: cookies } = ParseCookies(cookie);
  if (!success) return { host, AuthToken: null };

  const AuthToken = cookies["UsT"];

  return {
    AuthToken,
    host,
  };
}
type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => {
  return trpc.router<Context>();
};

export const ThrowError = (code: tRPCError, reason: string) => {
  throw new trpc.TRPCError({ code, message: reason });
};
