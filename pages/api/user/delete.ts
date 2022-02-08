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
  const { method, headers, body } = req;

  if (headers.host === "ack-git-dev-ilingu.vercel.app")
    return Respond(ErrorHandling(401, `Access Denied, blacklisted host`)); // ❌

  if (!headers || !headers.authorization)
    return Respond(ErrorHandling(400, "Missing User Authentification Token")); // ❌

  if (method !== "DELETE")
    return Respond(ErrorHandling(400, "Only accept DELETE req")); // ❌

  const Body = JSON.parse(body);
  if (!Body || !Body["username"] || !Body["user_uid"])
    return Respond(ErrorHandling(400, "Missing User New/Old Username Params")); // ❌

  // Req Handler
  try {
    const { uid } = await auth.verifyIdToken(headers.authorization);
    const Username: string = Body["username"].trim();

    const UserUidToDelete = await db
      .collection("usernames")
      .doc(Username)
      .get();

    if (!UserUidToDelete.exists || UserUidToDelete.data().uid !== uid)
      return Respond(
        ErrorHandling(403, "You're not the owner of this account") // ❌
      );

    await db.collection("usernames").doc(Username).delete(); // 🚮 Free the username
    await db.recursiveDelete(db.collection("users").doc(uid)); // 🚮 Delete User Data

    await auth.deleteUser(uid); // 🚮 Delete permanently the user
    Respond(SuccessHandling(200));
  } catch (err) {
    console.error("Error on api route '/[animeId]'");
    Respond(ErrorHandling(401, JSON.stringify(err)));
  }
};
export default DeletUserHandler;
