import React, { FC, useEffect, useRef, useState } from "react";
// DB
import { deleteField, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase/firebase";
import { ManageFullScreen, removeDuplicates } from "../../lib/utils/UtilsFunc";
// Types
import {
  JikanApiResEpisodes,
  UserAnimeShape,
  UserAnimeTimestampDate,
} from "../../lib/utils/types/interface";
import { AnimeWatchType } from "../../lib/utils/types/enums";
// UI
import {
  AiOutlineCheck,
  AiOutlineCloseSquare,
  AiOutlineRightCircle,
} from "react-icons/ai";
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
  LastEp: boolean;
}

const FocusMode: FC<FocusModeProps> = ({
  EpisodesData,
  UserAnimeData: { Progress, ExtraEpisodes, AnimeId, TimestampDate, WatchType },
  CancelModeFocus,
}) => {
  const [FocusEpisodeData, setFocusEpisodeShape] =
    useState<FocusEpisodeShape>(null);

  const { EpId, EpTitle, Filler, Recap, LastEp } = FocusEpisodeData || {};

  const { current: EpisodesLength } = useRef(
    EpisodesData.length + (ExtraEpisodes || 0)
  );

  /* FUNC */
  useEffect(() => {
    scrollTo(0, 0); // UX
    document.body.style.overflow = "hidden";
    ManageFullScreen("activate");

    // UnMounted UX
    return () => {
      document.body.style.overflow = null;
      ManageFullScreen("desactivate");
    };
  }, []);

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

    for (let id = 1; id < EpisodesLength + 1; id++) {
      if ((!ProgressToObj || !ProgressToObj[id]) && !NextEpId) {
        NextEpId = id;

        const EpisodeData = EpisodesData.find(({ mal_id }) => mal_id === id);
        if (!EpisodeData) continue;
        const { title, filler, recap } = EpisodeData;
        NextEpTitle = title;
        NextEpFiller = filler;
        NextEpRecap = recap;
      }
    }

    setFocusEpisodeShape({
      EpId: NextEpId || 1,
      EpTitle: NextEpTitle,
      Filler: NextEpFiller,
      Recap: NextEpRecap,
      LastEp: EpisodesLength === NextEpId,
    });
  }, [EpisodesData, EpisodesLength, Progress]);

  const UpdateUserAnimeProgress = async () => {
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

      await updateDoc(AnimeRef(), {
        WatchType: IsFinished ? AnimeWatchType.WATCHED : WatchType,
        Progress: removeDuplicates(NewProgress),
        TimestampDate: NewTimestampDate || deleteField(),
        NewEpisodeAvailable: deleteField(),
      });

      if (IsFinished) {
        CancelModeFocus();
        toast.success("You finished this anime!");
      } else toast.success(`Marked as watched !`);
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  /* JSX */
  return (
    <div className="bg-bgi-darker absolute top-0 left-0 z-20 flex h-screen w-screen flex-col items-center justify-center bg-opacity-60">
      <h1
        className="bg-bgi-black text-headline relative mb-5 w-10/12 scale-110 rounded-lg bg-opacity-80 p-4 text-center text-2xl font-bold
       transition-all hover:bg-opacity-90 sm:w-72 sm:min-w-max"
      >
        <span className="text-description-whiter font-semibold italic">
          Episode
        </span>{" "}
        <span>#{EpId}</span>
        <br />
        <span className="decoration-primary-whiter text-xl font-semibold underline">
          {EpTitle}
        </span>
        {(Filler || Recap) && (
          <div
            className={`absolute -top-2 -left-6 -rotate-45 px-1 text-lg uppercase tracking-wide bg-${
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
          className="text-headline bg-bgi-black rounded-full p-4 text-5xl transition-all hover:text-red-400 
        hover:ring-2 hover:ring-red-500"
        >
          <AiOutlineCloseSquare />
        </button>
        <button
          onClick={UpdateUserAnimeProgress}
          className="text-headline bg-bgi-black hover:text-primary-whiter hover:ring-primary-main rounded-full p-4 text-5xl 
        transition-all hover:ring-2"
        >
          {LastEp ? <AiOutlineCheck /> : <AiOutlineRightCircle />}
        </button>
      </div>
    </div>
  );
};

export default FocusMode;
