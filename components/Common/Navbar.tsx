import Image from "next/image";
import Link from "next/link";
import React, { FC, useContext, useEffect, useState } from "react";
import { install } from "@github/hotkey";
// Auth
import AuthCheck from "./AuthCheck";
// UI
import { FaLeaf, FaSearch, FaSignInAlt } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { GlobalAppContext } from "../../lib/context";

interface NavItemProps {
  afterHydrated?: JSX.Element;
}

const Navbar: FC = () => {
  const { user } = useContext(GlobalAppContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!window.mobileAndTabletCheck())
      for (const el of Array.from(document.querySelectorAll("[data-hotkey]"))) {
        install(el as HTMLElement);
      }
    setMounted(true);
  }, []);

  if (!mounted) return <NavItem />;
  const afterHydrated = (
    <AuthCheck
      fallback={
        <Link href="/sign-up" passHref>
          <a>
            <button className="bg-primary-darker ml-2 rounded-lg py-2 px-4 text-lg font-bold">
              {screen?.width > 768 ? (
                "Get Started Now"
              ) : (
                <FaSignInAlt className="icon" />
              )}
            </button>
          </a>
        </Link>
      }
    >
      <Link href="/settings" passHref>
        <a>
          <button className="btn-navbar group">
            {user?.photoURL ? (
              <Image
                src={user?.photoURL}
                alt="User Profile"
                width={20}
                height={20}
                className="rounded"
              />
            ) : (
              <FiSettings className="text-secondary -translate-y-0.5" />
            )}
            <span className="text-description-whiter group-hover:text-headline mt-1 transition">
              Settings
            </span>
          </button>
        </a>
      </Link>
    </AuthCheck>
  );
  return <NavItem afterHydrated={afterHydrated} />;
};

function NavItem({ afterHydrated }: NavItemProps) {
  return (
    <nav className="bg-bgi-black relative flex h-20 w-full rounded-bl-lg rounded-br-lg">
      <Link href="/" replace passHref>
        <a
          className="absolute ml-2 flex h-full scale-90 items-center sm:scale-100"
          data-hotkey="Alt+h"
        >
          <Image
            title="Go Home"
            src="/IconAck192.png"
            alt="logo"
            width={60}
            height={60}
            className="cursor-pointer rounded-lg"
          />
        </a>
      </Link>
      <div className="text-headline ml-11 flex h-full w-full scale-75 items-center sm:scale-100 sm:justify-end md:mr-0 md:justify-center">
        <Link href="/anime" passHref>
          <a data-hotkey="Alt+k">
            <button className="btn-navbar group">
              <FaSearch className="text-secondary -translate-y-0.5" />{" "}
              <span className="text-description-whiter group-hover:text-headline mt-1 transition">
                Search
              </span>
            </button>
          </a>
        </Link>
        <Link href="/anime/season" passHref>
          <a data-hotkey="Alt+s">
            <button className="btn-navbar group">
              <FaLeaf className="text-secondary -translate-y-0.5" />{" "}
              <span className="text-description-whiter group-hover:text-headline mt-1 transition">
                Seasons
              </span>
            </button>
          </a>
        </Link>
        {afterHydrated || undefined}
      </div>
    </nav>
  );
}

export default Navbar;
