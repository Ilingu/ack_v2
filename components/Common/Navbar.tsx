import Image from "next/image";
import Link from "next/link";
import React, { FC, Fragment, useContext, useEffect, useState } from "react";
// Auth
import { auth } from "../../lib/firebase";
import AuthCheck from "./AuthCheck";
// UI
import { FaLeaf, FaSearch, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { GlobalAppContext } from "../../lib/context";

interface NavItemProps {
  afterHydrated?: JSX.Element;
}

const Navbar: FC = () => {
  const { user } = useContext(GlobalAppContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <NavItem />;
  const afterHydrated = (
    <AuthCheck
      fallback={
        <Link href="/sign-up" passHref>
          <a>
            <button className="bg-primary-darker py-2 px-4 text-lg rounded-lg font-bold ml-2">
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
      <Fragment>
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
                <FiSettings className="-translate-y-0.5 text-secondary" />
              )}
              <span className="text-description-whiter group-hover:text-headline transition mt-1">
                Settings
              </span>
            </button>
          </a>
        </Link>
        <button onClick={() => auth.signOut()} className="btn-navbar group">
          <FaSignOutAlt className="-translate-y-0.5 text-red-500" />
          {screen?.width > 768 && (
            <span className="text-description-whiter group-hover:text-headline transition mt-1">
              Sign out
            </span>
          )}
        </button>
      </Fragment>
    </AuthCheck>
  );
  return <NavItem afterHydrated={afterHydrated} />;
};

function NavItem({ afterHydrated }: NavItemProps) {
  return (
    <nav className="w-full h-20 bg-bgi-black relative flex rounded-bl-lg rounded-br-lg">
      <Link href="/" replace passHref>
        <a className="absolute flex items-center h-full ml-2 sm:scale-100 scale-90">
          <Image
            title="Go Home"
            src="/IconAck192.png"
            alt="logo"
            width={60}
            height={60}
            className="rounded-lg cursor-pointer"
          />
        </a>
      </Link>
      <div className="flex sm:justify-end md:justify-center md:mr-0 ml-11 items-center w-full h-full text-headline sm:scale-100 scale-75">
        <Link href="/anime" passHref>
          <a>
            <button className="btn-navbar group">
              <FaSearch className="-translate-y-0.5 text-secondary" />{" "}
              <span className="text-description-whiter group-hover:text-headline transition mt-1">
                Search
              </span>
            </button>
          </a>
        </Link>
        <Link href="/anime/season" passHref>
          <a>
            <button className="btn-navbar group">
              <FaLeaf className="-translate-y-0.5 text-secondary" />{" "}
              <span className="text-description-whiter group-hover:text-headline transition mt-1">
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
