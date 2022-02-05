import React, { useContext, useEffect, useRef } from "react";
import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
import { auth } from "../lib/firebase";
import { GlobalAppContext } from "../lib/context";
// UI
import MetaTags from "../components/Common/Metatags";
import { FaClock, FaHome, FaSignOutAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import Divider from "../components/Design/Divider";
import { AiFillMail } from "react-icons/ai";
// Types
import { BeforeInstallPromptEvent } from "../lib/utils/types/interface";

/* 
   - Version
   - User Interaction (delete, change username)
   - User stats
*/

/* Components */
const Settings: NextPage = () => {
  const { user, username } = useContext(GlobalAppContext);
  const deferredPrompt = useRef<BeforeInstallPromptEvent>(null);

  useEffect(() => {
    /* PWA */
    window.addEventListener(
      "beforeinstallprompt",
      (e: BeforeInstallPromptEvent) => {
        deferredPrompt.current = e;
      }
    );
  }, []);

  useEffect(() => {
    // (async () => {
    //   console.log(await user.getIdToken());
    // })();
    console.log(user);
  }, [user]);

  return (
    <AuthCheck
      PageMetaData={[
        "Settings - Please Connect",
        "Private Page - Please Connect To Access It",
      ]}
    >
      <main className="h-screen flex flex-col items-center">
        <MetaTags title="User's Settings" description="Settings of ACK User" />
        <div className="w-1/2">
          {/* Basic User Data */}
          <section className="flex gap-5 mt-10 px-3">
            <div>
              <Image
                src={user?.photoURL}
                alt="User Avatar"
                height={180}
                width={180}
                className="rounded-3xl"
              />
            </div>
            <div>
              <div className="flex flex-col text-headline font-bold text-3xl">
                {user?.displayName}
                <Link href={`/user/${username}`} passHref>
                  <a className="text-lg font-semibold text-primary-whitest hover:underline">
                    @{username}
                  </a>
                </Link>
              </div>
              <div className="mt-2 font-semibold text-headline">
                <FaClock className="icon" /> Member since{" "}
                <span className="text-primary-whitest">
                  {new Date(user?.metadata.creationTime).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-2 font-semibold text-headline">
                <AiFillMail className="icon" /> Email -{" "}
                <span className="text-primary-whitest">{user?.email}</span>
              </div>
            </div>
          </section>
          <Divider />
          {/* User's Stats */}
          <section className="mt-5 px-3">
            <header>
              <h1 className="text-2xl font-bold text-description-whiter capitalize">
                {username}&apos;s Stats
              </h1>
            </header>
          </section>
          <Divider />
          {/* User's Settings */}
          <section></section>
        </div>
      </main>
    </AuthCheck>
  );
};

export default Settings;

/* <button
            onClick={() => auth.signOut()}
            className="p-2 mt-4 bg-red-500 text-headline rounded-md font-semibold text-xl"
          >
            <FaSignOutAlt className="icon" /> Sign Out
          </button> */

/* <button
            onClick={async () => {
              if (deferredPrompt.current !== null) {
                deferredPrompt.current.prompt();
                const { outcome } = await deferredPrompt.current.userChoice;
                if (outcome === "accepted") {
                  deferredPrompt.current = null;
                  toast.success("Thanks to install the app !");
                }
              }
            }}
            className="p-2 mt-4 bg-primary-main text-headline rounded-md font-semibold text-xl ml-4"
          >
            <FaHome className="icon" /> Add To HomeScreen
          </button> */
