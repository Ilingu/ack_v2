import Image from "next/image";
import Link from "next/link";
import MetaTags from "../components/Common/Metatags";

export default function offlinePage() {
  return (
    <main className="text-headline flex h-screen flex-col items-center justify-center">
      <MetaTags title="Offline Page" description="You're Offline" />
      <h1 className="mb-2 font-mono text-6xl font-bold text-red-500">ERROR</h1>
      <h2 className="mb-4 text-center text-3xl font-semibold">
        You&apos;re <span className="font-bold text-red-500">offline</span>,
        please connect to ✨
        <span className="hover:decoration-primary-whiter font-bold hover:underline">
          Internet
        </span>
        ✨
      </h2>
      <Image
        src="/Assets/9animeLogo.png"
        alt="No Internet Gif"
        width="480"
        height="270"
        className="rounded-md"
      />
      <Link href="/" passHref>
        <button className="bg-primary text-headline hover:text-primary-whiter mt-2 rounded-lg py-2 px-2 font-bold outline-none transition-all focus:ring-2">
          I&apos;m Online
        </button>
      </Link>
    </main>
  );
}
