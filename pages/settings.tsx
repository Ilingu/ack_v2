import React, { FC, Fragment } from "react";
import AuthCheck from "../components/AuthCheck";
import MetaTags from "../components/Metatags";

/* Components */
const Settings: FC = () => {
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
