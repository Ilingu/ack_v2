import { BasicCheck, HandlerRequestShape, ThrowError } from "../../trpc";
// Funcs
import { FbAuthentificate } from "../../ApiFunc";
import { isValidUrl } from "../../../utils/UtilsFuncs";
import { db } from "../../../firebase/firebase-admin";
// Types
import { AnimeShape } from "../../../utils/types/interface";

export default async function revalidateAnime(
  req: HandlerRequestShape<number>
) {
  const { AuthToken, res } = req?.ctx;
  const AnimeID = req.input?.toString();

  BasicCheck(req?.ctx);
  if (!res)
    return ThrowError(
      "INTERNAL_SERVER_ERROR",
      "Cannot Access Ressource Response"
    ); // ❌

  try {
    const { success } = await FbAuthentificate(AuthToken);
    if (!success) return ThrowError("UNAUTHORIZED", "Unvalid User Token"); // ❌

    if (!isValidUrl(encodeURI(`https://ack.vercel.app/anime/${AnimeID}`)))
      return ThrowError("BAD_REQUEST", "Path To Revalidate Is Not Valid"); // ❌

    const RevalidateDoc = await db.collection("animes").doc(AnimeID).get();

    if (!RevalidateDoc.exists)
      return ThrowError("BAD_REQUEST", "ID is not found"); // ❌

    const AnimeData = RevalidateDoc.data() as AnimeShape;
    if ((AnimeData?.NextRefresh || 0) > Date.now()) {
      console.error({
        ServerTime: Date.now(),
        NextRefreshTime: AnimeData?.NextRefresh,
      });
      return ThrowError("BAD_REQUEST", "Anime is not expired"); // ❌
    }

    await res.revalidate(`/anime/${AnimeID}`);
    return true; // ✅
  } catch (err) {
    console.error("Error on api route '/revalidate'", err);
    return ThrowError("INTERNAL_SERVER_ERROR", JSON.stringify(err)); // ❌
  }
}
