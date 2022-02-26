import type { NextApiRequest, NextApiResponse } from "next";
import {
  ErrorHandling,
  IsBlacklistedHost,
  SuccessHandling,
} from "../../../lib/utils/ApiFunc";
import { ResApiRoutes } from "../../../lib/utils/types/interface";
import { decryptDatas, isValidUrl } from "../../../lib/utils/UtilsFunc";

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

  if (!headers || !headers.proofofcall)
    return Respond(ErrorHandling(400, "Missing proofofcall Token")); // ❌

  try {
    const EncryptedToken = Buffer.from(
      headers.proofofcall.toString(),
      "base64"
    );
    const decryptedToken = decryptDatas(EncryptedToken);
    const TimeOfCall = parseInt(decryptedToken);

    if (isNaN(TimeOfCall))
      return Respond(ErrorHandling(400, "Proof Of Call Invalid")); // ❌

    if (Date.now() - TimeOfCall > 1000)
      return Respond(ErrorHandling(400, "Proof Of Call Invalid")); // ❌

    const isValid = isValidUrl(
      encodeURI(`https://ack.vercel.app/anime/${RevalidateID}`)
    );
    const SecureId = parseInt(RevalidateID);
    if (!isValid || isNaN(SecureId))
      return Respond(ErrorHandling(400, "Path To Revalidate Is Not Valid")); // ❌

    await res.unstable_revalidate(`/anime/${SecureId.toString()}`);
    Respond(SuccessHandling(200));
  } catch (err) {
    console.error(err);
    Respond(ErrorHandling(500, "Error In Server while trying to revalidate")); // ❌
  }
};
export default ApiRoute;
