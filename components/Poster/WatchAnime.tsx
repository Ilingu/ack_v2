import React, { FC, useEffect, useState } from "react";
import { JikanApiResEpisodes } from "../../lib/types/interface";
// Types

/* INTERFACES */
interface EpsPosterProps {
  EpisodesData: JikanApiResEpisodes[];
  Progress: number[] | null;
}
interface EpsPosterItemProps {
  EpisodeData: JikanApiResEpisodes;
}
type SortOrderType = "descending" | "ascending";

const EpsPoster: FC<EpsPosterProps> = ({ EpisodesData }) => {
  const [RenderedEps, setNewRender] = useState<JSX.Element[]>();
  const [SortOrder, setSortOrder] = useState<SortOrderType>("descending");
  console.log(EpisodesData);
  useEffect(
    () => LoadAnimes(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [EpisodesData]
  );

  const LoadAnimes = () => {
    const JSXElems = EpisodesData.map((epData, i) => (
      <EpsPosterItem key={i} EpisodeData={epData} />
    ));
    setNewRender(JSXElems);
  };

  return (
    <div className="w-full relative">
      <div className="flex justify-center">
        <div className="font-semibold text-headline bg-bgi-whitest rounded-md p-1">
          {SortOrder === "descending" ? "Descending" : "Ascending"}
        </div>
        <div className="font-semibold text-headline bg-bgi-whitest rounded-md p-1">
          {EpisodesData.length}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">{RenderedEps}</div>
    </div>
  );
};

function EpsPosterItem({ EpisodeData }: EpsPosterItemProps) {
  const { title, mal_id, filler, recap, url } = EpisodeData || {};

  return <div></div>;
}

export default EpsPoster;
