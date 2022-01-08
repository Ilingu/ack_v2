import React, { FC, useCallback, useEffect, useState } from "react";
// DB
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { removeDuplicates } from "../../lib/utilityfunc";
import toast from "react-hot-toast";
// Types
import { JikanApiResEpisodes, UserAnimeShape } from "../../lib/types/interface";
import { AnimeWatchType } from "../../lib/types/enums";
// UI
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

/* INTERFACES */
interface EpsPosterProps {
  EpisodesData: JikanApiResEpisodes[];
  UserAnimeData: UserAnimeShape;
  Duration: number;
}
interface EpsPosterItemProps {
  EpisodeData: JikanApiResEpisodes;
  watched: boolean;
  UpdateUserAnimeProgress: (epId: number, remove: boolean) => void;
}
type SortOrderType = "descending" | "ascending";

/* COMPONENTS */
const EpsPoster: FC<EpsPosterProps> = ({
  EpisodesData,
  UserAnimeData: { Progress, WatchType, AnimeId },
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
          !Progress ||
          (Progress && Progress[0] !== -2811 && !ProgressToObj[epData.mal_id])
        )
          watched = false;

        return (
          <EpsPosterItem
            key={i}
            EpisodeData={epData}
            watched={watched}
            UpdateUserAnimeProgress={UpdateUserAnimeProgress}
          />
        );
      });
      setNewRender(JSXElems);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [EpisodesData, Progress, WatchType, SortOrder]
  );

  /* FUNC */
  const UpdateUserAnimeProgress = useCallback(
    (epId: number, remove: boolean) => {
      try {
        let NewProgress = Progress
          ? Progress[0] === -2811
            ? []
            : [...Progress, epId]
          : [epId];

        if (remove && Progress && Progress[0] !== -2811) {
          const ProgressCopy = [...Progress];
          const indexToDel = ProgressCopy.indexOf(epId);
          if (indexToDel === -1) return;
          ProgressCopy.splice(indexToDel, 1);
          NewProgress = ProgressCopy;
        }

        const AnimeRef = doc(
          doc(db, "users", auth.currentUser.uid),
          "animes",
          AnimeId.toString()
        );
        updateDoc(AnimeRef, {
          Progress: removeDuplicates(NewProgress),
        });

        toast.success("Marked as watched !");
      } catch (err) {
        toast.error("Error, cannot execute this action.");
      }
    },
    [AnimeId, Progress]
  );

  const MarkAllEpWatched = () => {
    try {
      const AnimeRef = doc(
        doc(db, "users", auth.currentUser.uid),
        "animes",
        AnimeId.toString()
      );
      updateDoc(AnimeRef, {
        Progress: [-2811],
      });
      toast.success("All Marked as watched !");
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  return (
    <div className="w-full relative">
      <h1 className="text-center text-4xl text-headline font-bold mb-3">
        Episodes ({EpisodesData.length})
      </h1>
      <div className="flex flex-wrap gap-x-2 mb-3">
        {!isNaN(Duration) && (
          <div className="font-bold text-primary-main text-xl tracking-wide mr-auto">
            {((Duration * EpisodesData.length) / 60).toFixed()} Hr{" "}
            {parseInt((Duration * EpisodesData.length).toFixed(0).slice(2))} min{" "}
            <span className="text-description font-semibold text-lg">
              ({EpisodesData.length} eps x {Duration} min)
            </span>
          </div>
        )}

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

        <div
          onClick={MarkAllEpWatched}
          className="font-semibold text-headline bg-bgi-whitest rounded-md p-1 cursor-pointer"
        >
          Mark as &quot;Watched&quot;
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-5">{RenderedEps}</div>
    </div>
  );
};

function EpsPosterItem({
  EpisodeData,
  watched,
  UpdateUserAnimeProgress,
}: EpsPosterItemProps) {
  const { title, mal_id, filler, recap, aired } = EpisodeData || {};

  return (
    <div
      onClick={() => UpdateUserAnimeProgress(mal_id, watched)}
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
