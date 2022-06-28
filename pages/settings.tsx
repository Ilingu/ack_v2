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
import { auth, db } from "../lib/firebase/firebase";
// UI
import MetaTags from "../components/Common/Metatags";
import toast from "react-hot-toast";
import Divider from "../components/Design/Divider";
import { FiSettings } from "react-icons/fi";
import UserProfil from "../components/User/UserProfil";
// Types
import type {
  BeforeInstallPromptEvent,
  ResApiRoutes,
  UserStatsShape,
} from "../lib/utils/types/interface";
import { AnimeWatchType } from "../lib/utils/types/enums";
// Auth
import {
  FaBan,
  FaHome,
  FaSignOutAlt,
  FaSync,
  FaTrashAlt,
} from "react-icons/fa";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { callApi, DeviceCheckType } from "../lib/utils/UtilsFunc";
import { ClearIDB } from "../lib/utils/IDB";

/* Components */
const Settings: NextPage = () => {
  const { user, username, UserAnimes } = useContext(GlobalAppContext);
  const deferredPrompt = useRef<BeforeInstallPromptEvent>(null);
  const deleteAccountTimeout = useRef<NodeJS.Timeout>(null);
  const [UserFavAnime, setUserFavAnime] = useState("");

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
    GetUserFavoriteAnime();
  }, [user]);

  useEffect(() => {
    if (DAConfirmation >= 2 && !deleteAccountTimeout.current) {
      toast.success("Your account will be deleted in 10s");
      deleteAccountTimeout.current = setTimeout(() => {
        DeleteAccount();
      }, 10000);
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
        {
          data: UserFavAnime || "BSD!",
          desc: "❤ Favorite Anime",
          Modifiable: true,
        },
        {
          data: new Date(user?.metadata.lastSignInTime).toLocaleDateString(),
          desc: `🔥 Last time ${user?.displayName} was Online`,
        },
      ],
    [user, UserAnimes, UserFavAnime]
  );

  const GetUserFavoriteAnime = async () => {
    if (!user) return;
    const UserRef = doc(db, "users", user?.uid);
    const UserFavAnimeData = (await getDoc(UserRef)).data()
      ?.FavoriteAnime as unknown as string;

    setUserFavAnime(UserFavAnimeData);
  };

  const AddNewFavoriteAnime = useCallback(
    async (FavAnime: string) => {
      if (FavAnime.length < 2 || FavAnime.length > 200) return;
      try {
        const UserRef = doc(db, "users", user?.uid);
        await updateDoc(UserRef, {
          FavoriteAnime: FavAnime,
        });
        toast.success("Favorite Anime Updated!");

        await GetUserFavoriteAnime();
      } catch (err) {
        console.error(err);
        toast.error("Cannot Update Your Favorite Anime");
      }
    },
    [user]
  );

  const DeleteAccount = async () => {
    deleteAccountTimeout.current = null;
    if (DAConfirmation < 2) return;

    try {
      const ProdMode = process.env.NODE_ENV === "production";
      const { success, data: res } = await callApi<ResApiRoutes>({
        url: `http${ProdMode ? "s" : ""}://${
          window.location.host
        }/api/user/delete`,
        internalCall: true,
        reqParams: {
          method: "DELETE",
          body: JSON.stringify({ username }),
        },
      });

      if (success && res.succeed) {
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
      <main className="flex flex-col items-center">
        <MetaTags title="User's Settings" description="Settings of ACK User" />
        <div className="w-11/12 sm:w-5/6 md:w-11/12 lg:w-2/3 2xl:w-1/2">
          {/* User's Profile */}
          <UserProfil
            UserData={{ user, username }}
            UserStats={UserStats}
            NewFavAnime={AddNewFavoriteAnime}
          />
          {/* User's Settings */}
          <Divider />
          <section className="my-5 px-3">
            <header>
              <h1 className="text-description-whiter text-2xl font-bold">
                <FiSettings className="icon" /> Settings{" "}
                <span className="text-description text-lg font-semibold">
                  [ACK::RC]
                </span>
              </h1>
            </header>
            <div className="mt-5 flex flex-col items-center">
              {/* Basics User Button */}
              <section>
                <button
                  onClick={() => auth.signOut()}
                  className="xs:px-3 xs:text-lg rounded-md bg-yellow-400 py-1 px-1 font-semibold text-black"
                >
                  <FaSignOutAlt className="icon" /> Sign Out
                </button>
                <button
                  onClick={async () => {
                    await ClearIDB();
                    window.location.reload();
                  }}
                  className="text-headline bg-secondary xs:px-3 xs:ml-4 xs:text-lg ml-2 rounded-md py-1 px-1 font-semibold"
                >
                  <FaSync className="icon" /> Refresh Datas
                </button>
                {window.appVersion() === "Web" && (
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
                    className="bg-primary-main text-headline xs:px-3 xs:ml-4 xs:text-lg ml-2 rounded-md py-1 px-1 font-semibold"
                  >
                    <FaHome className="icon" /> A2HS
                  </button>
                )}
              </section>
              <section className="ring-description mt-5 w-full rounded-md p-2 text-center ring-2">
                <h1
                  className="text-description-whiter mb-1 text-xl font-bold"
                  title="Nothing is stored"
                >
                  Session Data:
                </h1>
                <ul className="text-headline xs:grid-cols-2 grid text-lg">
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
                      {DeviceCheckType() === "Mobile" ? "True" : "False"}]
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
                    <span className="text-primary-whitest capitalize">
                      {user?.providerId}
                    </span>
                  </li>
                  <li>
                    ACK Version:{" "}
                    <span className="text-primary-whitest">RC</span>
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
              <section className="ring-description mt-5 w-full rounded-md p-2 text-center ring-2">
                <h1 className="text-description-whiter mb-1 text-xl font-bold">
                  Username:
                </h1>
                <RenameUsername DefaultUsername={username} />
              </section>
              <section className="ring-description mt-5 w-full rounded-md p-2 text-center ring-2">
                <h1 className="text-description-whiter mb-1 text-xl font-bold">
                  Delete Account:
                </h1>
                <p className="text-center font-semibold text-red-200">
                  ⚡ Warning: By deleting your account you accept to delete ALL
                  your datas from this service (animes, username, account...)
                </p>
                <button
                  onClick={() =>
                    setDeleteAccount((prev) => (prev + 1 > 2 ? 0 : prev + 1))
                  }
                  className={`${
                    DAConfirmation > 1 ? "bg-green-500" : "bg-red-400"
                  } text-headline mt-3 rounded-lg py-1 px-5 text-lg font-semibold hover:${
                    DAConfirmation <= 1 && "bg-red-500"
                  } 
                  focus:ring-headline outline-none transition-all focus:ring`}
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
              <section className="ring-description mt-5 w-full rounded-md p-2 text-center ring-2">
                <h1 className="text-description-whiter mb-1 text-xl font-bold">
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
      const ProdMode = process.env.NODE_ENV === "production";
      const { success, data: res } = await callApi<ResApiRoutes>({
        url: `http${ProdMode ? "s" : ""}://${
          window.location.host
        }/api/user/rename`,
        internalCall: true,
        reqParams: {
          method: "PUT",
          body: JSON.stringify({
            "old-username": DefaultUsername,
            "new-username": Username,
          }),
        },
      });

      if (success && res.succeed) {
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
    const NewUsername = e.target.value.trim().toLowerCase();
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
      <span className="text-headline text-lg font-bold">@</span>
      <input
        type="text"
        value={Username}
        onChange={HandleChange}
        className="focus:ring-primary-main rounded-md p-1 outline-none transition-all focus:ring"
      />
      <button
        type="submit"
        disabled={!IsValid}
        className="text-headline bg-primary-main hover:bg-primary-whiter focus:ring-primary-darker ml-2 rounded-md py-1
                     px-2 font-semibold tracking-wide outline-none transition-all focus:ring"
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
