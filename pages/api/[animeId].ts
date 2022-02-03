import type { NextApiRequest, NextApiResponse } from "next";
import {
  ErrorHandling,
  GetAnimeData,
  SuccessHandling,
} from "../../lib/utils/ApiFunc";
import {
  AnimeShape,
  InternalApiResError,
  ResApiRoutes,
} from "../../lib/utils/types/interface";

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
  } = req;

  if (!animeId || typeof animeId !== "string")
    return Respond(ErrorHandling(400, "The AnimeID params is missing!")); // ❌

  if (method !== "GET")
    return Respond(ErrorHandling(401, "Only accept GET req")); // ❌

  if (isNaN(parseInt(animeId)))
    return Respond(ErrorHandling(401, "ID must be a number")); // ❌

  // Req Handler
  try {
    const SecureAnimeID = parseInt(animeId).toString();

    const JikanAnimeRes = await GetAnimeData(SecureAnimeID);
    if ((JikanAnimeRes as InternalApiResError).err === true)
      return Respond(
        ErrorHandling(404, (JikanAnimeRes as InternalApiResError).message)
      ); // ❌

    const animeData = JikanAnimeRes as AnimeShape;
    Respond(SuccessHandling(201, animeData));
  } catch (err) {
    console.error("Error on api route '/[animeId]'");
    Respond(ErrorHandling(500, JSON.stringify(err)));
  }
};
export default NewAnimeHandler;
