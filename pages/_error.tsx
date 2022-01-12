import Link from "next/link";
import Metatags from "../components/Common/Metatags";
// UI
import { BiErrorAlt } from "react-icons/bi";

export default function Custom404() {
  return (
    <main className="flex flex-col justify-center items-center text-headline h-screen">
      <Metatags title="Error Page" description="ACK Error Page" />
      <h1 className="text-6xl mb-2 font-mono text-red-500 font-bold">
        <BiErrorAlt className="icon" /> ERROR
      </h1>
      <h2 className="text-3xl mb-4 font-semibold text-center">
        ⚡ ACK have crashed ! <br /> 🛡For security purpose we redirect you into
        this page.
      </h2>
      <iframe
        src="https://giphy.com/embed/MVgLEacpr9KVK172Ne"
        width="480"
        height="270"
        frameBorder="0"
        className="rounded-md"
        allowFullScreen
      ></iframe>

      <Link href="/" passHref>
        <button
          className="py-2 px-2 bg-primary mt-2 w-32 rounded-lg text-headline font-bold hover:bg-secondary
        hover:text-bgMain transition outline-none focus:ring-2 focus:bg-secondary focus:ring-offset-2"
        >
          Go home
        </button>
      </Link>
    </main>
  );
}
