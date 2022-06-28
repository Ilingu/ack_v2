// Server
import { auth, db } from "../../../firebase/firebase-admin";
import { BasicCheck, HandlerRequestShape, ThrowError } from "../../trpc";
// Funcs
import { FbAuthentificate } from "../../ApiFunc";

export default async function deleteUser(req: HandlerRequestShape<string>) {
  const { AuthToken, host } = req?.ctx;
  const Username = req.input;

  BasicCheck(host, AuthToken);

  try {
    const { success, data: uid } = await FbAuthentificate(AuthToken);
    if (!success || !uid)
      return ThrowError("UNAUTHORIZED", "Unvalid User Token"); // ❌

    const UserUidToDelete = await db
      .collection("usernames")
      .doc(Username)
      .get();

    if (!UserUidToDelete.exists || UserUidToDelete.data().uid !== uid)
      return ThrowError("FORBIDDEN", "You're not the owner of this account"); // ❌

    await db.collection("usernames").doc(Username).delete(); // 🚮 Free the username
    await db.recursiveDelete(db.collection("users").doc(uid)); // 🚮 Delete User Data

    await auth.deleteUser(uid); // 🚮 Delete permanently the user
    return true; // ✅
  } catch (err) {
    console.error("Error on api route '/deleteUser'", err);
    return ThrowError("INTERNAL_SERVER_ERROR", JSON.stringify(err)); // ❌
  }
}
