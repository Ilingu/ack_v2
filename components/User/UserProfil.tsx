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
      <section className="mt-10 mb-2 flex gap-2 px-3 sm:gap-5">
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
          <div className="text-headline flex flex-col text-3xl font-bold">
            {user?.displayName}
            <Link href={`/user/${username}`} passHref>
              <a className="text-primary-whitest text-lg font-semibold hover:underline">
                @{username}
              </a>
            </Link>
          </div>
          <div className="text-headline mt-2 font-semibold">
            <FaClock className="icon" /> Member since{" "}
            <span className="text-primary-whitest">
              {new Date(user?.metadata.creationTime).toLocaleDateString()}
            </span>
          </div>
          <div className="text-headline mt-2 font-semibold">
            <AiFillMail className="icon" /> Email -{" "}
            <span className="text-primary-whitest">{user?.email}</span>
          </div>
        </div>
      </section>
      <Divider />
      {/* User's Stats */}
      <section className="text-description-whiter my-5 px-3">
        <header>
          <h1 className="text-description-whiter text-2xl font-bold capitalize">
            <BiStats className="icon" /> {username}&apos;s Stats
          </h1>
        </header>
        <div className="mt-5 grid justify-items-center gap-y-3 md:grid-cols-2">
          {UserStats &&
            UserStats?.map(({ data, desc }, i) => (
              <div
                key={i}
                className="ring-description bg-bgi-whiter flex h-20 w-80 flex-col items-center justify-center
              rounded-lg text-lg font-semibold ring-2"
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
