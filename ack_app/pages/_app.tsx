import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useGlobalAnimeData, useUserData } from "../lib/hooks";
// Server tRPC
import { withTRPC } from "@trpc/next";
import { AppRouter } from "./api/trpc/[trpc]";
// TS
import { AppProps } from "next/app";
// UI
import "../styles/globals.css";
import Navbar from "../components/Layouts/Navbar";
import { GlobalAppContext } from "../lib/context";
import { NetworkCheck, ThrowInAppError } from "../lib/client/ClientFuncs";

function MyApp({ Component, pageProps }: AppProps) {
  const userData = useUserData();
  const {
    GlobalAnimesDatas: GlobalAnime,
    UserAnimesData: UserAnimes,
    UserGroupsData: UserGroups,
  } = useGlobalAnimeData(userData?.user?.uid);

  useEffect(() => {
    /* AppVersion */
    window.appVersion = () =>
      window?.matchMedia("(display-mode: standalone)").matches ? "PWA" : "Web";

    /* Network Connection */
    NetworkCheck();
    /* ERROR DETECTION */
    window.onerror = ThrowInAppError;
  }, []);

  /* If one day I want to be able to use the preview site */
  // useEffect(() => {
  //   if (
  //     (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  //       process.env.NEXT_PUBLIC_VERCEL_ENV === "development") &&
  //     userData?.user &&
  //     userData?.user?.uid !== "<uid_developper_account>"
  //   )
  //     document.documentElement.innerHTML = "";
  // }, [userData?.user]);

  return (
    <GlobalAppContext.Provider
      value={{
        ...userData,
        UserAnimes,
        GlobalAnime,
        UserGroups,
      }}
    >
      <Navbar />
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </GlobalAppContext.Provider>
  );
}

export default withTRPC<AppRouter>({
  config() {
    const url =
      process.env.NODE_ENV === "production"
        ? `https://ack.vercel.app/api/trpc`
        : "http://localhost:3000/api/trpc";

    return {
      url,
      headers: {
        protected: encodeURIComponent(process.env.NEXT_PUBLIC_API_PASSWORD),
      },
      queryClientConfig: { defaultOptions: { queries: { staleTime: 60_000 } } },
    };
  },
})(MyApp);
