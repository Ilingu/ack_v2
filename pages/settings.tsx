import React, { FC } from "react";
import AuthCheck from "../components/AuthCheck";

/* Components */
const Settings: FC = () => {
  return (
    <AuthCheck>
      <main></main>
    </AuthCheck>
  );
};

export default Settings;
