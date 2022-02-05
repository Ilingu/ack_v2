import Link from "next/link";
import Metatags from "../components/Common/Metatags";
// UI
import { BiErrorAlt } from "react-icons/bi";

export default function Custom404() {
  return (
    <main className="text-headline flex h-screen flex-col items-center justify-center">
      <Metatags title="Error Page" description="ACK Error Page" />
      <h1 className="mb-2 font-mono text-6xl font-bold text-red-500">
        <BiErrorAlt className="icon" /> ERROR
      </h1>
      <h2 className="mb-4 text-center text-3xl font-semibold">
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
          className="bg-primary text-headline hover:bg-secondary hover:text-bgMain focus:bg-secondary mt-2 w-32 rounded-lg py-2
        px-2 font-bold outline-none transition focus:ring-2 focus:ring-offset-2"
        >
          Go home
        </button>
      </Link>
    </main>
  );
}
