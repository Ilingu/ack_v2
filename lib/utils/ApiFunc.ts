import { randomUUID } from "crypto";
import { ResApiRoutes } from "./types/interface";

export const ErrorHandling = (code: number, reason?: string): ResApiRoutes => ({
  succeed: false,
  code,
  message: reason,
});
export const SuccessHandling = (code: number, data?: object): ResApiRoutes => ({
  succeed: true,
  code,
  data,
});

interface lastTokenShape {
  token: string;
  expired: number;
}
let lastToken: lastTokenShape = null;
/**
 * Tokens To Protect Access of api
 * @param {lastToken} TokenToVerify : Verify the given token
 * @returns {boolean} true = accessible || false = access denied
 */
export const VerifyApiToken = (TokenToVerify: string): boolean => {
  if (!TokenToVerify) return false;
  if (lastToken?.expired < Date.now()) return false;
  if (TokenToVerify !== lastToken?.token) return false;
  return true;
};

/**
 * Tokens To Protect Access of api
 * @param {lastToken} TokenToVerify : Verify the given token
 * @returns {boolean} true = accessible || false = access denied
 */
export const GetApiToken = (): string => {
  if (lastToken !== null) return null;

  lastToken = {
    token: randomUUID(),
    expired: Date.now() + 5000,
  };
  return lastToken.token;
};
