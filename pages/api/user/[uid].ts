import type { NextApiRequest, NextApiResponse } from "next";
import { auth, db } from "../../../lib/firebase-admin";
import { ErrorHandling, SuccessHandling } from "../../../lib/utils/ApiFunc";
import { ResApiRoutes } from "../../../lib/utils/types/interface";

const DeletUserHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<ResApiRoutes>
) => {
  // Utils Func
  const Respond = (ResData: ResApiRoutes) => {
    res.status(ResData.code).json(ResData);
  };

  // Request Verifier
  const {
    query: { uid },
    method,
    headers,
    body,
  } = req;

  const FormattedUID = uid && uid.toString().toLocaleLowerCase().trim();
  if (!uid || FormattedUID.length <= 0)
    return Respond(ErrorHandling(401, "Missing User Username")); // ❌

  if (!headers || !headers.authorization)
    return Respond(ErrorHandling(401, "Missing User Authentification Token")); // ❌

  if (method !== "GET")
    return Respond(ErrorHandling(401, "Only accept GET req")); // ❌

  if (!body || !body["new-username"])
    return Respond(ErrorHandling(400, "Missing User New Username")); // ❌

  // Req Handler
  try {
    await auth.verifyIdToken(headers.authorization);
    const UserRes = await auth.getUser(FormattedUID);

    Respond(SuccessHandling(201));
  } catch (err) {
    console.error("Error on api route '/[animeId]'");
    Respond(ErrorHandling(500, JSON.stringify(err)));
  }
};
export default DeletUserHandler;
