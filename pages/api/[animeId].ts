import type { NextApiRequest, NextApiResponse } from "next";
import {
  ErrorHandling,
  SuccessHandling,
  VerifyApiToken,
} from "../../lib/utils/ApiFunc";
import { ResApiRoutes } from "../../lib/utils/types/interface";
import { auth } from "../../lib/firebase-admin";

const NewAnimeHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<ResApiRoutes>
) => {
  // Utils Func
  const Respond = (ResData: ResApiRoutes) => {
    res.status(ResData.code).json(ResData);
  };

  // Request Verifier
  const {
    query: { animeId },
    method,
    body,
    headers,
  } = req;

  if (!headers?.authorization)
    return Respond(ErrorHandling(401, "Please include user UID token")); // ❌

  if (!animeId || typeof animeId !== "string")
    return Respond(ErrorHandling(400, "The AnimeID params is missing!")); // ❌

  if (method !== "POST" || !body)
    return Respond(ErrorHandling(401, "Only accept POST req")); // ❌

  // if (!VerifyApiToken(body?.AccessToken))
  //   return Respond(ErrorHandling(400, "Your API Access denied")); // ❌

  const SecureAnimeID = parseInt(animeId);
  if (isNaN(SecureAnimeID))
    return Respond(ErrorHandling(401, "ID must be a number")); // ❌

  // Req Handler
  try {
    // --> user.getIdToken() :: in req.headers.token

    const { uid } = await auth.verifyIdToken(headers?.authorization.toString());
    console.log(uid);

    Respond(SuccessHandling(201));
  } catch (err) {
    console.error("Error on api route '/[animeId]'");
    Respond(ErrorHandling(500, err));
  }
};
export default NewAnimeHandler;
