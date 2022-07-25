import React, { FC, Fragment, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
// Types
import type { User } from "firebase/auth";
import type { UserStatsShape } from "../../../lib/utils/types/interface";
// UI
import Divider from "../../Design/Divider";
import { AiFillMail } from "react-icons/ai";
import { FaCheck, FaClock } from "react-icons/fa";
import { BiStats } from "react-icons/bi";

interface UserProfilProps {
  UserStats: UserStatsShape[];
  UserData: { user: User; username: string };
  NewFavAnime?: (FavAnime: string) => Promise<void>;
}

interface UserFavoriteAnimeInputProps {
  NewFavAnime: (FavAnime: string) => Promise<void>;
  FavAnimeInput: string;
  setFavAnimeInput: React.Dispatch<React.SetStateAction<string>>;
  data: string | number;
}

const UserProfil: FC<UserProfilProps> = ({
  UserData: { user, username },
  UserStats,
  NewFavAnime,
}) => {
  const [FavAnimeInput, setFavAnimeInput] = useState(() =>
    UserStats[2].data.toString()
  );

  useEffect(() => {
    const UserNewAnimeFav = UserStats[2].data;
    if (UserNewAnimeFav !== "BSD!")
      setFavAnimeInput(UserNewAnimeFav.toString());
  }, [UserStats]);

  return (
    <Fragment>
      {/* Basic User Data */}
      <section className="mt-10 mb-2 flex gap-2 px-3 sm:gap-5">
        <div>
          <Image
            src={user?.photoURL || "https://ui-avatars.com/api/?name=I+L"}
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
              <a
                data-testid="UserUsername"
                className="text-primary-whitest text-lg font-semibold hover:underline"
              >
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
            UserStats?.map(({ data, desc, Modifiable }, i) => (
              <div
                key={i}
                className="ring-description bg-bgi-whiter flex h-20 w-80 flex-col items-center justify-center
              rounded-lg text-lg font-semibold ring-2"
              >
                {Modifiable ? (
                  <UserFavoriteAnimeInput
                    data={data}
                    FavAnimeInput={FavAnimeInput}
                    NewFavAnime={NewFavAnime}
                    setFavAnimeInput={setFavAnimeInput}
                  />
                ) : (
                  <span className="text-primary-whitest">{data}</span>
                )}
                {desc}
              </div>
            ))}
        </div>
      </section>
    </Fragment>
  );
};

function UserFavoriteAnimeInput({
  NewFavAnime,
  FavAnimeInput,
  setFavAnimeInput,
  data,
}: UserFavoriteAnimeInputProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        NewFavAnime && NewFavAnime(FavAnimeInput.trim());
      }}
    >
      <input
        type="text"
        value={FavAnimeInput}
        onChange={({ target: { value } }) => setFavAnimeInput(value)}
        className={`bg-bgi-whitest text-headline text-center font-semibold outline-none transition-all ${
          data !== FavAnimeInput ? "rounded-l-md" : "rounded-md"
        }`}
      />
      {data !== FavAnimeInput && (
        <button
          className="bg-primary-main text-headline rounded-r-md px-1"
          type="submit"
        >
          <FaCheck className="icon" />
        </button>
      )}
    </form>
  );
}

export const SkeletonUserProfil = () => (
  <>
    {/* Basic User Data */}
    <section className="mt-10 mb-2 flex gap-2 px-3 sm:gap-5">
      <div>
        <div className="bg-bgi-whiter h-[180px] w-[180px] rounded-3xl"></div>
      </div>
      <div>
        <div className="flex flex-col gap-y-2 rounded">
          <div className="bg-bgi-whiter h-10 w-28 rounded-md"></div>
          <div className="bg-bgi-whiter h-10 w-28 rounded-md"></div>
        </div>
        <div className="text-headline mt-2 font-semibold">
          <FaClock className="icon" /> Member since{" "}
          <span className="text-primary-whitest">xx/xx/xxxx</span>
        </div>
        <div className="text-headline mt-2 font-semibold">
          <AiFillMail className="icon" /> Email -{" "}
          <span className="text-primary-whitest">xx@xxx.xxx</span>
        </div>
      </div>
    </section>
    <Divider />
    {/* User's Stats */}
    <section className="text-description-whiter my-5 px-3">
      <header>
        <h1 className="text-description-whiter flex items-center text-2xl font-bold capitalize">
          <BiStats className="icon" />{" "}
          <div className="bg-bgi-whiter h-10 w-28 rounded-md"></div>
        </h1>
      </header>
      <div className="mt-5 grid justify-items-center gap-y-3 md:grid-cols-2">
        {Array(4)
          .fill(null)
          ?.map((_, i) => (
            <div
              key={i}
              className="ring-description bg-bgi-whiter flex h-20 w-80 flex-col items-center justify-center
              rounded-lg text-lg font-semibold ring-2"
            ></div>
          ))}
      </div>
    </section>
  </>
);

export default UserProfil;
