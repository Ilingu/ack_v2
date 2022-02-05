import React, { FC, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
// Types
import { User } from "firebase/auth";
import { UserStatsShape } from "../../lib/utils/types/interface";
// UI
import Divider from "../Design/Divider";
import { AiFillMail } from "react-icons/ai";
import { FaClock } from "react-icons/fa";
import { BiStats } from "react-icons/bi";

interface UserProfilProps {
  UserStats: UserStatsShape[];
  UserData: { user: User; username: string };
}

const UserProfil: FC<UserProfilProps> = ({
  UserData: { user, username },
  UserStats,
}) => {
  return (
    <Fragment>
      {/* Basic User Data */}
      <section className="flex sm:gap-5 gap-2 mt-10 mb-2 px-3">
        <div>
          <Image
            src={user?.photoURL}
            alt="User Avatar"
            height={180}
            width={180}
            className="rounded-3xl"
          />
        </div>
        <div>
          <div className="flex flex-col text-headline font-bold text-3xl">
            {user?.displayName}
            <Link href={`/user/${username}`} passHref>
              <a className="text-lg font-semibold text-primary-whitest hover:underline">
                @{username}
              </a>
            </Link>
          </div>
          <div className="mt-2 font-semibold text-headline">
            <FaClock className="icon" /> Member since{" "}
            <span className="text-primary-whitest">
              {new Date(user?.metadata.creationTime).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-2 font-semibold text-headline">
            <AiFillMail className="icon" /> Email -{" "}
            <span className="text-primary-whitest">{user?.email}</span>
          </div>
        </div>
      </section>
      <Divider />
      {/* User's Stats */}
      <section className="my-5 px-3 text-description-whiter">
        <header>
          <h1 className="text-2xl font-bold text-description-whiter capitalize">
            <BiStats className="icon" /> {username}&apos;s Stats
          </h1>
        </header>
        <div className="mt-5 grid md:grid-cols-2 gap-y-3 justify-items-center">
          {UserStats &&
            UserStats?.map(({ data, desc }, i) => (
              <div
                key={i}
                className="h-20 w-80 rounded-lg ring-2 ring-description bg-bgi-whiter flex flex-col
              justify-center items-center font-semibold text-lg"
              >
                <span className="text-primary-whitest">{data}</span>
                {desc}
              </div>
            ))}
        </div>
      </section>
    </Fragment>
  );
};

export default UserProfil;
