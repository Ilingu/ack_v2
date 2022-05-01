import React, {
  Dispatch,
  FC,
  Fragment,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// DB
import { doc, increment, updateDoc, deleteField } from "firebase/firestore";
import { auth, db } from "../../lib/firebase/firebase";
import { removeDuplicates } from "../../lib/utils/UtilsFunc";
import toast from "react-hot-toast";
// Types
import type {
  JikanApiResEpisodes,
  UserAnimeShape,
  UserAnimeTimestampDate,
  UserExtraEpisodesShape,
} from "../../lib/utils/types/interface";
import { AnimeWatchType } from "../../lib/utils/types/enums";
// UI
import {
  AiFillPlaySquare,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import { FaEye, FaPlus, FaTrashAlt } from "react-icons/fa";

/* INTERFACES */
interface EpsPosterProps {
  EpisodesData: JikanApiResEpisodes[];
  UserAnimeData: UserAnimeShape;
  Duration: number;
  setFocusMode: Dispatch<SetStateAction<boolean>>;
}
interface EpsPosterItemProps {
  EpisodeData: UserExtraEpisodesShape;
  watched: boolean;
  UpdateUserAnimeProgress: (epId: number, remove: boolean) => void;
}
type SortOrderType = "descending" | "ascending";
type HTMLElementEvent<T extends HTMLElement> = Event & {
  target: T;
};

/* FUNC */
let GlobalAnimeId: string;
const DecrementExtraEpisode = async () => {
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      GlobalAnimeId
    );

    await updateDoc(AnimeRef, {
      ExtraEpisodes: increment(-1),
    });

    toast.success("Deleted!", { duration: 500 });
  } catch (err) {
    toast.error("Error, cannot execute this action.");
  }
};

