import React, { FC, Fragment, useContext, useEffect, useState } from "react";
import { GlobalAppContext } from "../../lib/context";

const HomePoster: FC = () => {
  const { UserAnimes, UserGroups, GlobalAnime } = useContext(GlobalAppContext);
  const [RenderElements, setNewRender] = useState<JSX.Element[]>();

  useEffect(() => {
    if (!GlobalAnime || !UserAnimes || !UserGroups) return;

    let AllAnimesId: string[] = [];
    let AnimesGroupId: string[] = [];

    UserGroups.forEach((UserGroup) => {
      AnimesGroupId = [...AnimesGroupId, ...UserGroup.GroupAnimesId];
    });
    UserAnimes.forEach(({ AnimeId }) => {
      if (AnimesGroupId.includes(AnimeId.toString())) return;
      AllAnimesId = [...AllAnimesId, AnimeId.toString()];
    });

    // Render Anime -> From AllAnimesId
    // Render Groups -> From UserGroups
    // Concatenate the two Render
  }, [GlobalAnime, UserAnimes, UserGroups]);

  return <Fragment>{RenderElements}</Fragment>;
};

function HomeItemPoster({}) {
  return <div></div>;
}

export default HomePoster;
