import {
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
import Image from "next/image";
// DB
import { doc, increment, updateDoc, deleteField } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase/firebase";
// Types
import {
  GenerateEpProviderUrl,
  GetProviderUIInfo,
  pickTextColorBasedOnBgColor,
  removeDuplicates,
} from "../../../lib/utils/UtilsFuncs";
import {
  ConvertBroadcastTimeZone,
  FormatDate,
} from "../../../lib/client/ClientFuncs";
// Types
import type {
  JikanApiResEpisodes,
  UserAnimeShape,
  UserAnimeTimestampDate,
  UserExtraEpisodesShape,
} from "../../../lib/utils/types/interface";
import { AnimeWatchType } from "../../../lib/utils/types/enums";
// UI
import toast from "react-hot-toast";
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
  ExtraInfo: {
    YugenId: string;
    NextEpisodesReleaseDate: number[];
    Duration: number;
    broadcast: string;
  };
  setFocusMode: Dispatch<SetStateAction<boolean>>;
}
interface EpsPosterItemProps {
  EpisodeData: UserExtraEpisodesShape;
  watched: boolean;
  ExtraData: {
    ReleaseDate: number;
  };
  UpdateUserAnimeProgress: (epId: number, remove: boolean) => void;
}
type SortOrderType = "descending" | "ascending";
type HTMLElementEvent<T extends HTMLElement> = Event & {
  target: T;
};

/* FUNC */
let GlobalAnimeId: string;
const AddExtraEpisode = async (NoOfEpsToAdd: number) => {
  if (NoOfEpsToAdd <= 0) return;
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      GlobalAnimeId
    );

    await updateDoc(AnimeRef, {
      ExtraEpisodes: increment(NoOfEpsToAdd),
    });

    toast.success(`${NoOfEpsToAdd} eps added!`);
  } catch (err) {
    toast.error(`Error, cannot add ${NoOfEpsToAdd} extra eps.`);
  }
};

const DecrementExtraEpisode = async (_: any, del = false) => {
  try {
    const AnimeRef = doc(
      doc(db, "users", auth.currentUser.uid),
      "animes",
      GlobalAnimeId
    );

    await updateDoc(AnimeRef, {
      ExtraEpisodes: del ? deleteField() : increment(-1),
    });

    !del && toast.success("Deleted!", { duration: 500 });
  } catch (err) {
    toast.error("Error, cannot delete this extra ep.");
  }
};

