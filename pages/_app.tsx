import { Fragment } from "react";
import { Toaster } from "react-hot-toast";
import { useUserData } from "../lib/hooks";
// TS
import { AppProps } from "next/app";
// UI
import "../styles/globals.css";
import Navbar from "../components/Navbar";

export default function MyApp({ Component, pageProps }: AppProps) {
  const userData = useUserData();

  return (
    <Fragment>
      <Navbar />
      <Component {...pageProps} />
      <Toaster />
    </Fragment>
  );
}
