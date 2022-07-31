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
import AuthCheck from "../components/Services/AuthCheck";
import { GlobalAppContext } from "../lib/context";
import { auth, db } from "../lib/firebase/firebase";
import { useMutation } from "../lib/client/trpc";
// UI
import MetaTags from "../components/Services/Metatags";
import toast from "react-hot-toast";
import Divider from "../components/Design/Divider";
import { FiSettings } from "react-icons/fi";
import UserProfil from "../components/pages/User/UserProfil";
// Types
import type {
  BeforeInstallPromptEvent,
  UserStatsShape,
} from "../lib/utils/types/interface";
import { AnimeWatchType } from "../lib/utils/types/enums";
// Icon
import {
  FaBan,
  FaHome,
  FaSignOutAlt,
  FaSync,
  FaTrashAlt,
} from "react-icons/fa";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ClearIDB } from "../lib/utils/IDB";
// Funcs
import { DeviceCheckType } from "../lib/client/ClientFuncs";

/* Components */
const Settings: NextPage = () => {
  const { user, username, UserAnimes } = useContext(GlobalAppContext);
  const deferredPrompt = useRef<BeforeInstallPromptEvent>(null);
  const deleteAccountTimeout = useRef<NodeJS.Timeout>(null);
  const [UserFavAnime, setUserFavAnime] = useState("");

  const [DAConfirmation, setDeleteAccount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Mutation
  const DeleteUserMut = useMutation("users.deleteUser");

  // Effetc
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
      const success = await DeleteUserMut.mutateAsync(username);

      if (success) {
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
      <main
        className="flex flex-col items-center"
        data-testid="Settings-Page-Main"
      >
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
              <h1 className="text-2xl font-bold text-description-whiter">
                <FiSettings className="icon" /> Settings{" "}
                <span className="text-lg font-semibold text-description">
                  [ACK::RC]
                </span>
              </h1>
            </header>
            <div className="mt-5 flex flex-col items-center">
              {/* Basics User Button */}
              <section>
                <button
                  onClick={() => auth.signOut()}
                  className="slideBtnAnimation rounded-md bg-secondary py-1 px-1 font-semibold text-headline hover:shadow-secondary-shadow xs:px-3 xs:text-lg"
                >
                  <FaSignOutAlt className="icon" /> Sign Out
                </button>
                <button
                  onClick={async () => {
                    await ClearIDB();
                    window.location.reload();
                  }}
                  className="slideBtnAnimation ml-2 rounded-md bg-secondary py-1 px-1 font-semibold text-headline hover:shadow-secondary-shadow xs:ml-4 xs:px-3 xs:text-lg"
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
                    className="slideBtnAnimation ml-2 rounded-md bg-primary-main py-1 px-1 font-semibold text-headline hover:shadow-primary-whitest xs:ml-4 xs:px-3 xs:text-lg"
                  >
                    <FaHome className="icon" /> A2HS
                  </button>
                )}
              </section>
              <section className="mt-5 w-full rounded-md p-2 text-center ring-2 ring-description">
                <h1
                  className="mb-1 text-xl font-bold text-description-whiter"
                  title="Nothing is stored"
                >
                  Session Data:
                </h1>
                <ul className="grid text-lg text-headline xs:grid-cols-2">
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
                    <span className="capitalize text-primary-whitest">
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
              <section className="mt-5 w-full rounded-md p-2 text-center ring-2 ring-description">
                <h1 className="mb-1 text-xl font-bold text-description-whiter">
                  Username:
                </h1>
                <RenameUsername DefaultUsername={username} />
              </section>
              <section className="mt-5 w-full rounded-md p-2 text-center ring-2 ring-description">
                <h1 className="mb-1 text-xl font-bold text-description-whiter">
                  Delete Account:
                </h1>
                <p className="text-center font-semibold text-red-200">
                  ⚡ Warning: By deleting your account you accept to delete ALL
                  your datas from this service (animes, username, account...)
                </p>
                <button
                  data-testid="DeleteUserBtn"
                  onClick={() =>
                    setDeleteAccount((prev) => (prev + 1 > 2 ? 0 : prev + 1))
                  }
                  className={`${
                    DAConfirmation > 1 ? "bg-green-500" : "bg-red-400"
                  } mt-3 rounded-lg py-1 px-5 text-lg font-semibold text-headline hover:${
                    DAConfirmation <= 1 && "bg-red-500"
                  } 
                  outline-none transition-all focus:ring focus:ring-headline`}
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
              <section className="mt-5 w-full rounded-md p-2 text-center ring-2 ring-description">
                <h1 className="mb-1 text-xl font-bold text-description-whiter">
                  Contact Dev:
                </h1>
                <ul className="grid grid-cols-2 text-headline">
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

  // Mutation
  const RenameUserMut = useMutation("users.renameUser");

  // Effect
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
      const success = await RenameUserMut.mutateAsync({
        OldUsername: DefaultUsername,
        NewUsername: Username,
      } as unknown as void);

      if (success) {
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
      <span className="text-lg font-bold text-headline">@</span>
      <input
        type="text"
        data-testid="RenameUsernameInput"
        value={Username}
        onChange={HandleChange}
        className="rounded-md p-1 outline-none transition-all focus:ring focus:ring-primary-main"
      />
      <button
        type="submit"
        data-testid="RenameUsernameBtnSubmition"
        disabled={!IsValid}
        className="ml-2 cursor-pointer rounded-md bg-primary-main py-1 px-2 font-semibold tracking-wide text-headline outline-none transition-all hover:bg-primary-whiter focus:ring focus:ring-primary-darker"
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
