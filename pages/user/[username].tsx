import { NextPage } from "next";
import { useMemo } from "react";
// UI
import MetaTags from "../../components/Common/Metatags";
import UserProfil, {
  SkeletonUserProfil,
} from "../../components/User/UserProfil";
// tRPC
import { useQuery } from "../../lib/client/trpc";
// Types
import type {
  ResDataUser,
  UserStatsShape,
} from "../../lib/utils/types/interface";
// Func
import Loader from "../../components/Design/Loader";
import { useRouter } from "next/router";

interface UserProfilePageProps {
  UserData: ResDataUser;
  Username: string;
}

const UserProfilePage: NextPage<UserProfilePageProps> = ({}) => {
  const {
    query: { username },
    push,
  } = useRouter();
  const {
    data: UserData,
    isError,
    isLoading,
  } = useQuery(["users.getUser", username?.toString()], {
    refetchOnWindowFocus: true,
  });

  const UserStats: UserStatsShape[] = useMemo(
    (): UserStatsShape[] =>
      !isError &&
      UserData && [
        { data: UserData?.NoOfAnimes, desc: "💥 Animes" },
        {
          data: UserData?.NoOfWatchAnimes,
          desc: "🎥 Watched Anime",
        },
        {
          data: UserData?.UserFavoriteAnime || "BSD!",
          desc: "❤ Favorite Anime",
        },
        {
          data: new Date(
            UserData.User?.metadata.lastSignInTime
          ).toLocaleDateString(),
          desc: `🔥 Last time ${UserData.User?.displayName} was Online`,
        },
      ],
    [UserData, isError]
  );

  if (isError) {
    push("/404");
    return <div>Error, Redirection...</div>;
  }

  return (
    <main className="flex h-screen flex-col items-center">
      <MetaTags
        title={`${username?.toString()}'s profile`}
        description="ACK User Profile"
      />
      <div className="w-11/12 sm:w-5/6 md:w-11/12 lg:w-2/3 2xl:w-1/2">
        {isLoading ? (
          <SkeletonUserProfil />
        ) : (
          <UserProfil
            UserData={{ user: UserData?.User, username: username.toString() }}
            UserStats={UserStats}
          />
        )}
      </div>
    </main>
  );
};

export default UserProfilePage;
