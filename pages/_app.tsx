import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useGlobalAnimeData, useUserData } from "../lib/hooks";
// TS
import { AppProps } from "next/app";
// UI
import "../styles/globals.css";
import Navbar from "../components/Common/Navbar";
import { GlobalAppContext } from "../lib/context";
import { NetworkCheck, ThrowInAppError } from "../lib/utils/UtilsFunc";

export default function MyApp({ Component, pageProps }: AppProps) {
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
