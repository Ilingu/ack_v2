import React, { FC, useEffect, useMemo, useRef, useState } from "react";
// DB
import { deleteField, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { removeDuplicates } from "../../lib/utilityfunc";
// Types
import {
  JikanApiResEpisodes,
  UserAnimeShape,
  UserAnimeTimestampDate,
} from "../../lib/types/interface";
import { AnimeWatchType } from "../../lib/types/enums";
// UI
import { AiOutlineCloseSquare, AiOutlineRightCircle } from "react-icons/ai";
import toast from "react-hot-toast";

/* INERFACES */
interface FocusModeProps {
  EpisodesData: JikanApiResEpisodes[];
  UserAnimeData: UserAnimeShape;
  CancelModeFocus: () => void;
}
interface FocusEpisodeShape {
  EpId: number;
  EpTitle?: string;
  Filler?: boolean;
  Recap?: boolean;
}

const FocusMode: FC<FocusModeProps> = ({
  EpisodesData,
  UserAnimeData: { Progress, ExtraEpisodes, AnimeId, TimestampDate, WatchType },
  CancelModeFocus,
}) => {
  const [FocusEpisodeData, setFocusEpisodeShape] =
    useState<FocusEpisodeShape>(null);

  const { EpId, EpTitle, Filler, Recap } = FocusEpisodeData || {};

  const { current: EpisodesLength } = useRef(
    EpisodesData.length + (ExtraEpisodes || 0)
  );

  /* FUNC */
  const GenerateEp = useMemo(
    (): { id: number }[] =>
      Array.apply(null, Array(EpisodesLength)).map((_: null, i) => ({
        id: i + 1,
      })),
    [EpisodesLength]
  );

  useEffect(() => {
    // FocusData
    const ProgressToObj =
      (Progress &&
        Progress.reduce((a, Ep_ID) => ({ ...a, [Ep_ID]: Ep_ID }), {})) ||
      null;

    let NextEpId: number = null,
      NextEpTitle: string = null,
      NextEpFiller: boolean = null,
      NextEpRecap: boolean = null;

    GenerateEp.forEach(({ id }) => {
      if (!Progress) return;
      if (!ProgressToObj[id] && !NextEpId && !NextEpTitle) {
        const { title, filler, recap } = EpisodesData.find(
          ({ mal_id }) => mal_id === id
        );
        NextEpId = id;
        NextEpTitle = title;
        NextEpFiller = filler;
        NextEpRecap = recap;
      }
    });
    setFocusEpisodeShape({
      EpId: NextEpId || 1,
      EpTitle: NextEpTitle || EpisodesData[0].title,
      Filler: NextEpFiller,
      Recap: NextEpRecap,
    });

    // UX
    scrollTo(0, 0);
    document.body.style.overflow = "hidden";

    // UnMounted
    return () => {
      document.body.style.overflow = null;
    };
  }, [EpisodesData, GenerateEp, Progress]);

  const UpdateUserAnimeProgress = () => {
    const NewProgress = Progress ? [...Progress, EpId] : [EpId];

    try {
      const AnimeRef = () =>
        doc(
          doc(db, "users", auth.currentUser.uid),
          "animes",
          AnimeId.toString()
        );

      const IsFinished = NewProgress.length === EpisodesLength;

      const NewTimestampDate: UserAnimeTimestampDate = {
        BeganDate: !!TimestampDate?.BeganDate
          ? TimestampDate.BeganDate
          : new Date().toLocaleDateString(),
        EndedDate: !!TimestampDate?.EndedDate
          ? TimestampDate?.EndedDate
          : IsFinished && new Date().toLocaleDateString(),
      };

      updateDoc(AnimeRef(), {
        WatchType: IsFinished ? AnimeWatchType.WATCHED : WatchType,
        Progress: removeDuplicates(NewProgress),
        TimestampDate: NewTimestampDate || deleteField(),
        NewEpisodeAvailable: deleteField(),
      });
      toast.success(`Marked as watched !`);
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  /* JSX */
  return (
    <div className="absolute top-0 left-0 h-screen w-screen z-20 bg-bgi-darker bg-opacity-60 flex flex-col justify-center items-center">
      <h1
        className="relative font-bold text-2xl sm:w-72 sm:min-w-max w-10/12 p-4 bg-bgi-black bg-opacity-80 hover:bg-opacity-90 transition-all rounded-lg
       text-headline mb-5 scale-110 text-center"
      >
        <span className="text-description-whiter italic font-semibold">
          Episode
        </span>{" "}
        <span>#{EpId}</span>
        <br />
        <span className="text-xl font-semibold underline decoration-primary-whiter">
          {EpTitle}
        </span>
        {(Filler || Recap) && (
          <div
            className={`absolute -top-2 -left-6 -rotate-45 text-lg uppercase tracking-wide px-1 bg-${
              Filler ? "red" : "gray"
            }-500 rounded-lg`}
          >
            {Filler ? "Filler" : "Recap"}
          </div>
        )}
      </h1>
      <div className="flex gap-3">
        <button
          onClick={CancelModeFocus}
          className="text-headline text-5xl p-4 rounded-full bg-bgi-black hover:text-red-400 hover:ring-2 
        hover:ring-red-500 transition-all"
        >
          <AiOutlineCloseSquare />
        </button>
        <button
          onClick={UpdateUserAnimeProgress}
          className="text-headline text-5xl p-4 rounded-full bg-bgi-black hover:text-primary-whiter hover:ring-2 
        hover:ring-primary-main transition-all"
        >
          <AiOutlineRightCircle />
        </button>
      </div>
    </div>
  );
};

export default FocusMode;
