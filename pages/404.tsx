import Link from "next/link";
import Metatags from "../components/Metatags";

export default function Custom404() {
  return (
    <main>
      <Metatags title="404 Page Not Found!" description="404 Page" />
      <h1>404 - That page does not seem to exist...</h1>
      <iframe
        src="https://giphy.com/embed/l2JehQ2GitHGdVG9y"
        width="480"
        height="362"
        frameBorder="0"
        allowFullScreen
      ></iframe>
      <Link href="/" passHref>
        <button className="btn-blue">Go home</button>
      </Link>
    </main>
  );
}
