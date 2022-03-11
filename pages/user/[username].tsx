import { GetServerSideProps, NextPage } from "next";
import { useMemo } from "react";
// UI
import MetaTags from "../../components/Common/Metatags";
import UserProfil from "../../components/User/UserProfil";
// Types
import {
  ResApiRoutes,
  ResDataUser,
  UserStatsShape,
} from "../../lib/utils/types/interface";
// Func
import { callApi } from "../../lib/utils/UtilsFunc";

interface UserProfilePageProps {
  UserData: ResDataUser;
  Username: string;
}

/* SSR */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const {
    query: { username },
    req: {
      headers: { host },
      cookies,
    },
  } = ctx;

  if (!cookies.UsT) return { notFound: true };

  const ProdMode = process.env.NODE_ENV === "production";

  const Username = username.toString().trim().toLocaleLowerCase();
  const UserData: ResApiRoutes = await callApi({
    url: `http${ProdMode ? "s" : ""}://${host}/api/user/${Username}`,
    internalCall: true,
    AccessToken: cookies.UsT,
  });

  if (!UserData.succeed || !UserData.data) return { notFound: true };
  return {
    props: { UserData: UserData.data, Username },
  };
};

const UserProfilePage: NextPage<UserProfilePageProps> = ({
  UserData,
  Username,
}) => {
  const UserStats: UserStatsShape[] = useMemo(
    (): UserStatsShape[] =>
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
    [UserData]
  );

  return (
    <main className="flex h-screen flex-col items-center">
      <MetaTags
        title={`${UserData.User?.displayName}'s profile`}
        description="ACK User Profile"
      />
      <div className="w-11/12 sm:w-5/6 md:w-11/12 lg:w-2/3 2xl:w-1/2">
        <UserProfil
          UserData={{ user: UserData.User, username: Username }}
          UserStats={UserStats}
        />
      </div>
    </main>
  );
};

export default UserProfilePage;
