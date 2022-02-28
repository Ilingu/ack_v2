import type { NextApiRequest, NextApiResponse } from "next";
import { auth, db } from "../../../lib/firebase/firebase-admin";
import {
  ErrorHandling,
  IsBlacklistedHost,
  SuccessHandling,
} from "../../../lib/utils/ApiFunc";
import { AnimeWatchType } from "../../../lib/utils/types/enums";
import {
  ResApiRoutes,
  UserAnimeShape,
} from "../../../lib/utils/types/interface";
import { decryptDatas, postToJSON } from "../../../lib/utils/UtilsFunc";

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
    query: { username },
    method,
    headers,
  } = req;

  if (IsBlacklistedHost(headers.host))
    return Respond(ErrorHandling(401, `Access Denied, blacklisted host`)); // ❌

  const Username = username && username.toString().trim();
  if (!username || Username.length <= 0)
    return Respond(ErrorHandling(400, "Missing User Username")); // ❌

  if (!headers || !headers.authorization)
    return Respond(ErrorHandling(400, "Missing User Authentification Token")); // ❌

  if (method !== "GET")
    return Respond(ErrorHandling(400, "Only accept GET req")); // ❌

  // Req Handler
  try {
    const EncryptedToken = Buffer.from(headers.authorization, "base64");
    const decryptedToken = decryptDatas(EncryptedToken);
    await auth.verifyIdToken(decryptedToken);

    const uidDoc = await db.collection("usernames").doc(Username).get();
    if (!uidDoc.exists)
      return Respond(
        ErrorHandling(404, "This Username is not linked to a User")
      );

    const uid: string = uidDoc.data().uid;
    if (!uid)
      return Respond(
        ErrorHandling(404, "This Username is not linked to a User")
      );

    const UserRes = await auth.getUser(uid);
    if (!UserRes)
      return Respond(ErrorHandling(404, "This UID is not linked to a User"));

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

    Respond(
      SuccessHandling(200, {
        User: UserRes.toJSON(),
        NoOfAnimes,
        NoOfWatchAnimes,
        UserFavoriteAnime,
      })
    );
  } catch (err) {
    console.error("Error on api route '/[animeId]'");
    Respond(ErrorHandling(401, JSON.stringify(err)));
  }
};
export default DeletUserHandler;
