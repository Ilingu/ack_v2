import Image from "next/image";
import Link from "next/link";
import React, { FC } from "react";
// Auth
import { auth } from "../../lib/firebase";
import AuthCheck from "./AuthCheck";
// UI
import { FaLeaf, FaSearch, FaSignOutAlt } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";

const Navbar: FC = () => {
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
        <Link href="/settings" passHref>
          <a>
            <button className="btn-navbar group">
              <FiSettings className="-translate-y-0.5 text-secondary" />{" "}
              <span className="text-description-whiter group-hover:text-headline transition mt-1">
                Settings
              </span>
            </button>
          </a>
        </Link>
        <AuthCheck
          fallback={
            <Link href="/sign-up" passHref>
              <a>
                <button className="bg-primary-darker py-2 px-4 text-lg rounded-lg font-bold ml-2">
                  Get Started Now
                </button>
              </a>
            </Link>
          }
        >
          <button onClick={() => auth.signOut()} className="btn-navbar group">
            <FaSignOutAlt className="-translate-y-0.5 text-red-500" />{" "}
            <span className="text-description-whiter group-hover:text-headline transition mt-1">
              Sign out
            </span>
          </button>
        </AuthCheck>
      </div>
    </nav>
  );
};

export default Navbar;
