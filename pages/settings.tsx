import { NextPage } from "next";
import React, { useEffect, useRef } from "react";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
import { auth } from "../lib/firebase";
// UI
import MetaTags from "../components/Common/Metatags";
import { FaHome, FaSignOutAlt } from "react-icons/fa";
// Types
import { BeforeInstallPromptEvent } from "../lib/types/interface";
import toast from "react-hot-toast";

/* Components */
const Settings: NextPage = () => {
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

  return (
    <AuthCheck
      PageMetaData={[
        "Settings - Please Connect",
        "Private Page - Please Connect To Access It",
      ]}
    >
      <main className="h-screen flex flex-col justify-center items-center">
        <MetaTags title="User's Settings" description="Settings of ACK User" />
        <h1 className="text-headline font-bold text-5xl text-center">
          🦺 Under construction
        </h1>
        <div className="flex justify-center flex-wrap">
          <button
            onClick={() => auth.signOut()}
            className="p-2 mt-4 bg-red-500 text-headline rounded-md font-semibold text-xl"
          >
            <FaSignOutAlt className="icon" /> Sign Out
          </button>
          <button
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
          </button>
        </div>
      </main>
    </AuthCheck>
  );
};

export default Settings;
