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
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <MetaTags
        title={PageMetaData && PageMetaData[0]}
        description={PageMetaData && PageMetaData[1]}
      />
      <h1 className="text-headline bg-bgi-whiter rounded-md py-4 px-4 text-xl font-bold">
        <Loader show />
        <span className="text-primary-main hover:text-secondary transition">
          Connecting
        </span>{" "}
        to your account
      </h1>
    </div>
  ) : !reqFinished && fallback ? (
    <h1 className="text-headline rounded-md py-4 px-4 text-center text-xl font-bold">
      <MetaTags
        title={PageMetaData && PageMetaData[0]}
        description={PageMetaData && PageMetaData[1]}
      />
      <Loader show />
      <span className="text-primary-main">Connecting</span> to your account
    </h1>
  ) : !fallback ? (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <MetaTags
        title={PageMetaData && PageMetaData[0]}
        description={PageMetaData && PageMetaData[1]}
      />

      <Link href="/sign-up">
        <a className="text-headline">
          <FaUserAltSlash
            className="icon text-primary-main 
          -mt-6 mb-6 rounded-full bg-gray-600 py-2 px-2 text-6xl"
          />
          <h1 className="text-4xl font-bold hover:underline">
            <FaSignInAlt className="icon mr-4 text-red-500" />
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
