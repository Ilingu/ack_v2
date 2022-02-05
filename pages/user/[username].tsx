import { GetServerSideProps, NextPage } from "next";

interface UserProfilePageProps {}

/*
  Like Settings (Do a component)
  Don't include Settings
*/

/* SSR */
// export const getServerSideProps: GetServerSideProps = async () => {};

const UserProfilePage: NextPage<UserProfilePageProps> = ({}) => {
  return <div></div>;
};

export default UserProfilePage;
