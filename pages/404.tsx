import Link from "next/link";
import Metatags from "../components/Common/Metatags";

export default function Custom404() {
  return (
    <main className="flex flex-col justify-center items-center text-headline h-screen">
      <Metatags title="404 Page Not Found!" description="404 Page" />
      <h1 className="text-6xl mb-2 font-mono text-red-500 font-bold">404</h1>
      <h2 className="text-3xl mb-2 font-semibold">
        That page does not seem to exist...
      </h2>
      <iframe
        src="https://giphy.com/embed/l2JehQ2GitHGdVG9y"
        width="480"
        height="362"
        frameBorder="0"
        className="rounded-md"
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
