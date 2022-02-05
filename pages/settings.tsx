/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NextPage } from "next";
import debounce from "lodash.debounce";
// Auth
import AuthCheck from "../components/Common/AuthCheck";
import { GlobalAppContext } from "../lib/context";
import { auth, db } from "../lib/firebase";
// UI
import MetaTags from "../components/Common/Metatags";
import toast from "react-hot-toast";
import Divider from "../components/Design/Divider";
// Types
import {
  BeforeInstallPromptEvent,
  ResApiRoutes,
  UserStatsShape,
} from "../lib/utils/types/interface";
import { FiSettings } from "react-icons/fi";
import { AnimeWatchType } from "../lib/utils/types/enums";
import UserProfil from "../components/User/UserProfil";
import { FaBan, FaHome, FaSignOutAlt, FaTrashAlt } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { callApi } from "../lib/utils/UtilsFunc";

/* Components */
const Settings: NextPage = () => {
  const { user, username, UserAnimes } = useContext(GlobalAppContext);
  const deferredPrompt = useRef<BeforeInstallPromptEvent>(null);
  const deleteAccountTimeout = useRef<NodeJS.Timeout>(null);

  const [DAConfirmation, setDeleteAccount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* PWA */
    window.addEventListener(
      "beforeinstallprompt",
      (e: BeforeInstallPromptEvent) => {
        deferredPrompt.current = e;
      }
    );
    setMounted(true);
  }, []);
  useEffect(() => {
    if (DAConfirmation >= 2 && !deleteAccountTimeout.current) {
      toast.success("Your account will be deleted in 10s");
      deleteAccountTimeout.current = setTimeout(() => {
        DeleteAccount();
      }, 1000);
      return;
    }

    clearTimeout(deleteAccountTimeout.current);
    deleteAccountTimeout.current = null;
  }, [DAConfirmation]);

  const UserStats: UserStatsShape[] = useMemo(
    (): UserStatsShape[] =>
      user && [
        { data: UserAnimes?.length, desc: "💥 Animes" },
        {
          data: UserAnimes?.filter(
            ({ WatchType }) => WatchType === AnimeWatchType.WATCHED
          ).length,
          desc: "🎥 Watched Anime",
        },
        { data: "🦺 Under Contruction", desc: "❤ Favorite Anime" },
        {
          data: new Date(user?.metadata.lastSignInTime).toLocaleDateString(),
          desc: `🔥 Last time ${user?.displayName} was Online`,
        },
      ],
    [user, UserAnimes]
  );

  const DeleteAccount = async () => {
    deleteAccountTimeout.current = null;
    if (DAConfirmation < 2) return;

    try {
      const res: ResApiRoutes = await callApi(
        `http://${window.location.host}/api/user/delete`,
        true,
        {
          method: "DELETE",
          body: JSON.stringify({ username }),
        }
      );

      if (res.succeed) {
        toast.success(`Your account has been deleted !`);
        await auth.signOut();
        return;
      }

      toast.error("Cannot delete your account (Internal Error)");
    } catch (err) {
      toast.error("Cannot delete your account (Internal Error)");
      console.error(err);
    }
  };

  // JSX
  if (!mounted) return <div>Loading...</div>;
  return (
    <AuthCheck
      PageMetaData={[
        "Settings - Please Connect",
        "Private Page - Please Connect To Access It",
      ]}
    >
      <main className="h-screen flex flex-col items-center">
        <MetaTags title="User's Settings" description="Settings of ACK User" />
        <div className="2xl:w-1/2 lg:w-2/3 md:w-11/12 sm:w-5/6 w-11/12">
          {/* User's Profile */}
          <UserProfil UserData={{ user, username }} UserStats={UserStats} />
          {/* User's Settings */}
          <Divider />(
          <section className="my-5 px-3">
            <header>
              <h1 className="text-2xl font-bold text-description-whiter">
                <FiSettings className="icon" /> Settings{" "}
                <span className="font-semibold text-description text-lg">
                  [ACK::OPEN BETA]
                </span>
              </h1>
            </header>
            <div className="flex flex-col items-center mt-5">
              {/* Basics User Button */}
              <section>
                <button
                  onClick={() => auth.signOut()}
                  className="p-1 bg-yellow-400 text-black rounded-md font-semibold text-lg"
                >
                  <FaSignOutAlt className="icon" /> Sign Out
                </button>
                <button
                  onClick={async () => {
                    if (deferredPrompt.current !== null) {
                      deferredPrompt.current.prompt();
                      const { outcome } = await deferredPrompt.current
                        .userChoice;
                      if (outcome === "accepted") {
                        deferredPrompt.current = null;
                        toast.success("Thanks !");
                      }
                    }
                  }}
                  className="p-1 bg-primary-main text-headline rounded-md font-semibold text-lg ml-4"
                >
                  <FaHome className="icon" /> A2HS
                </button>
              </section>
              <section className="mt-5 w-full ring-2 ring-description text-center rounded-md p-2">
                <h1 className="text-xl font-bold text-description-whiter mb-1">
                  Session Data:
                </h1>
                <ul className="grid grid-cols-2  text-headline text-lg">
                  <li>
                    App Version:{" "}
                    <span className="text-primary-whitest">
                      {window.appVersion()}
                    </span>
                  </li>
                  <li>
                    Language:{" "}
                    <span className="text-primary-whitest">
                      {navigator?.language}
                    </span>
                  </li>
                  <li>
                    OS:{" "}
                    <span className="text-primary-whitest">
                      {navigator?.userAgentData?.platform}
                    </span>
                  </li>
                  <li>
                    Mobile:{" "}
                    <span className="text-primary-whitest">
                      [{navigator?.userAgentData?.mobile ? "True" : "False"},{" "}
                      {window.mobileAndTabletCheck() ? "True" : "False"}]
                    </span>
                  </li>
                  <li>
                    Web Core:{" "}
                    <span className="text-primary-whitest">
                      {navigator?.userAgentData?.brands[1]?.brand}
                    </span>
                  </li>
                  <li>
                    Do not track:{" "}
                    <span className="text-primary-whitest">
                      {navigator?.doNotTrack === "1" ? "True" : "False"}
                    </span>
                  </li>
                  <li>
                    Login Service:{" "}
                    <span className="capitalize text-primary-whitest">
                      {user?.providerId}
                    </span>
                  </li>
                  <li>
                    ACK Version:{" "}
                    <span className="text-primary-whitest">Open Beta (5)</span>
                  </li>
                  <li>
                    Network Listener:{" "}
                    <span className="text-primary-whitest">
                      {navigator?.connection ? "Active" : "Not Active"}
                    </span>
                  </li>
                  <li>
                    Verified Email:{" "}
                    <span className="text-primary-whitest">
                      {user?.emailVerified ? "True" : "False"}
                    </span>
                  </li>
                </ul>
              </section>
              <section className="mt-5 w-full ring-2 ring-description text-center rounded-md p-2">
                <h1 className="text-xl font-bold text-description-whiter mb-1">
                  Username:
                </h1>
                <RenameUsername DefaultUsername={username} />
              </section>
              <section className="mt-5 w-full ring-2 ring-description text-center rounded-md p-2">
                <h1 className="text-xl font-bold text-description-whiter mb-1">
                  Delete Account:
                </h1>
                <p className="text-red-200 font-semibold text-center">
                  ⚡ Warning: By deleting your account you accept to delete ALL
                  your datas from this service (animes, username, account...)
                </p>
                <button
                  onClick={() =>
                    setDeleteAccount((prev) => (prev + 1 > 2 ? 0 : prev + 1))
                  }
                  className={`${
                    DAConfirmation > 1 ? "bg-green-500" : "bg-red-400"
                  } text-headline font-semibold text-lg py-1 px-5 rounded-lg mt-3 hover:${
                    DAConfirmation <= 1 && "bg-red-500"
                  } 
                  transition-all outline-none focus:ring focus:ring-headline`}
                >
                  {DAConfirmation <= 1 ? (
                    <FaTrashAlt className="icon" />
                  ) : (
                    <FaBan className="icon" />
                  )}{" "}
                  {DAConfirmation === 0
                    ? "Delete My Account"
                    : DAConfirmation === 1
                    ? "Click To Confirm"
                    : "Click To Cancel"}
                </button>
              </section>
              <section className="mt-5 w-full ring-2 ring-description text-center rounded-md p-2">
                <h1 className="text-xl font-bold text-description-whiter mb-1">
                  Contact Dev:
                </h1>
                <ul className="text-headline grid grid-cols-2">
                  <li>
                    <span className="text-description-whiter underline">
                      Github:
                    </span>{" "}
                    <a
                      href="https://github.com/Ilingu"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @Ilingu
                    </a>
                  </li>
                  <li>
                    <span className="text-description-whiter underline">
                      Email:
                    </span>{" "}
                    <a
                      href="mailto:ilingu@protonmail.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ilingu@protonmail.com
                    </a>
                  </li>
                </ul>
              </section>
            </div>
          </section>
        </div>
      </main>
    </AuthCheck>
  );
};

