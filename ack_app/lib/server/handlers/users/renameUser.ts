// Server
import { db } from "../../../firebase/firebase-admin";
import { BasicCheck, HandlerRequestShape, ThrowError } from "../../trpc";
// Funcs
import { FbAuthentificate } from "../../ApiFunc";

interface InputShape {
  OldUsername: string;
  NewUsername: string;
}
export default async function renameUser(req: HandlerRequestShape<InputShape>) {
  const { AuthToken } = req?.ctx;
  const { OldUsername, NewUsername } = req.input;

  BasicCheck(req?.ctx);

  try {
    const { success, data: uid } = await FbAuthentificate(AuthToken);
    if (!success || !uid)
      return ThrowError("UNAUTHORIZED", "Unvalid User Token"); // ❌

    const CurrentUsernameRef = db.collection("usernames").doc(OldUsername);
    const UserUidToRename = await CurrentUsernameRef.get();
    if (!UserUidToRename.exists || UserUidToRename.data().uid !== uid)
      return ThrowError("FORBIDDEN", "You're not the owner of this account"); // ❌

    const newUsernameRef = db.collection("usernames").doc(NewUsername);
    const UsernameDoc = await newUsernameRef.get();

    const isAvailable = !UsernameDoc.exists;
    if (!isAvailable)
      return ThrowError("CONFLICT", "This Username Already exist !"); // ❌

    const batch = db.batch();

    // /usernames
    batch.delete(CurrentUsernameRef);
    batch.set(newUsernameRef, { uid });

    // /users
    batch.update(db.collection("users").doc(uid), {
      username: NewUsername,
    });

    await batch.commit(); // Save
    return true; // ✅
  } catch (err) {
    console.error("Error on api route '/renameUser'", err);
    return ThrowError("INTERNAL_SERVER_ERROR", JSON.stringify(err)); // ❌
  }
}
