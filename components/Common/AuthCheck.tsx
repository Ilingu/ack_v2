/* eslint-disable react-hooks/exhaustive-deps */
import { useContext } from "react";
import Link from "next/link";
// Ctx
import { GlobalAppContext } from "../../lib/context";
// UI
import { FaSignInAlt, FaUserAltSlash } from "react-icons/fa";
import Loader from "../Design/Loader";
import MetaTags from "./Metatags";

interface AuthCheckProps {
  children: React.ReactElement;
  fallback?: React.ReactElement;
  PageMetaData?: [string, string];
}

const AuthCheck = ({ children, fallback, PageMetaData }: AuthCheckProps) => {
  const { user, username, reqFinished } = useContext(GlobalAppContext);

  return user && username ? (
    children
  ) : !reqFinished && !fallback ? (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <MetaTags
        title={PageMetaData && PageMetaData[0]}
        description={PageMetaData && PageMetaData[1]}
      />
      <h1 className="font-bold text-xl text-headline bg-gray-700 py-4 px-4 rounded-md">
        <Loader show />
        <span className="text-primary-main hover:text-secondary transition">
          Connecting
        </span>{" "}
        to your account
      </h1>
    </div>
  ) : !reqFinished && fallback ? (
    <h1 className="font-bold text-xl text-center text-headline py-4 px-4 rounded-md">
      <MetaTags
        title={PageMetaData && PageMetaData[0]}
        description={PageMetaData && PageMetaData[1]}
      />
      <Loader show />
      <span className="text-primary-main">Connecting</span> to your account
    </h1>
  ) : !fallback ? (
    <div className="flex flex-col justify-center items-center h-screen text-center">
      <MetaTags
        title={PageMetaData && PageMetaData[0]}
        description={PageMetaData && PageMetaData[1]}
      />

      <Link href="/sign-up">
        <a className="text-headline">
          <FaUserAltSlash
            className="icon text-6xl 
          bg-gray-600 rounded-full py-2 px-2 text-primary-main -mt-6 mb-6"
          />
          <h1 className="font-bold text-4xl hover:underline">
            <FaSignInAlt className="icon text-red-500 mr-4" />
            You must be{" "}
            <span className="text-primary-main hover:text-secondary transition">
              signed in!
            </span>
          </h1>
        </a>
      </Link>
    </div>
  ) : (
    fallback
  );
};

export default AuthCheck;