/* COMPONENTS */
const EpsPoster: FC<EpsPosterProps> = ({
  EpisodesData,
  Duration,
  setFocusMode,
  UserAnimeData: {
    Progress,
    WatchType,
    AnimeId,
    ExtraEpisodes,
    TimestampDate,
    NewEpisodeAvailable,
    NextEpisodeReleaseDate,
  },
}) => {
  const [RenderedEps, setNewRender] = useState<JSX.Element[]>();
  const [NextEP, setNextEp] = useState<number>(null);
  const [NoWatchedEp, setNoWatchedEp] = useState(0);

  const [LoadAll, setLoadAll] = useState(false);
  const [SortOrder, setSortOrder] = useState<SortOrderType>("descending");

  const [NoOfEpsToAdd, setNoOfEpsToAdd] = useState(0);

  const { current: EpisodesLength } = useRef(
    EpisodesData.length + (ExtraEpisodes || 0)
  );

  useEffect(() => {
    GlobalAnimeId = AnimeId.toString();
  }, [AnimeId]);

  useEffect(
    () => {
      // Data
      const EpsData: UserExtraEpisodesShape[] = [
        ...(EpisodesData || []),
        ...(GenerateExtraEp || []),
      ];
      const FilteredEpsData = (
        SortOrder === "ascending" ? [...EpsData].reverse() : EpsData
      ).slice(0, LoadAll ? EpsData.length : 30);

      // Required For Render
      const ProgressToObj =
        (Progress &&
          Progress.reduce((a, Ep_ID) => ({ ...a, [Ep_ID]: Ep_ID }), {})) ||
        null;
      let NextEp = null;
      let NoWatched = 0;

      // Render
      const JSXElems = FilteredEpsData.map((epData, i) => {
        let watched = true;
        if (
          !Progress ||
          (Progress && Progress[0] !== -2811 && !ProgressToObj[epData.mal_id])
        ) {
          watched = false;
          !NextEp && (NextEp = epData.mal_id);
        }
        watched && NoWatched++;

        return (
          <EpsPosterItem
            key={i}
            EpisodeData={epData}
            watched={watched}
            UpdateUserAnimeProgress={UpdateUserAnimeProgress}
          />
        );
      });
      if (Progress && Progress[0] === -2811) NoWatched = EpisodesLength;

      setNextEp(NextEp);
      setNoWatchedEp(NoWatched);

      setNewRender(JSXElems);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [EpisodesData, Progress, WatchType, SortOrder, LoadAll]
  );

  /* FUNC */
  const GenerateExtraEp = useMemo(
    (): UserExtraEpisodesShape[] =>
      Array(ExtraEpisodes || 0)
        .fill(null)
        .map((_: null, i) => ({
          mal_id: i + 1 + EpisodesData.length,
          isExtra: true,
        })),
    [EpisodesData.length, ExtraEpisodes]
  );

  const GetAnimeRef = useMemo(
    () =>
      doc(doc(db, "users", auth.currentUser.uid), "animes", AnimeId.toString()),
    [AnimeId]
  );

  const UpdateUserAnimeProgress = useCallback(
    async (epId: number, remove: boolean) => {
      try {
        let NewProgress = Progress
          ? Progress[0] === -2811
            ? [...Progress.slice(1)]
            : [...Progress, epId]
          : [epId];

        if (remove && Progress && Progress[0] !== -2811) {
          const ProgressCopy = [...Progress];
          const indexToDel = ProgressCopy.indexOf(epId);
          if (indexToDel === -1) return;
          ProgressCopy.splice(indexToDel, 1);
          NewProgress = ProgressCopy;
        }

        const IsFinished = NewProgress.length === EpisodesLength;

        const NewTimestampDate: UserAnimeTimestampDate = {
          BeganDate: !!TimestampDate?.BeganDate
            ? TimestampDate.BeganDate
            : new Date().toLocaleDateString(),
          EndedDate: !!TimestampDate?.EndedDate
            ? TimestampDate?.EndedDate
            : IsFinished && new Date().toLocaleDateString(),
        };

        NewProgress = removeDuplicates(NewProgress);
        await updateDoc(GetAnimeRef, {
          WatchType: IsFinished ? AnimeWatchType.WATCHED : WatchType,
          Progress: NewProgress.length <= 0 ? deleteField() : NewProgress,
          TimestampDate: NewTimestampDate || deleteField(),
          NewEpisodeAvailable: remove
            ? NewEpisodeAvailable
              ? NewEpisodeAvailable
              : deleteField()
            : deleteField(),
          NextEpisodeReleaseDate: IsFinished
            ? deleteField()
            : NextEpisodeReleaseDate,
        });

        toast.success(`Marked as ${remove ? "un" : ""}watched !`);
      } catch (err) {
        console.error(err);
        toast.error("Error, cannot execute this action.");
      }
    },
    [
      Progress,
      EpisodesLength,
      TimestampDate.BeganDate,
      TimestampDate?.EndedDate,
      GetAnimeRef,
      WatchType,
      NewEpisodeAvailable,
      NextEpisodeReleaseDate,
    ]
  );

  const ToggleEpState = async () => {
    try {
      if (Progress && Progress[0] === -2811) {
        return await updateDoc(GetAnimeRef, {
          WatchType: AnimeWatchType.WATCHING,
          Progress: Progress.slice(1),
        });
      }
      await updateDoc(GetAnimeRef, {
        WatchType: AnimeWatchType.WATCHED,
        Progress: Progress ? [-2811, ...Progress] : [-2811],
      });
      toast.success("All Marked as watched !");
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  const AddExtraEpisode = async () => {
    if (NoOfEpsToAdd <= 0) return;
    try {
      await updateDoc(GetAnimeRef, {
        ExtraEpisodes: increment(NoOfEpsToAdd),
      });

      toast.success(`${NoOfEpsToAdd} eps added!`);
      setNoOfEpsToAdd(0);
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  /* JSX */
  return (
    <div className="relative w-full">
      <h1 className="text-headline mb-3 flex flex-col text-center text-4xl font-bold">
        Episodes{" "}
        <span className="text-description text-lg font-semibold italic">
          Total: {EpisodesLength} {"//"} Remaining:{" "}
          {EpisodesLength - NoWatchedEp} eps x {Duration} min
        </span>
      </h1>
      <div className="mb-1 flex flex-wrap gap-2">
        {!isNaN(Duration) && (
          <div className="text-primary-whiter text-xl font-bold tracking-wide">
            {Math.floor((Duration * (EpisodesLength - NoWatchedEp)) / 60)} Hr{" "}
            {(Duration * (EpisodesLength - NoWatchedEp)) % 60} min{" "}
            <span className="text-description text-lg font-semibold italic">
              Remaining
            </span>
          </div>
        )}
        <div
          className="text-headline mr-auto cursor-pointer text-xl font-bold"
          onClick={() => setFocusMode(true)}
        >
          {NextEP && (
            <Fragment>
              <AiFillPlaySquare className="icon text-primary-main" /> Ep.{" "}
              <span className="text-primary-whiter">{NextEP}</span> -{" "}
            </Fragment>
          )}
          <span className="text-yellow-100">
            {((NoWatchedEp / EpisodesLength) * 100).toFixed(2)}%
          </span>
        </div>
        {NextEpisodeReleaseDate && (
          <div
            className="text-headline cursor-default font-semibold capitalize"
            title={new Date(NextEpisodeReleaseDate).toLocaleString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          >
            <span className="text-description italic">[NEXT EPISODE]</span>{" "}
            {Math.round(
              (NextEpisodeReleaseDate - Date.now()) / 1000 / 60 / 60 / 24
            )}{" "}
            Days Left
          </div>
        )}
        {TimestampDate && (
          <div className="text-headline cursor-default font-semibold">
            {TimestampDate.BeganDate && (
              <span className="hover:text-primary-whiter transition-all">
                <span className="text-description italic">[Began]</span>{" "}
                {TimestampDate.BeganDate}
              </span>
            )}
            {TimestampDate.EndedDate && (
              <span className="hover:text-primary-whiter transition-all">
                {" "}
                <span className="text-description italic">/ [Ended]</span>{" "}
                {TimestampDate.EndedDate}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mb-3 flex flex-wrap justify-center gap-2 md:justify-start">
        <div
          onClick={() =>
            setSortOrder(
              SortOrder === "descending" ? "ascending" : "descending"
            )
          }
          className="text-headline bg-bgi-whitest cursor-pointer rounded-md p-1 font-semibold"
        >
          {SortOrder === "descending" ? "Descending" : "Ascending"}
        </div>
        <div
          onClick={ToggleEpState}
          className="text-headline bg-bgi-whitest mr-auto cursor-pointer rounded-md p-1 font-semibold"
        >
          Mark as &quot;{Progress && Progress[0] === -2811 && "Un"}watched&quot;
        </div>
        <button
          onClick={(event) => {
            if (
              (event as unknown as HTMLElementEvent<HTMLButtonElement>).target
                .id === "DigitAddEpsInput"
            )
              return;
            AddExtraEpisode();
          }}
          className="text-headline bg-primary-darker focus:ring-primary-whiter w-40 rounded-md py-1 text-center font-bold outline-none
             transition focus:ring-2"
        >
          <FaPlus className="icon" /> Add{" "}
          <input
            id="DigitAddEpsInput"
            type="number"
            value={NoOfEpsToAdd || ""}
            onChange={({ target: { value, valueAsNumber } }) =>
              value.length <= 2 && setNoOfEpsToAdd(valueAsNumber)
            }
            className="bg-primary-main h-5 w-6 rounded-lg text-center font-bold outline-none"
          />{" "}
          Ep{NoOfEpsToAdd > 1 && "s"}
        </button>
      </div>
      <div className="mb-2 grid grid-cols-1 gap-2">{RenderedEps}</div>
      <div className="mb-4 flex justify-center">
        {!LoadAll && RenderedEps?.length !== EpisodesLength && (
          <button
            onClick={() => setLoadAll(true)}
            className="text-headline bg-primary-darker focus:ring-primary-whiter w-56 rounded-lg py-2 px-2 text-center font-bold outline-none
             transition focus:ring-2"
          >
            <FaEye className="icon" /> Load All
          </button>
        )}
      </div>
    </div>
  );
};

function EpsPosterItem({
  EpisodeData,
  watched,
  UpdateUserAnimeProgress,
}: EpsPosterItemProps) {
  const { title, mal_id, filler, recap, aired, isExtra } = EpisodeData || {};

  return (
    <div
      onClick={(event) => {
        const target = (event as unknown as HTMLElementEvent<HTMLButtonElement>)
          .target;
        if (
          target.classList[0] === "DeleteExtraEp" ||
          target.classList[0] === "M32"
        )
          return;
        UpdateUserAnimeProgress(mal_id, watched);
      }}
      className={`grid-cols-24 bg-bgi-whitest grid w-full cursor-pointer items-center rounded-md py-0.5 px-4 relative${
        watched || filler || recap ? "" : " border-primary-main border-l-4"
      }${
        filler
          ? " border-l-4 border-red-500"
          : recap
          ? " border-l-4 border-gray-400"
          : watched
          ? " border-bgi-whitest border-l-4"
          : ""
      }${watched ? " scale-95" : ""}`}
    >
      {isExtra && (
        <div onClick={DecrementExtraEpisode} className="absolute right-4">
          <FaTrashAlt className="DeleteExtraEp text-red-500" />
        </div>
      )}
      <div>
        {watched ? (
          <AiOutlineEyeInvisible className="text-description mr-4 -translate-x-3 text-xl" />
        ) : (
          <AiOutlineEye className="text-headline mr-4 -translate-x-3 text-xl" />
        )}
      </div>

      <p className="text-headline xs:col-span-3 col-span-4 font-semibold lg:col-span-2">
        Ep. <span className="text-primary-whiter">{mal_id}</span>
      </p>
      <p className="text-headline lg:col-span-15 xs:col-span-16 col-span-13 font-semibold">
        {title}
      </p>
      <div className="xs:col-span-4 text-headline col-span-6 flex justify-end text-center font-semibold uppercase tracking-wider lg:col-span-3">
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
      <p className="text-headline col-span-3 hidden justify-items-end font-semibold lg:grid">
        {aired && new Date(aired).toLocaleDateString()}
      </p>
    </div>
  );
}

export default EpsPoster;
