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
  const { method, headers } = req;

  if (!headers || !headers.authorization)
    return Respond(ErrorHandling(401, "Missing User Authentification Token")); // ❌

  if (method !== "DELETE")
    return Respond(ErrorHandling(401, "Only accept DELETE req")); // ❌

  // Req Handler
  try {
    const { uid } = await auth.verifyIdToken(headers.authorization);

    await db.collection("users").doc(uid).delete(); // 🚮 Delete User Data
    await db.collection("usernames").doc(uid).delete(); // 🚮 Free the username
    await auth.deleteUser(uid); // 🚮 Delete permanently the user

    Respond(SuccessHandling(201));
  } catch (err) {
    console.error("Error on api route '/[animeId]'");
    Respond(ErrorHandling(500, JSON.stringify(err)));
  }
};
export default DeletUserHandler;
