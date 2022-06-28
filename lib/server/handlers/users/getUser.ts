import { auth, db } from "../../../firebase/firebase-admin";
import { AnimeWatchType } from "../../../utils/types/enums";
import { ResDataUser, UserAnimeShape } from "../../../utils/types/interface";
import { postToJSON } from "../../../utils/UtilsFunc";
import { FbAuthentificate } from "../../ApiFunc";
import { BasicCheck, HandlerRequestShape, ThrowError } from "../../trpc";

export default async function getUser(req: HandlerRequestShape<string>) {
  const { AuthToken, host } = req?.ctx;
  const Username = req.input;

  BasicCheck(host, AuthToken);

  try {
    const { success } = await FbAuthentificate(AuthToken);
    if (!success) return ThrowError("UNAUTHORIZED", "Unvalid User Token"); // ❌

    const uidDoc = await db.collection("usernames").doc(Username).get();
    if (!uidDoc.exists)
      return ThrowError("NOT_FOUND", "This Username is not linked to a User"); // ❌

    const uid: string = uidDoc.data().uid;
    if (!uid)
      return ThrowError("NOT_FOUND", "This Username is not linked to a User"); // ❌

    const UserRes = await auth.getUser(uid);
    if (!UserRes)
      return ThrowError("NOT_FOUND", "This UID is not linked to a User"); // ❌

    const UserAnimes = await db
      .collection("users")
      .doc(uid)
      .collection("animes")
      .get();
    const UserFavoriteAnime =
      ((await db.collection("users").doc(uid).get()).data()
        ?.FavoriteAnime as string) || "BSD!";

    let NoOfAnimes = 0;
    let NoOfWatchAnimes = 0;

    if (!UserAnimes.empty) {
      const UserAnimesDatas = UserAnimes?.docs.map(
        postToJSON
      ) as UserAnimeShape[];
      NoOfAnimes = UserAnimesDatas?.length;
      NoOfWatchAnimes = UserAnimesDatas?.filter(
        ({ WatchType }) => WatchType === AnimeWatchType.WATCHED
      )?.length;
    }

    return {
      User: UserRes.toJSON(),
      NoOfAnimes,
      NoOfWatchAnimes,
      UserFavoriteAnime,
    } as ResDataUser;
  } catch (err) {
    console.error("Error on api route '/getUser'", err);
    return ThrowError("INTERNAL_SERVER_ERROR", JSON.stringify(err)); // ❌
  }
}