function RenameUsername({ DefaultUsername }: { DefaultUsername: string }) {
  const [Username, setUserName] = useState<string>(() => DefaultUsername);
  const [IsValid, setIsValid] = useState(false);
  const [Loading, setLoading] = useState(false);

  useEffect(() => {
    checkUsername(Username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Username]);

  const ChangeUsername = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!IsValid) return;
    if (Username === DefaultUsername) {
      toast.error("Cannot Change to your current username");
      return;
    }

    try {
      const res: ResApiRoutes = await callApi(
        `http://${window.location.host}/api/user/rename`,
        true,
        {
          method: "PUT",
          body: JSON.stringify({
            "old-username": DefaultUsername,
            "new-username": Username,
          }),
        }
      );

      if (res.succeed) {
        toast.success(`Hello ${Username} !`);
        return;
      }

      toast.error("Cannot Change your username");
    } catch (err) {
      toast.error("Cannot Change your username");
      console.error(err);
    }
  };

  const HandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const NewUsername = e.target.value.toLowerCase();
    const re = /^(?=[a-zA-Z0-9._]{3,15}$)(?!.*[_.]{2})[^_.].*[^_.]$/;
    if (NewUsername.length < 3 || NewUsername === DefaultUsername) {
      setUserName(NewUsername);
      setLoading(false);
      setIsValid(false);
      return;
    }

    if (re.test(NewUsername)) {
      setUserName(NewUsername);
      setLoading(true);
      setIsValid(false);
    }
  };

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username.length >= 3) {
        const UsernamesRef = doc(db, "usernames", username);
        const docSnap = await getDoc(UsernamesRef);
        setIsValid(!docSnap.exists());
        setLoading(false);
      }
    }, 500),
    []
  );

  return (
    <form onSubmit={ChangeUsername}>
      <span className="text-headline font-bold text-lg">@</span>
      <input
        type="text"
        value={Username}
        onChange={HandleChange}
        className="p-1 rounded-md outline-none focus:ring focus:ring-primary-main transition-all"
      />
      <button
        type="submit"
        disabled={!IsValid}
        className="py-1 px-2 ml-2 rounded-md text-headline bg-primary-main hover:bg-primary-whiter
                     font-semibold tracking-wide transition-all outline-none focus:ring focus:ring-primary-darker"
      >
        Change
      </button>
      {Loading && <p className="text-description">Loading...</p>}
      {!Loading && Username.length > 3 && (
        <p
          className={`text-${
            IsValid ? "green-500" : "red-500"
          } text-lg font-semibold`}
        >
          {Username === DefaultUsername
            ? "This is your current username"
            : `${!IsValid ? "Unv" : "V"}alid username`}
        </p>
      )}
    </form>
  );
}

export default Settings;
