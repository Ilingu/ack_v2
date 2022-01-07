import React, { FC, useEffect, useState } from "react";
// Types
import { JikanApiResEpisodes, UserAnimeShape } from "../../lib/types/interface";
// UI
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { AnimeWatchType } from "../../lib/types/enums";

/* INTERFACES */
interface EpsPosterProps {
  EpisodesData: JikanApiResEpisodes[];
  UserAnimeData: UserAnimeShape;
  Duration: number;
}
interface EpsPosterItemProps {
  EpisodeData: JikanApiResEpisodes;
  watched: boolean;
}
type SortOrderType = "descending" | "ascending";

/* COMPONENTS */
const EpsPoster: FC<EpsPosterProps> = ({
  EpisodesData,
  UserAnimeData: { Progress, WatchType },
  Duration,
}) => {
  const [RenderedEps, setNewRender] = useState<JSX.Element[]>();
  const [SortOrder, setSortOrder] = useState<SortOrderType>("descending");

  useEffect(
    () => {
      const ProgressToObj =
        (Progress &&
          Progress.reduce((a, GrName) => ({ ...a, [GrName]: GrName }), {})) ||
        null;
      const OrderedEpsData =
        SortOrder === "ascending" ? [...EpisodesData].reverse() : EpisodesData;

      const JSXElems = OrderedEpsData.map((epData, i) => {
        let watched = true;
        if (
          WatchType !== AnimeWatchType.WATCHED &&
          (!Progress || (Progress && !ProgressToObj[epData.mal_id]))
        )
          watched = false;

        return <EpsPosterItem key={i} EpisodeData={epData} watched={watched} />;
      });
      setNewRender(JSXElems);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [EpisodesData, Progress, WatchType, SortOrder]
  );

  return (
    <div className="w-full relative">
      <h1 className="text-center text-4xl text-headline font-bold mb-4">
        Episodes ({EpisodesData.length})
      </h1>
      <div className="flex mb-4">
        <div
          onClick={() =>
            setSortOrder(
              SortOrder === "descending" ? "ascending" : "descending"
            )
          }
          className="font-semibold text-headline bg-bgi-whitest rounded-md p-1 cursor-pointer"
        >
          {SortOrder === "descending" ? "Descending" : "Ascending"}
        </div>
        <div className="font-bold text-headline text-xl tracking-wide">
          Ep 1-{EpisodesData.length}
        </div>
        {!isNaN(Duration) && (
          <div className="font-bold text-headline text-xl tracking-wide">
            {((Duration * EpisodesData.length) / 60).toFixed()}H{" "}
            {parseInt((Duration * EpisodesData.length).toFixed(0).slice(2))}
            Min
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 mb-5">{RenderedEps}</div>
    </div>
  );
};

function EpsPosterItem({ EpisodeData, watched }: EpsPosterItemProps) {
  const { title, mal_id, filler, recap, aired } = EpisodeData || {};

  return (
    <div
      className={`grid grid-cols-24 w-full bg-bgi-whitest py-0.5 px-4 items-center rounded-md relative${
        watched || filler || recap ? "" : " border-l-4 border-primary-main"
      }${
        filler
          ? " border-l-4 border-red-500"
          : recap
          ? " border-l-4 border-gray-400"
          : watched
          ? " border-l-4 border-bgi-whitest"
          : ""
      }${watched ? " scale-95" : ""}`}
    >
      <div className="cursor-pointer">
        {watched ? (
          <AiOutlineEyeInvisible className="text-description mr-4 text-xl -translate-x-3" />
        ) : (
          <AiOutlineEye className="text-headline mr-4 text-xl -translate-x-3" />
        )}
      </div>

      <p className="font-semibold text-headline lg:col-span-2 xs:col-span-3 col-span-4">
        Ep. <span className="text-primary-whiter">{mal_id}</span>
      </p>
      <p className="font-semibold text-headline lg:col-span-15 xs:col-span-16 col-span-13">
        {title}
      </p>
      <div className="uppercase tracking-wider lg:col-span-3 xs:col-span-4 col-span-6 text-headline font-semibold text-center flex justify-end">
        <div
          className={`w-24 rounded-lg ${
            !filler && !recap
              ? "bg-green-500"
              : `bg-${filler ? "red" : recap ? "gray" : "green"}-${
                  filler ? "500" : recap ? "400" : "500"
                }`
          }`}
        >
          {filler && "Filler"}
          {recap && "Recap"}
          {!filler && !recap && "Canon"}
        </div>
      </div>
      <p className="lg:grid col-span-3 justify-items-end hidden font-semibold text-headline">
        {aired && new Date(aired).toLocaleDateString()}
      </p>
    </div>
  );
}

export default EpsPoster;
