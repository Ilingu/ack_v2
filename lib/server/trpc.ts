import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { NextApiResponse } from "next";
// Types
import { tRPCError } from "../utils/types/types";
// Funcs
import { IsEmptyString, ParseCookies } from "../utils/UtilsFunc";
import { IsBlacklistedHost } from "./ApiFunc";

export interface HandlerRequestShape<T = any> {
  input: T;
  ctx: ContextShape;
  type: trpc.ProcedureType;
}

export interface ContextShape {
  host: string;
  AuthToken: string;
  res?: NextApiResponse<any>;
}

// The app's context - is generated for each incoming request
// Will be available as `ctx` in all your resolvers
export function createContext(
  opts?: trpcNext.CreateNextContextOptions
): ContextShape {
  const {
    headers: { host, cookie },
    url,
  } = opts?.req;

  const RevalidateRoute = url.includes("/animes.revalidate");

  const { success, data: cookies } = ParseCookies(cookie);
  if (!success) return { host, AuthToken: null };

  const AuthToken = cookies["UsT"];
  return { AuthToken, host, res: RevalidateRoute ? opts?.res : undefined };
}
type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => {
  return trpc.router<Context>();
};

export const ThrowError = (code: tRPCError, reason: string) => {
  throw new trpc.TRPCError({ code, message: reason });
};

export const BasicCheck = (host: string, AuthToken: string) => {
  if (IsBlacklistedHost(host))
    return ThrowError("UNAUTHORIZED", "Access Denied, blacklisted host");
  if (IsEmptyString(AuthToken))
    return ThrowError("UNAUTHORIZED", "Access Denied, Invalid AuthToken");
  return;
};
