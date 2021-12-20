import { NextPage } from "next";
import React, { Fragment } from "react";
import AuthCheck from "../components/Common/AuthCheck";
import MetaTags from "../components/Common/Metatags";

/* Components */
const Settings: NextPage = () => {
  return (
    <Fragment>
      <MetaTags
        title="User's Settings"
        description="Private Page, Only For ACK Users"
      />
      <AuthCheck>
        <main></main>
      </AuthCheck>
    </Fragment>
  );
};

export default Settings;
