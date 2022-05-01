import type { NextApiRequest, NextApiResponse } from "next";
import { auth, db } from "../../../lib/firebase/firebase-admin";
import {
  ErrorHandling,
  IsBlacklistedHost,
  SuccessHandling,
} from "../../../lib/utils/ApiFunc";
import type { ResApiRoutes } from "../../../lib/utils/types/interface";

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

  if (IsBlacklistedHost(headers.host))
    return Respond(ErrorHandling(401, `Access Denied, blacklisted host`)); // ❌

  if (!headers || !headers.authorization)
    return Respond(ErrorHandling(400, "Missing User Authentification Token")); // ❌

  if (method !== "PUT")
    return Respond(ErrorHandling(400, "Only accept PUT req")); // ❌

  const Body = JSON.parse(body);
  if (!Body || !Body["new-username"] || !Body["old-username"])
    return Respond(ErrorHandling(400, "Missing User New/Old Username Params")); // ❌

  // Req Handler
  try {
    const { uid } = await auth.verifyIdToken(headers.authorization);
    const OldUsername: string = Body["old-username"].trim();
    const NewUsername: string = Body["new-username"].trim();

    if (
      !OldUsername ||
      !NewUsername ||
      OldUsername.length <= 0 ||
      NewUsername.length <= 0
    )
      return Respond(ErrorHandling(422, "This Username Already exist !")); // ❌

    const CurrentUsernameRef = db.collection("usernames").doc(OldUsername);
    const UserUidToRename = await CurrentUsernameRef.get();
    if (!UserUidToRename.exists || UserUidToRename.data().uid !== uid)
      return Respond(
        ErrorHandling(403, "You're not the owner of this account") // ❌
      );

    const newUsernameRef = db.collection("usernames").doc(NewUsername);
    const UsernameDoc = await newUsernameRef.get();

    const isAvailable = !UsernameDoc.exists;
    if (!isAvailable)
      return Respond(ErrorHandling(422, "This Username Already exist !")); // ❌

    const batch = db.batch();

    // /usernames
    batch.delete(CurrentUsernameRef);
    batch.set(newUsernameRef, { uid });

    // /users
    batch.update(db.collection("users").doc(uid), {
      username: NewUsername,
    });

    await batch.commit();
    Respond(SuccessHandling(200));
  } catch (err) {
    console.error("Error on api route '/[animeId]'", err);
    Respond(ErrorHandling(401, JSON.stringify(err)));
  }
};
export default DeletUserHandler;
