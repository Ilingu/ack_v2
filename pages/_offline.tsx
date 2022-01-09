import Image from "next/image";
import Link from "next/link";
import MetaTags from "../components/Common/Metatags";

export default function offlinePage() {
  return (
    <main className="flex flex-col justify-center items-center text-headline h-screen">
      <MetaTags title="Offline Page" description="You're Offline" />
      <h1 className="text-6xl mb-2 font-mono text-red-500 font-bold">ERROR</h1>
      <h2 className="text-3xl mb-4 font-semibold text-center">
        You&apos;re <span className="text-red-500 font-bold">offline</span>,
        please connect to ✨
        <span className="hover:underline hover:decoration-primary-whiter font-bold">
          Internet
        </span>
        ✨
      </h2>
      <Image
        src="/NoInternet.gif"
        alt="No Internet GIF"
        width="480"
        height="270"
        className="rounded-md"
      />
      <Link href="/" passHref>
        <button className="py-2 px-2 bg-primary mt-2 rounded-lg text-headline font-bold hover:text-primary-whiter transition-all outline-none focus:ring-2">
          I&apos;m Online
        </button>
      </Link>
    </main>
  );
}
