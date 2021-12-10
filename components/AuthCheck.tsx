/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// Ctx
import { GlobalAppContext } from "../lib/context";
// UI
import { FaSignInAlt, FaUserAltSlash } from "react-icons/fa";
import Loader from "./Loader";

const AuthCheck = ({ children }) => {
  const { user, username, reqFinished } = useContext(GlobalAppContext);
  const router = useRouter();
  const ClearTimeout = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (user && username)
      return ClearTimeout.current.forEach((Timeout) => clearTimeout(Timeout));
    ClearTimeout.current = [
      ...ClearTimeout.current,
      setTimeout(() => {
        router.push("/sign-up");
      }, 15000),
    ];
  }, [user, username]);

  return !reqFinished ? (
    <div className="flex flex-col justify-center items-center h-screen text-center ">
      <h1 className="font-bold text-xl text-headline bg-gray-700 py-4 px-4 rounded-md">
        <Loader show />
        <span className="text-primary-main hover:text-secondary transition">
          Connecting
        </span>{" "}
        to your account
      </h1>
    </div>
  ) : user && username ? (
    children
  ) : (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <Link href="/sign-up">
        <a className="text-headline">
          <FaUserAltSlash
            className="inline transform -translate-y-0.5 text-6xl 
          bg-gray-600 rounded-full py-2 px-2 text-primary-main -mt-6 mb-6"
          />
          <h1 className="font-bold text-4xl hover:underline">
            <FaSignInAlt className="inline transform -translate-y-0.5 text-red-500 mr-4" />
            You must be{" "}
            <span className="text-primary-main hover:text-secondary transition">
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
