import type { NextApiRequest, NextApiResponse } from "next";
import {
  ErrorHandling,
  IsBlacklistedHost,
  SuccessHandling,
} from "../../../lib/utils/ApiFunc";
import { auth, db } from "../../../lib/firebase/firebase-admin";
import { AnimeShape, ResApiRoutes } from "../../../lib/utils/types/interface";
import { isValidUrl } from "../../../lib/utils/UtilsFunc";

const ApiRoute = async (req: NextApiRequest, res: NextApiResponse) => {
  // Utils Func
  const Respond = (ResData: ResApiRoutes) => {
    res.status(ResData.code).json(ResData);
  };

  // Request Verifier
  const {
    method,
    headers,
    query: { revalidateId },
  } = req;

  if (IsBlacklistedHost(headers.host))
    return Respond(ErrorHandling(401, `Access Denied, blacklisted host`)); // ❌

  const RevalidateID = revalidateId && revalidateId.toString().trim();
  if (!revalidateId || RevalidateID.length <= 0)
    return Respond(ErrorHandling(400, "Missing AnimeId to Revalidate")); // ❌

  if (method !== "GET")
    return Respond(ErrorHandling(400, "Only accept GET req")); // ❌

  if (!headers || !headers.authorization)
    return Respond(ErrorHandling(400, "Missing Auth Token")); // ❌

  try {
    await auth.verifyIdToken(headers.authorization); // Auth

    const isValid = isValidUrl(
      encodeURI(`https://ack.vercel.app/anime/${RevalidateID}`)
    );
    const SecureId = parseInt(RevalidateID);
    if (!isValid || isNaN(SecureId))
      return Respond(ErrorHandling(400, "Path To Revalidate Is Not Valid")); // ❌

    const RevalidateDoc = await db
      .collection("animes")
      .doc(SecureId.toString())
      .get();

    if (!RevalidateDoc.exists)
      return Respond(ErrorHandling(400, "ID is not found")); // ❌

    const AnimeData = RevalidateDoc.data() as AnimeShape;
    if ((AnimeData?.NextRefresh || 0) > Date.now())
      return Respond(ErrorHandling(400, "Anime is not expire")); // ❌

    await res.unstable_revalidate(`/anime/${SecureId.toString()}`);
    Respond(SuccessHandling(200));
  } catch (err) {
    console.error(err);
    Respond(ErrorHandling(500, "Error In Server while trying to revalidate")); // ❌
  }
};
export default ApiRoute;
