import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// DB
import { doc, increment, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { removeDuplicates } from "../../lib/utilityfunc";
import toast from "react-hot-toast";
// Types
import {
  JikanApiResEpisodes,
  UserAnimeShape,
  UserExtraEpisodesShape,
} from "../../lib/types/interface";
// UI
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaEye, FaPlus, FaTrashAlt } from "react-icons/fa";

/* INTERFACES */
interface EpsPosterProps {
  EpisodesData: JikanApiResEpisodes[];
  UserAnimeData: UserAnimeShape;
  Duration: number;
}
interface EpsPosterItemProps {
  EpisodeData: UserExtraEpisodesShape;
  watched: boolean;
  UpdateUserAnimeProgress: (epId: number, remove: boolean) => void;
}
type SortOrderType = "descending" | "ascending";

/* FUNC */
let GlobalAnimeId: string;
const DecrementExtraEpisode = () => {
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      GlobalAnimeId
    );

    updateDoc(AnimeRef, {
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
  UserAnimeData: { Progress, WatchType, AnimeId, ExtraEpisodes },
}) => {
  const [RenderedEps, setNewRender] = useState<JSX.Element[]>();

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
      const EpsData: UserExtraEpisodesShape[] = [
        ...EpisodesData,
        ...GenerateExtraEp,
      ];
      const FilteredEpsData = (
        SortOrder === "ascending" ? [...EpsData].reverse() : EpsData
      ).slice(0, LoadAll ? EpsData.length : 20);

      const ProgressToObj =
        (Progress &&
          Progress.reduce((a, GrName) => ({ ...a, [GrName]: GrName }), {})) ||
        null;
      const JSXElems = FilteredEpsData.map((epData, i) => {
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
    [EpisodesData, Progress, WatchType, SortOrder, LoadAll]
  );

  /* FUNC */
  const GenerateExtraEp = useMemo(
    (): UserExtraEpisodesShape[] =>
      Array.apply(null, Array(ExtraEpisodes || 0)).map((_: null, i) => ({
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

        updateDoc(GetAnimeRef, {
          Progress: removeDuplicates(NewProgress),
        });

        toast.success("Marked as watched !");
      } catch (err) {
        toast.error("Error, cannot execute this action.");
      }
    },
    [GetAnimeRef, Progress]
  );

  const MarkAllEpWatched = () => {
    try {
      updateDoc(GetAnimeRef, {
        Progress: [-2811],
      });
      toast.success("All Marked as watched !");
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  const AddExtraEpisode = () => {
    if (NoOfEpsToAdd <= 0) return;
    try {
      updateDoc(GetAnimeRef, {
        ExtraEpisodes: increment(NoOfEpsToAdd),
      });

      toast.success(`${NoOfEpsToAdd} eps added!`);
      setNoOfEpsToAdd(0);
    } catch (err) {
      toast.error("Error, cannot execute this action.");
    }
  };

  return (
    <div className="w-full relative">
      <h1 className="text-center text-4xl text-headline font-bold mb-3">
        Episodes ({EpisodesLength})
      </h1>
      <div className="flex flex-wrap md:justify-start justify-center gap-2 mb-3">
        {!isNaN(Duration) && (
          <div className="font-bold text-primary-main text-xl tracking-wide mr-auto">
            {((Duration * EpisodesLength) / 60).toFixed()} Hr{" "}
            {parseInt((Duration * EpisodesLength).toFixed(0).slice(2))} min{" "}
            <span className="text-description font-semibold text-lg">
              ({EpisodesLength} eps x {Duration} min)
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
        <button
          onClick={({ target }) => {
            if (target.id === "DigitAddEpsInput") return;
            AddExtraEpisode();
          }}
          className="text-center text-headline bg-primary-darker rounded-md font-bold w-40 py-1 outline-none focus:ring-2
             focus:ring-primary-whiter transition"
        >
          <FaPlus className="icon" /> Add{" "}
          <input
            id="DigitAddEpsInput"
            type="number"
            value={NoOfEpsToAdd || ""}
            onChange={({ target: { value, valueAsNumber } }) =>
              value.length <= 2 && setNoOfEpsToAdd(valueAsNumber)
            }
            className="w-6 h-5 rounded-lg bg-primary-main text-center font-bold outline-none"
          />{" "}
          Ep{NoOfEpsToAdd > 1 && "s"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 mb-2">{RenderedEps}</div>
      <div className="flex justify-center mb-4">
        {!LoadAll && (
          <button
            onClick={() => setLoadAll(true)}
            className="text-center text-headline bg-primary-darker py-2 px-2 rounded-lg font-bold w-56 outline-none focus:ring-2
             focus:ring-primary-whiter transition"
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
      onClick={({ target: { classList } }) => {
        if (classList[0] === "DeleteExtraEp" || classList[0] === "M32") return;
        UpdateUserAnimeProgress(mal_id, watched);
      }}
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
      {isExtra && (
        <div
          onClick={DecrementExtraEpisode}
          className="absolute right-4 cursor-pointer"
        >
          <FaTrashAlt className="DeleteExtraEp text-red-500" />
        </div>
      )}
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
