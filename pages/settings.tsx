import { NextPage } from "next";
import React from "react";
import AuthCheck from "../components/Common/AuthCheck";
import MetaTags from "../components/Common/Metatags";

/* Components */
const Settings: NextPage = () => {
  return (
    <AuthCheck PageMetaData={["", ""]}>
      <main>
        <MetaTags
          title="User's Settings"
          description="Private Page, Only For ACK Users"
        />
      </main>
    </AuthCheck>
  );
};

export default Settings;
