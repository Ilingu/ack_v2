import { Toaster } from "react-hot-toast";
import { useUserData } from "../lib/hooks";
// TS
import { AppProps } from "next/app";
// UI
import "../styles/globals.css";
import Navbar from "../components/Navbar";
import { UserContext } from "../lib/context";

export default function MyApp({ Component, pageProps }: AppProps) {
  const userData = useUserData();

  return (
    <UserContext.Provider value={userData}>
      <Navbar />
      <Component {...pageProps} />
      <Toaster />
    </UserContext.Provider>
  );
}
