/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// Ctx
import { UserContext } from "../lib/context";
// Icons
import { FaSignInAlt, FaUserAltSlash } from "react-icons/fa";

const AuthCheck = ({ children }) => {
  const { user, username } = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/sign-up");
    }, 15000);
  }, []);

  return user && username ? (
    children
  ) : (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <Link href="/sign-up">
        <a className="text-gray-50">
          <FaUserAltSlash className="inline text-6xl bg-gray-600 rounded-full py-2 px-2 text-primary -mt-6 mb-6" />
          <h1 className="font-bold text-4xl hover:underline">
            <FaSignInAlt className="inline text-red-500 mr-4" />
            You must be{" "}
            <span className="text-primary hover:text-yellow-300 transition">
              signed in!
            </span>
          </h1>
          <p className="text-white mt-2 text-xl">
            You&apos;ll be redirect in 15s
          </p>
        </a>
      </Link>
    </div>
  );
};

export default AuthCheck;
