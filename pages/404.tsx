import Link from "next/link";
import Metatags from "../components/Common/Metatags";

export default function Custom404() {
  return (
    <main className="text-headline flex h-screen flex-col items-center justify-center">
      <Metatags title="404 Page Not Found!" description="404 Page" />
      <h1 className="mb-2 font-mono text-6xl font-bold text-red-500">404</h1>
      <h2 className="mb-4 text-3xl font-semibold">
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
          className="bg-primary text-headline hover:bg-secondary hover:text-bgMain focus:bg-secondary mt-2 w-32 rounded-lg py-2
        px-2 font-bold outline-none transition focus:ring-2 focus:ring-offset-2"
        >
          Go home
        </button>
      </Link>
    </main>
  );
}
