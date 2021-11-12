import Link from "next/link";
// Ctx
import { useContext } from "react";
import { UserContext } from "../lib/context";

const AuthCheck = ({ children }) => {
  const { user, username } = useContext(UserContext);

  return user && username ? (
    children
  ) : (
    <Link href="/sign-up">You must be signed in!</Link>
  );
};

export default AuthCheck;
