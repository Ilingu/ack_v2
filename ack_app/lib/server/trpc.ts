import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { NextApiResponse } from "next";
// Types
import { tRPCError } from "../utils/types/types";
// Funcs
import { IsEmptyString } from "../utils/UtilsFuncs";
import { IsBlacklistedHost } from "./ApiFunc";

export interface HandlerRequestShape<T = any> {
  input: T;
  ctx: ContextShape;
  type: trpc.ProcedureType;
}

export interface ContextShape {
  host: string;
  AuthToken: string;
  ApiPassword: string;
  res?: NextApiResponse<any>;
}

// The app's context - is generated for each incoming request
// Will be available as `ctx` in all your resolvers
export function createContext(
  opts?: trpcNext.CreateNextContextOptions
): ContextShape {
  const { headers, cookies, url } = opts?.req;

  const RevalidateRoute = url.includes("/animes.revalidate");

  return {
    AuthToken: cookies["UsT"],
    ApiPassword: headers["protected"]?.toString(),
    host: headers.host,
    res: RevalidateRoute ? opts?.res : undefined,
  };
}
type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => {
  return trpc.router<Context>();
};

export const ThrowError = (code: tRPCError, reason: string) => {
  throw new trpc.TRPCError({ code, message: reason });
};

export const BasicCheck = ({ host, AuthToken, ApiPassword }: ContextShape) => {
  if (decodeURIComponent(ApiPassword) !== process.env.NEXT_PUBLIC_API_PASSWORD)
    return ThrowError(
      "UNAUTHORIZED",
      "Access Denied, unauthorized access to the API"
    );
  if (IsBlacklistedHost(host))
    return ThrowError("UNAUTHORIZED", "Access Denied, blacklisted host");
  if (IsEmptyString(AuthToken))
    return ThrowError("UNAUTHORIZED", "Access Denied, Invalid AuthToken");
  return;
};
