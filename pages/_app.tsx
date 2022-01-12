import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useGlobalAnimeData, useUserData } from "../lib/hooks";
// TS
import { AppProps } from "next/app";
import { NetworkInformationShape } from "../lib/types/interface";
// UI
import "../styles/globals.css";
import Navbar from "../components/Common/Navbar";
import { GlobalAppContext } from "../lib/context";

export default function MyApp({ Component, pageProps }: AppProps) {
  const userData = useUserData();
  const {
    GlobalAnimeData: GlobalAnime,
    UserAnimesData: UserAnimes,
    UserGroupsData: UserGroups,
  } = useGlobalAnimeData(userData?.user?.uid);
  const [IsWebVersion, setAppVersion] = useState(false);

  useEffect(() => {
    /* AppVersion */
    setAppVersion(!window.matchMedia("(display-mode: standalone)").matches);
    /* Network Connection */
    const onChangeNetwork = (e: Event) => {
      CheckConn(e.currentTarget as unknown as NetworkInformationShape);
    };
    const CheckConn = (ConnInfo: NetworkInformationShape) => {
      if (
        ConnInfo?.effectiveType === "slow-2g" ||
        ConnInfo?.effectiveType === "2g"
      ) {
        toast.error(
          `Unstable internet connection (${ConnInfo?.effectiveType})`,
          {
            position: "bottom-right",
          }
        );
      }

      if (ConnInfo?.downlink === 0) {
        toast.error(`You are offline`, {
          position: "bottom-right",
        });
        if (window.location.pathname === "/_offline") return;
        history.pushState("", "", "/_offline");
        window.location.reload();
      }
    };
    const connectionInfo =
      navigator.connection as unknown as NetworkInformationShape;
    connectionInfo.onchange = onChangeNetwork;
    CheckConn(connectionInfo);
    /* ERROR DETECTION */
    window.onerror = async () => {
      if (process?.env?.NODE_ENV === "development") return;
      history.pushState("", "", "/_error");
      window.location.reload();
    };
  }, []);

  return (
    <GlobalAppContext.Provider
      value={{
        ...userData,
        IsWebVersion,
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
