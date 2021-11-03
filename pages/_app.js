import { Fragment } from "react";
import { Toaster } from "react-hot-toast";
import { useUserData } from "../lib/hooks";
// UI
import "../styles/globals.css";
import Navbar from "../components/Navbar";

function MyApp({ Component, pageProps }) {
  const userData = useUserData();

  return (
    <Fragment>
      <Navbar />
      <Component {...pageProps} />
      <Toaster />
    </Fragment>
  );
}

export default MyApp;
