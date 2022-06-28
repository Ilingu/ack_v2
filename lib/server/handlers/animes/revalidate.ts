import { BasicCheck, HandlerRequestShape, ThrowError } from "../../trpc";
// Funcs
import { FbAuthentificate } from "../../ApiFunc";
import { isValidUrl } from "../../../utils/UtilsFunc";
import { db } from "../../../firebase/firebase-admin";
// Types
import { AnimeShape } from "../../../utils/types/interface";

export default async function revalidateAnime(
  req: HandlerRequestShape<number>
) {
  const { AuthToken, host, res } = req?.ctx;
  const AnimeID = req.input?.toString();

  BasicCheck(host, AuthToken);
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
    if ((AnimeData?.NextRefresh || 0) > Date.now())
      return ThrowError("BAD_REQUEST", "Anime is not expire"); // ❌

    await res.unstable_revalidate(`/anime/${AnimeID}`);
    return true; // ✅
  } catch (err) {
    console.error("Error on api route '/deleteUser'", err);
    return ThrowError("INTERNAL_SERVER_ERROR", JSON.stringify(err)); // ❌
  }
}
