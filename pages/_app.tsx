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
  const { GlobalAnimeData: GlobalAnime } = useGlobalAnimeData();
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
        ConnInfo &&
        (ConnInfo.effectiveType === "slow-2g" ||
          ConnInfo.effectiveType === "2g")
      ) {
        toast.error(
          `Connexion internet faible/instable (${ConnInfo.effectiveType})`,
          {
            position: "bottom-right",
          }
        );
      }
    };
    const connectionInfo =
      navigator.connection as unknown as NetworkInformationShape;
    connectionInfo.onchange = onChangeNetwork;
    CheckConn(connectionInfo);
  }, []);

  return (
    <GlobalAppContext.Provider
      value={{
        ...userData,
        IsWebVersion,
        UserAnime: [],
        GlobalAnime,
      }}
    >
      <Navbar />
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </GlobalAppContext.Provider>
  );
}