let GlobalYugenId: string;
/* COMPONENTS */
const EpsPoster: FC<EpsPosterProps> = ({
  EpisodesData,
  setFocusMode,
  UserAnimeData: {
    Progress,
    WatchType,
    AnimeId,
    ExtraEpisodes,
    TimestampDate,
    NewEpisodeAvailable,
  },
  ExtraInfo: { Duration, YugenId, NextEpisodesReleaseDate, broadcast },
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
  GlobalYugenId = YugenId;

  const NextEpisodeReleaseDate = useMemo((): number => {
    if (!broadcast) return null;
    const NextEpReleaseDateTimestamp = ConvertBroadcastTimeZone(
      broadcast,
      "NextBroadcastNumber"
    ) as number;
    return NextEpReleaseDateTimestamp;
  }, [broadcast]);

  const GenerateExtraEp = useMemo((): UserExtraEpisodesShape[] => {
    if (!ExtraEpisodes || ExtraEpisodes <= 0) return [];
    return Array(ExtraEpisodes || 0)
      .fill(null)
      .map((_: null, i) => ({
        mal_id: i + 1 + EpisodesData?.length,
        isExtra: true,
      }));
  }, [EpisodesData.length, ExtraEpisodes]);

  const GetAnimeRef = useMemo(
    () =>
      doc(doc(db, "users", auth.currentUser.uid), "animes", AnimeId.toString()),
    [AnimeId]
  );

  /* FUNC */
  const RenderEpisodes = () => {
    // Data
    const EpsData: UserExtraEpisodesShape[] = [
      ...(EpisodesData || []),
      ...(GenerateExtraEp || []),
    ];
    const FilteredEpsData = (
      SortOrder === "ascending" ? [...EpsData].reverse() : EpsData
    ).slice(0, LoadAll ? EpsData.length : 30);

    // Required For Render
    let NextEp = null;
    let NoWatched = 0;

    // Render
    const JSXElems = FilteredEpsData.map((epData, i) => {
      let watched = true;
      if (
        !Progress ||
        (Progress && Progress[0] !== -2811 && !Progress.includes(epData.mal_id))
      ) {
        watched = false;
        !NextEp && (NextEp = epData.mal_id);
      }
      watched && NoWatched++;

      return (
        <EpsPosterItem
          key={i}
          ExtraData={{
            ReleaseDate: NextEpisodesReleaseDate && NextEpisodesReleaseDate[i],
          }}
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

    if (ExtraEpisodes === 0) DecrementExtraEpisode(null, true);
  };

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
            ? NewEpisodeAvailable || deleteField()
            : deleteField(),
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
      TimestampDate?.BeganDate,
      TimestampDate?.EndedDate,
      GetAnimeRef,
      WatchType,
      NewEpisodeAvailable,
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

  /* Effects */
  useEffect(() => {
    GlobalAnimeId = AnimeId.toString();
  }, [AnimeId]);

  useEffect(RenderEpisodes, [
    EpisodesData,
    Progress,
    WatchType,
    SortOrder,
    LoadAll,
    GenerateExtraEp,
    EpisodesLength,
    NextEpisodesReleaseDate,
    UpdateUserAnimeProgress,
    ExtraEpisodes,
  ]);

  /* JSX */
  return (
    <div className="relative w-full">
      <h1 className="mb-3 flex flex-col text-center text-4xl font-bold text-headline">
        Episodes{" "}
        <span className="text-lg font-semibold italic text-description">
          Total: <span data-testid="EpisodesLength">{EpisodesLength}</span>{" "}
          {"//"} Remaining:{" "}
          <span data-testid="EpisodesRemaining">
            {EpisodesLength - NoWatchedEp}
          </span>{" "}
          eps x <span data-testid="EpisodesDuration">{Duration}</span> min
        </span>
      </h1>
      <div className="mb-1 flex flex-wrap gap-2">
        {!isNaN(Duration) && (
          <div
            className="text-xl font-bold tracking-wide text-primary-whiter"
            data-testid="WatchTimeRemaining"
          >
            {Math.floor((Duration * (EpisodesLength - NoWatchedEp)) / 60)} Hr{" "}
            {(Duration * (EpisodesLength - NoWatchedEp)) % 60} min{" "}
            <span className="text-lg font-semibold italic text-description">
              Remaining
            </span>
          </div>
        )}
        <div
          className="mr-auto cursor-pointer text-xl font-bold text-headline"
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
            className="cursor-default font-semibold capitalize text-headline"
            title={new Date(NextEpisodeReleaseDate).toLocaleString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          >
            <span className="italic text-description">[NEXT EPISODE]</span>{" "}
            {Math.round(
              (NextEpisodeReleaseDate - Date.now()) / 1000 / 60 / 60 / 24
            )}{" "}
            Days Left
          </div>
        )}
        {TimestampDate && (
          <div className="cursor-default font-semibold text-headline">
            {TimestampDate.BeganDate && (
              <span className="transition-all hover:text-primary-whiter">
                <span className="italic text-description">[Began]</span>{" "}
                {TimestampDate.BeganDate}
              </span>
            )}
            {TimestampDate.EndedDate && (
              <span className="transition-all hover:text-primary-whiter">
                {" "}
                <span className="italic text-description">/ [Ended]</span>{" "}
                {TimestampDate.EndedDate}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mb-3 flex flex-wrap justify-center gap-2 md:justify-start">
        <button
          onClick={() =>
            setSortOrder(
              SortOrder === "descending" ? "ascending" : "descending"
            )
          }
          data-testid="WatchFilterOrderBtn"
          className="rounded-md bg-bgi-whitest p-1 font-semibold text-headline"
        >
          {SortOrder === "descending" ? "Descending" : "Ascending"}
        </button>
        <button
          onClick={ToggleEpState}
          data-testid="WatchMarkBtn"
          className="mr-auto cursor-pointer rounded-md bg-bgi-whitest p-1 font-semibold text-headline"
        >
          Mark as &quot;{Progress && Progress[0] === -2811 && "Un"}watched&quot;
        </button>
        <button
          onClick={(event) => {
            if (
              (event as unknown as HTMLElementEvent<HTMLButtonElement>).target
                .id === "DigitAddEpsInput"
            )
              return;
            AddExtraEpisode(NoOfEpsToAdd);
            setNoOfEpsToAdd(0);
          }}
          data-testid="WatchAddExtraEpsBtn"
          className="w-40 rounded-md bg-primary-darker py-1 text-center font-bold text-headline outline-none transition
             focus:ring-2 focus:ring-primary-whiter"
        >
          <FaPlus className="icon" /> Add{" "}
          <input
            id="DigitAddEpsInput"
            type="number"
            data-testid="WatchAddExtraEpsInput"
            value={NoOfEpsToAdd || ""}
            onChange={({ target: { value, valueAsNumber } }) =>
              value.length <= 2 && setNoOfEpsToAdd(valueAsNumber)
            }
            className="h-5 w-6 rounded-lg bg-primary-main text-center font-bold outline-none"
          />{" "}
          Ep{NoOfEpsToAdd > 1 && "s"}
        </button>
      </div>
      <div className="mb-2 grid grid-cols-1 gap-2" data-testid="WatchEpsList">
        {RenderedEps}
      </div>
      <div className="mb-4 flex justify-center">
        {!LoadAll && RenderedEps?.length !== EpisodesLength && (
          <button
            onClick={() => setLoadAll(true)}
            className="w-56 rounded-lg bg-primary-darker py-2 px-2 text-center font-bold text-headline outline-none transition
             focus:ring-2 focus:ring-primary-whiter"
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
  ExtraData: { ReleaseDate },
  UpdateUserAnimeProgress,
}: EpsPosterItemProps) {
  const { title, mal_id, filler, recap, aired, isExtra } = EpisodeData || {};
  const [ProviderColor, ProviderLogo] = GetProviderUIInfo();

  return (
    <div
      data-testid="WatchEpisodeItem"
      onClick={(event) => {
        const target = (event as unknown as HTMLElementEvent<HTMLButtonElement>)
          .target;
        if (
          target.classList[0] === "DeleteExtraEp" ||
          target.classList[0] === "providerLink" ||
          target.parentElement.classList[0] === "DeleteExtraEp"
        )
          return;
        UpdateUserAnimeProgress(mal_id, watched);
      }}
      className={`grid w-full cursor-pointer grid-cols-24 items-center rounded-md bg-bgi-whitest py-0.5 px-4 relative${
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
        <button
          onClick={DecrementExtraEpisode}
          id={`EpDeleteExtraEpBtn-${mal_id}`}
          data-testid="WatchDeleteExtraEpBtn"
          className="DeleteExtraEp absolute right-4 h-full w-1/12 outline-none"
        >
          <FaTrashAlt className="DeleteExtraEp absolute top-[calc(50%-8px)] right-0 text-red-500" />
        </button>
      )}
      <div>
        {watched ? (
          <AiOutlineEyeInvisible className="mr-4 -translate-x-3 text-xl text-description" />
        ) : (
          <AiOutlineEye className="mr-4 -translate-x-3 text-xl text-headline" />
        )}
      </div>

      <p className="col-span-4 font-semibold text-headline xs:col-span-3 lg:col-span-2">
        Ep. <span className="text-primary-whiter">{mal_id}</span>
      </p>
      <p className="col-span-13 font-semibold text-headline xs:col-span-16 lg:col-span-15">
        {title}
      </p>

      {GlobalYugenId && (
        <a
          href={
            GenerateEpProviderUrl(GlobalYugenId, mal_id) ||
            "https://ack.vercel.app"
          }
          target="_blank"
          rel="noreferrer"
          className="providerLink col-span-6 flex justify-end text-center font-semibold uppercase tracking-wider text-headline xs:col-span-4 lg:col-span-3"
        >
          <div
            className={`providerLink flex min-w-[80px] items-center justify-center gap-1 rounded-lg capitalize ${
              ReleaseDate && ReleaseDate > Date.now()
                ? " text-description opacity-50"
                : ""
            }`}
            style={{
              backgroundColor: ProviderColor,
              color: pickTextColorBasedOnBgColor(ProviderColor),
            }}
            title={
              ReleaseDate && ReleaseDate > Date.now()
                ? "Not published yet"
                : `Published!`
            }
          >
            <Image
              src={ProviderLogo}
              width={16}
              height={16}
              alt={`Yugen's Logo`}
              className="providerLink rounded-md bg-white"
            />{" "}
            Yugen{" "}
          </div>
        </a>
      )}

      <p className="col-span-3 hidden justify-items-end font-semibold text-headline lg:grid">
        {ReleaseDate ? FormatDate(ReleaseDate) : aired && FormatDate(aired)}
      </p>
    </div>
  );
}

export default EpsPoster;
