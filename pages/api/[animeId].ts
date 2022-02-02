import type { NextApiRequest, NextApiResponse } from "next";
import {
  ErrorHandling,
  SuccessHandling,
  VerifyApiToken,
} from "../../lib/utils/ApiFunc";
import { ResApiRoutes } from "../../lib/utils/types/interface";

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
  } = req;

  if (!animeId || typeof animeId !== "string")
    return Respond(
      ErrorHandling(400, "The AnimeID of the request Anime is missing!") // ❌
    );

  if (method !== "POST" || !body)
    return Respond(ErrorHandling(401, "Only accept POST req")); // ❌

  if (!VerifyApiToken(body?.AccessToken))
    return Respond(ErrorHandling(400, "Your API Access denied")); // ❌

  const SecureAnimeID = parseInt(animeId);
  if (isNaN(SecureAnimeID))
    return Respond(ErrorHandling(401, "ID must be a number")); // ❌

  // Req Handler
  Respond(SuccessHandling(201));
};
export default NewAnimeHandler;
