import React, {
  FC,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import kebabCase from "lodash.kebabcase";
import debounce from "lodash.debounce";
// Types
import { GlobalAppContext } from "../../lib/context";
import {
  AnimeWatchType,
  AnimeWatchTypeDisplayable,
  HomeDisplayTypeEnum,
} from "../../lib/utils/types/enums";
import type {
  UserAnimePosterShape,
  UserGroupPosterShape,
  UserGroupShape,
} from "../../lib/utils/types/interface";
// Auth
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase/firebase";
// Func
import {
  copyToClipboard,
  DeviceCheckType,
  filterUserAnime,
  removeDuplicates,
  shuffleArray,
  ToggleFav,
} from "../../lib/utils/UtilsFunc";
import { RevalidateAnime } from "../../lib/utils/UtilsFunc";
// UI
import { AiFillCloseCircle, AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaCopy, FaMinus, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import { FcOk } from "react-icons/fc";
import toast from "react-hot-toast";
import VerticalDivider from "../Design/VerticalDivider";
import HandleInput from "./HandleInput";
import Dropdown from "../Design/Dropdown";

/* INTERFACE */
interface HomeAnimeItemPosterProp {
  AnimeData: UserAnimePosterShape;
  RenderType: "animeList" | "groupList";
  IsAnimeToAdd?: boolean;
  ToggleGroup: (
    id: string,
    method: "ADD" | "DELETE" | "DELETE_DB",
    GrName?: string
  ) => void;
  NameOfGroup?: string;
}
interface HomeHeaderProps {
  HomeDisplayType: HomeDisplayTypeEnum;
  setHomeDisplayType: React.Dispatch<React.SetStateAction<HomeDisplayTypeEnum>>;
  setAnimeSearchMode: React.Dispatch<React.SetStateAction<boolean>>;
}
interface SortByWatchTypeProps {
  ActiveWatchType: AnimeWatchTypeDisplayable;
  setActiveWatchType: React.Dispatch<
    React.SetStateAction<AnimeWatchTypeDisplayable>
  >;
}
interface GroupFormInputProps {
  IsModeGroup: boolean;
  HomeDisplayType: HomeDisplayTypeEnum;
  AddGroup: (GrName: string) => void;
  SearchGroup: (GrName: string) => string[];
}
interface HomeGroupItemPosterProp {
  GroupData: UserGroupPosterShape;
  setSelectedGroup: React.Dispatch<
    React.SetStateAction<{
      name: string;
      data: UserGroupPosterShape;
    }>
  >;
}
interface AnimePosterComponentProps {
  AnimeRenderedElements: JSX.Element[];
}
interface GroupComponentProps {
  GroupRenderedElements: JSX.Element[];
  selectedGroupName: {
    name: string;
    data: UserGroupPosterShape;
  };
  setSelectedGroup: React.Dispatch<
    React.SetStateAction<{
      name: string;
      data: UserGroupPosterShape;
    }>
  >;
  ToggleGroup: (
    id: string,
    method: "ADD" | "DELETE" | "DELETE_DB",
    GrName?: string
  ) => void;
  DeleteGroup: (GrName: string) => Promise<void>;
}
interface AnimeSearchFormInputProps {
  SearchAnime: (AnimeName: string) => void;
}

/* COMPONENTS */
const HomePoster: FC = () => {
  /* STATE */
  const { UserAnimes, UserGroups, GlobalAnime, user } =
    useContext(GlobalAppContext);

  const [AnimeRenderedElements, setNewRenderForAnimes] =
    useState<JSX.Element[]>();
  const [GroupRenderedElements, setNewRenderForGroups] =
    useState<JSX.Element[]>();
  const [ActiveWatchType, setActiveWatchType] = useState(
    () =>
      (localStorage.getItem("WatchTypeFilter") as AnimeWatchTypeDisplayable) ||
      AnimeWatchTypeDisplayable.WATCHING
  );

  const [AnimeSearchMode, setAnimeSearchMode] = useState(false);
  const [AnimeSearchScope, setAnimeSearchScope] = useState<string[]>([]);

  const [AnimesToAdd, setAnimeToAdd] = useState<string[]>([]);

  const AnimesElementsOrder = useRef<string[]>();
  const GroupsElementsOrder = useRef<string[]>();

  const [HomeDisplayType, setHomeDisplayType] = useState<HomeDisplayTypeEnum>(
    () =>
      JSON.parse(localStorage.getItem("HomeDisplayType")) !== 0
        ? HomeDisplayTypeEnum.ANIMES
        : HomeDisplayTypeEnum.GROUP
  );

  // Group
  const [selectedGroupName, setSelectedGroup] = useState<{
    name: string;
    data: UserGroupPosterShape;
  }>({
    name: null,
    data: null,
  });

  /* EFFECT */
  // LocalHost
  useEffect(() => {
    localStorage.setItem("HomeDisplayType", JSON.stringify(HomeDisplayType));
  }, [HomeDisplayType]);
  useEffect(() => {
    localStorage.setItem("WatchTypeFilter", ActiveWatchType);
  }, [ActiveWatchType]);

  // Render
  useEffect(() => {
    if (!GlobalAnime || !UserAnimes || !UserGroups) return;

    if (HomeDisplayType === HomeDisplayTypeEnum.GROUP) {
      return GroupRender();
    }
    AnimeRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    GlobalAnime,
    HomeDisplayType,
    UserAnimes,
    UserGroups,
    AnimesToAdd,
    ActiveWatchType,
    AnimeSearchScope,
  ]);

  /* Filtered Anime Data */
  const filteredUserAnime = useMemo(
    () => filterUserAnime(UserAnimes),
    [UserAnimes]
  );

  const AnimesHomePostersData: UserAnimePosterShape[] = useMemo(
    () =>
      filteredUserAnime
        ?.map(
          ({
            AnimeId,
            Fav,
            WatchType,
            NewEpisodeAvailable,
            NextEpisodeReleaseDate,
          }) => {
            if (!GlobalAnime) return null;
            const AnimeData = GlobalAnime.find(
              ({ malId }) => malId === AnimeId
            );
            if (!AnimeData) return null;

            return {
              AnimeId,
              Fav,
              WatchType,
              title: AnimeData.title,
              photoURL: AnimeData.photoPath,
              type: AnimeData.type,
              NewEpisodeAvailable,
              NextEpisodeReleaseDate,
            } as UserAnimePosterShape;
          }
        )
        .filter((UAP) => UAP),
    [GlobalAnime, filteredUserAnime]
  );

  /* RENDER */
  const GroupRender = () => {
    // Group Render
    if (!GroupsElementsOrder.current) {
      // Render Order
      const AnimesGroupId: string[] = UserGroups.map(
        ({ GroupName }) => GroupName
      );

      const GroupsOrder = shuffleArray(AnimesGroupId);
      GroupsElementsOrder.current = GroupsOrder;
    }
    if (UserGroups.length !== GroupsElementsOrder.current.length) {
      const ToObjRA = UserGroups.reduce(
        (a, { GroupName }) => ({ ...a, [GroupName]: GroupName }),
        {}
      );
      const ToObjCA = GroupsElementsOrder.current.reduce(
        (a, GrName) => ({ ...a, [GrName]: GrName }),
        {}
      );

      // Check If New Group To Add
      UserGroups.forEach(({ GroupName }) => {
        if (!ToObjCA[GroupName]) GroupsElementsOrder.current.unshift(GroupName);
      });
      // Check If Group To Delete
      GroupsElementsOrder.current.forEach((GrName) => {
        if (!ToObjRA[GrName]) {
          const CurrentGroups = GroupsElementsOrder.current;
          const indexToDel = CurrentGroups.indexOf(GrName);
          if (indexToDel === -1) return;
          CurrentGroups.splice(indexToDel, 1);
        }
      });
    }

    const TransformToPosterGroupData = ({
      GroupAnimesId,
      GroupName,
    }: UserGroupShape): UserGroupPosterShape => {
      const FilteredAnimesForGroup = AnimesHomePostersData.filter(
        ({ AnimeId }) => {
          let Pass = false;

          GroupAnimesId.forEach((GroupAnimeId) => {
            if (AnimeId.toString() === GroupAnimeId) Pass = true;
          });
          return Pass;
        }
      );
      return { GroupName, Animes: FilteredAnimesForGroup };
    };

    const GroupsPosterJSX = GroupsElementsOrder.current.map(
      (GroupNameId, i) => {
        const GroupData = UserGroups.find(
          ({ GroupName }) => GroupName === GroupNameId
        );
        const DataAssociatedForGroup = TransformToPosterGroupData(GroupData);

        return (
          <GroupItemPoster
            key={i}
            GroupData={DataAssociatedForGroup}
            setSelectedGroup={setSelectedGroup}
          />
        );
      }
    );

    setNewRenderForGroups(GroupsPosterJSX);
  };

  const AnimeRender = () => {
    // Animes Render
    const batch = writeBatch(db);
    const AnimeRef = (AnimeId: string) =>
      doc(doc(db, "users", user.uid), "animes", AnimeId);

    if (!AnimesElementsOrder.current) {
      // Shuffle Array -> Order
      const AllAnimesId = filteredUserAnime.map(({ AnimeId }) =>
        AnimeId.toString()
      );

      const AnimesOrder = shuffleArray(AllAnimesId);
      AnimesElementsOrder.current = AnimesOrder;
    }
    if (filteredUserAnime.length !== AnimesElementsOrder.current.length) {
      const AllRealAnime = filteredUserAnime;

      const ToObjRA = AllRealAnime.reduce(
        (a, { AnimeId }) => ({ ...a, [AnimeId]: AnimeId }),
        {}
      );
      const ToObjCA = AnimesElementsOrder.current.reduce(
        (a, id) => ({ ...a, [id]: id }),
        {}
      );

      // Check If New Anime To Add
      AllRealAnime.forEach(({ AnimeId }) => {
        if (!ToObjCA[AnimeId])
          AnimesElementsOrder.current.unshift(AnimeId.toString());
      });
      // Check If Anime To Delete
      AnimesElementsOrder.current.forEach((AnimeID) => {
        if (!ToObjRA[AnimeID]) {
          const CurrentAnimes = AnimesElementsOrder.current;
          const indexToDel = CurrentAnimes.indexOf(AnimeID);
          if (indexToDel === -1) return;
          CurrentAnimes.splice(indexToDel, 1);
        }
      });
    }

    let AnimesToAddToObj = null;
    if (AnimesToAdd.length > 0)
      AnimesToAddToObj = AnimesToAdd.reduce(
        (a, id) => ({ ...a, [id]: id }),
        {}
      );

    const AnimesPosterJSX = AnimesElementsOrder.current
      .map((animeId, i) => {
        const AnimeData = AnimesHomePostersData.find(
          ({ AnimeId }) => AnimeId.toString() === animeId
        );
        if (!AnimeData) return null;

        // Notif Check
        if (
          AnimeData?.NextEpisodeReleaseDate &&
          Date.now() >= AnimeData?.NextEpisodeReleaseDate
        ) {
          !AnimeData?.NewEpisodeAvailable &&
            batch.update(AnimeRef(animeId), {
              NewEpisodeAvailable: true,
            });
        }

        // Sort By ActiveWatchType
        const ActiveWatchType_CONDITION =
          ActiveWatchType !== AnimeWatchTypeDisplayable.ALL &&
          ActiveWatchType !== AnimeWatchTypeDisplayable.FAV &&
          (AnimeData.WatchType as unknown as AnimeWatchTypeDisplayable) !==
            ActiveWatchType;

        if (ActiveWatchType_CONDITION) return null;
        if (ActiveWatchType === AnimeWatchTypeDisplayable.FAV && !AnimeData.Fav)
          return null;

        // Check If within the Search Scope
        if (AnimeSearchScope?.length > 0 && !AnimeSearchScope.includes(animeId))
          return null;

        // JSX
        return (
          <AnimeItemPoster
            key={animeId || i}
            AnimeData={AnimeData}
            RenderType="animeList"
            IsAnimeToAdd={AnimesToAddToObj && !!AnimesToAddToObj[animeId]}
            ToggleGroup={ToggleGroup}
          />
        );
      })
      .filter((Poster) => !!Poster);

    (async () => await batch.commit())();
    setNewRenderForAnimes(AnimesPosterJSX);
  };

  /* FB Func */
  const ToggleGroup = useCallback(
    async (
      id: string,
      method: "ADD" | "DELETE" | "DELETE_DB",
      GrName?: string
    ) => {
      if (method === "ADD") setAnimeToAdd((prev) => [...prev, id]);
      if (method === "DELETE") {
        const CopyArr = [...AnimesToAdd];
        const indexToDel = CopyArr.indexOf(id);
        if (indexToDel === -1) return;
        CopyArr.splice(indexToDel, 1);
        setAnimeToAdd(CopyArr);
      }
      if (method === "DELETE_DB") {
        try {
          const { GroupAnimesId: CurrentGroup } = {
            ...UserGroups.find((group) => group.GroupName === GrName),
          };
          const IndexToDel = CurrentGroup.indexOf(id);
          if (IndexToDel === -1) return;
          CurrentGroup.splice(IndexToDel, 1);

          const GroupRef = doc(doc(db, "users", user.uid), "groups", GrName);
          await updateDoc(GroupRef, {
            GroupAnimesId: CurrentGroup,
          });
          toast.success("Anime removed from this group");
        } catch (err) {
          toast.error("Couldn't delete this anime from this group");
        }
      }
    },
    [AnimesToAdd, UserGroups, user.uid]
  );

  const AddGroup = useCallback(
    async (GrName: string) => {
      const SafeGrName = encodeURI(kebabCase(GrName));
      try {
        const GroupRef = doc(doc(db, "users", user.uid), "groups", SafeGrName);
        const GroupData = await getDoc(GroupRef);

        if (GroupData.exists()) {
          const { GroupAnimesId } = GroupData.data();
          await updateDoc(GroupRef, {
            GroupAnimesId: removeDuplicates([...GroupAnimesId, ...AnimesToAdd]),
          });
        } else
          await setDoc(GroupRef, {
            GroupName: SafeGrName,
            GroupAnimesId: AnimesToAdd,
          });
        // Reset
        setAnimeToAdd([]);
        toast.success("Anime(s) add successfully in your group!");
      } catch (err) {
        toast.error("Couldn't add your anime(s) in your group");
      }
    },
    [AnimesToAdd, user.uid]
  );

  const DeleteGroup = useCallback(
    async (GrName: string) => {
      const SafeGrName = encodeURI(kebabCase(GrName));
      try {
        if (!SafeGrName || SafeGrName.trim().length <= 0) throw new Error();

        const GroupRef = doc(doc(db, "users", user.uid), "groups", SafeGrName);
        await deleteDoc(GroupRef);

        setSelectedGroup(null);
        toast.success("Group successfully deleted");
      } catch (err) {
        toast.error("Couldn't delete this group");
      }
    },
    [user.uid]
  );

  /* Other Func */
  const SearchGroup = useCallback(
    (GrName: string) =>
      UserGroups.filter(({ GroupName }) => {
        const GrNameToSearch = encodeURI(kebabCase(GrName));
        return GroupName.includes(GrNameToSearch);
      }).map(({ GroupName }) => GroupName),
    [UserGroups]
  );

  const SearchAnime = useCallback(
    (AnimeName: string) => {
      if (!AnimeName) return setAnimeSearchScope([]);
      const AnimeNameToSearch = AnimeName.trim().toLowerCase();
      const ResultScope = AnimesHomePostersData.filter(({ title }) => {
        const AnimeTitle = title.trim().toLowerCase();
        return AnimeTitle.includes(AnimeNameToSearch);
      }).map(({ AnimeId }) => AnimeId.toString());

      setAnimeSearchScope(ResultScope);
    },
    [AnimesHomePostersData]
  );

  /* COMPONENT JSX */
  return (
    <div className="relative mt-5 flex flex-col items-center">
      <HomeHeader
        HomeDisplayType={HomeDisplayType}
        setHomeDisplayType={setHomeDisplayType}
        setAnimeSearchMode={setAnimeSearchMode}
      />
      {HomeDisplayType !== HomeDisplayTypeEnum.GROUP && (
        <SortByWatchType
          ActiveWatchType={ActiveWatchType}
          setActiveWatchType={setActiveWatchType}
        />
      )}

      {!AnimeSearchMode ? (
        <GroupFormInput
          IsModeGroup={!!(AnimesToAdd.length > 0)}
          AddGroup={AddGroup}
          HomeDisplayType={HomeDisplayType}
          SearchGroup={SearchGroup}
        />
      ) : undefined}
      {AnimeSearchMode && <AnimeSearchFormInput SearchAnime={SearchAnime} />}

      <div className="relative w-10/12">
        {HomeDisplayType === HomeDisplayTypeEnum.GROUP ? (
          <GroupComponent
            GroupRenderedElements={GroupRenderedElements}
            selectedGroupName={selectedGroupName}
            setSelectedGroup={setSelectedGroup}
            ToggleGroup={ToggleGroup}
            DeleteGroup={DeleteGroup}
          />
        ) : (
          <AnimePosterComponent AnimeRenderedElements={AnimeRenderedElements} />
        )}
      </div>
    </div>
  );
};

// [SUB-COMPONENTS]
function HomeHeader({
  HomeDisplayType,
  setHomeDisplayType,
  setAnimeSearchMode,
}: HomeHeaderProps) {
  return (
    <header className="mb-3 flex">
      <h1
        className={`${
          HomeDisplayType === HomeDisplayTypeEnum.GROUP && "text-description"
        } group hover:text-headline mr-2 cursor-pointer text-xl font-bold uppercase transition-all sm:text-2xl ${
          HomeDisplayType === HomeDisplayTypeEnum.ANIMES &&
          " decoration-primary-darker text-headline underline"
        }`}
        onClick={() =>
          HomeDisplayType === HomeDisplayTypeEnum.GROUP &&
          setHomeDisplayType(HomeDisplayTypeEnum.ANIMES)
        }
      >
        {HomeDisplayType === HomeDisplayTypeEnum.ANIMES && (
          <Fragment>
            <FaSearch
              onClick={() => setAnimeSearchMode((prev) => !prev)}
              className={`icon text-primary-whitest text-xl${
                DeviceCheckType() === "Mobile" ? "" : " hidden"
              } group-hover:inline`}
            />{" "}
          </Fragment>
        )}
        <span
          className={
            HomeDisplayType === HomeDisplayTypeEnum.ANIMES
              ? "text-primary-main"
              : ""
          }
        >
          Bookmark
        </span>
      </h1>
      <VerticalDivider />
      <h1
        className={`${
          HomeDisplayType === HomeDisplayTypeEnum.ANIMES && "text-description"
        } hover:text-headline ml-2 cursor-pointer text-xl font-bold uppercase transition-all sm:text-2xl ${
          HomeDisplayType === HomeDisplayTypeEnum.GROUP &&
          " decoration-primary-darker text-headline underline"
        }`}
        onClick={() =>
          HomeDisplayType === HomeDisplayTypeEnum.ANIMES &&
          setHomeDisplayType(HomeDisplayTypeEnum.GROUP)
        }
      >
        <span
          className={
            HomeDisplayType === HomeDisplayTypeEnum.GROUP
              ? "text-primary-main"
              : ""
          }
        >
          Collection
        </span>
      </h1>
    </header>
  );
}

function SortByWatchType({
  ActiveWatchType,
  setActiveWatchType,
}: SortByWatchTypeProps) {
  const { WATCHED, WATCHING, WANT_TO_WATCH, DROPPED, ALL, FAV } =
    AnimeWatchTypeDisplayable;

  return (
    <Dropdown className="mb-4">
      {[WATCHING, WATCHED, WANT_TO_WATCH, FAV, DROPPED, ALL].map(
        (CurrentActiveWatch, i) => (
          <a
            key={i}
            className={`hover:text-primary-main block cursor-pointer px-4 py-2 text-base transition-all${
              ActiveWatchType === CurrentActiveWatch ? " text-primary-main" : ""
            }`}
            role="menuitem"
            tabIndex={-1}
            id={`menu-item-${i}`}
            onClick={() =>
              ActiveWatchType !== CurrentActiveWatch &&
              setActiveWatchType(CurrentActiveWatch)
            }
          >
            {CurrentActiveWatch.replaceAll("_", " ")}
          </a>
        )
      )}
    </Dropdown>
  );
}

function GroupFormInput({
  IsModeGroup,
  HomeDisplayType,
  AddGroup,
  SearchGroup,
}: GroupFormInputProps) {
  const [InputGroupName, setInputGroupName] = useState("");
  const [GroupsMatch, setGroupMatch] = useState<string[]>(null);

  useEffect(() => {
    if (InputGroupName.trim().length < 3) return setGroupMatch(null);
    setGroupMatch(SearchGroup(InputGroupName));
  }, [InputGroupName, SearchGroup]);

  const HandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    InputGroupName.trim().length >= 3 && AddGroup(InputGroupName);
    InputGroupName.trim().length >= 3 && setInputGroupName("");
    InputGroupName.trim().length >= 3 ||
      toast.error("The Group Name must be minimum 3 characters long !");
  };

  return (
    IsModeGroup &&
    HomeDisplayType === HomeDisplayTypeEnum.ANIMES && (
      <Fragment>
        <HandleInput
          Value={InputGroupName}
          setValue={setInputGroupName}
          HandleSubmit={HandleSubmit}
          placeholder="Name of group (Already existing or not)"
        />
        {GroupsMatch && (
          <div
            className="text-primary-whitest z-10 mb-3 w-80 cursor-pointer rounded-md bg-slate-800 p-0.5 text-center font-semibold capitalize 
          outline-none sm:w-96 xl:absolute xl:top-8 xl:left-2"
          >
            {GroupsMatch.map((text) => (
              <p
                key={text}
                onClick={() => setInputGroupName(text)}
                className="hover:text-headline border-t-primary-darker mb-1 border-t transition-all"
              >
                {text}
              </p>
            ))}
          </div>
        )}
      </Fragment>
    )
  );
}
function AnimeSearchFormInput({ SearchAnime }: AnimeSearchFormInputProps) {
  const [InputAnimeName, setInputAnimeName] = useState("");

  useEffect(() => {
    return () => SearchAnime(null);
  }, [SearchAnime]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => DebounceAndSearch(), [InputAnimeName, SearchAnime]);

  const HandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const DebounceAndSearch = useCallback(
    debounce(() => {
      if (InputAnimeName.trim().length < 3) return SearchAnime(null);
      SearchAnime(InputAnimeName);
    }, 200),
    [InputAnimeName, SearchAnime]
  );

  return (
    <HandleInput
      Value={InputAnimeName}
      setValue={setInputAnimeName}
      HandleSubmit={HandleSubmit}
      placeholder="Name of anime 👀"
    />
  );
}

function AnimePosterComponent({
  AnimeRenderedElements,
}: AnimePosterComponentProps) {
  return (
    <div className="grid grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
      {AnimeRenderedElements?.length <= 0 ? (
        <span className="text-2xl font-bold text-red-300">💢 No Anime</span>
      ) : (
        AnimeRenderedElements
      )}
    </div>
  );
}

function GroupComponent({
  selectedGroupName,
  setSelectedGroup,
  GroupRenderedElements,
  ToggleGroup,
  DeleteGroup,
}: GroupComponentProps) {
  return (
    <Fragment>
      <div className="grid grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
        {GroupRenderedElements}
      </div>

      <div className="absolute top-0 left-1/2 w-9/12 -translate-x-1/2">
        {selectedGroupName?.name && (
          <div
            className="animate-fadeIn bg-bgi-darker flex cursor-pointer flex-col 
          rounded-lg bg-opacity-90 p-2"
          >
            <h1 className="text-headline text-center text-2xl font-bold capitalize">
              <span className="text-primary-main">
                {selectedGroupName.data.GroupName}
              </span>{" "}
              Group
            </h1>
            <button
              className="text-headline absolute top-0 right-2 text-4xl"
              onClick={() => setSelectedGroup(null)}
            >
              <AiFillCloseCircle className="icon" />
            </button>
            <button
              className="text-headline absolute top-0 left-2 text-3xl transition-all hover:text-red-500"
              title="Delete this group"
              onClick={() => DeleteGroup(selectedGroupName?.name)}
            >
              <FaTrashAlt className="icon" />
            </button>
            <div className="mt-3 grid grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {selectedGroupName.data.Animes.map((AnimeData, i) => (
                <AnimeItemPoster
                  key={AnimeData?.AnimeId || i}
                  AnimeData={AnimeData}
                  RenderType="groupList"
                  ToggleGroup={ToggleGroup}
                  NameOfGroup={selectedGroupName.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
}

// [DYNAMIC-COMPONENTS]
function AnimeItemPoster({
  AnimeData: { AnimeId, Fav, WatchType, photoURL, title, NewEpisodeAvailable },
  RenderType,
  IsAnimeToAdd,
  ToggleGroup,
  NameOfGroup,
}: HomeAnimeItemPosterProp) {
  const [CopyClicked, setCopyClicked] = useState(false);
  const ImageAlreadyFetchedOnce = useRef(false);
  const { WATCHED, WATCHING, DROPPED } = AnimeWatchType;
  const Color =
    WatchType === WATCHING
      ? "text-primary-whiter"
      : WatchType === WATCHED
      ? "text-green-500"
      : WatchType === DROPPED
      ? "text-red-500"
      : "text-primary-whitest";

  const AddToGroup = RenderType === "animeList" && (
    <div
      onClick={() => ToggleGroup(AnimeId.toString(), "ADD")}
      className="bg-bgi-darker absolute top-1 right-1 z-10 rounded-lg bg-opacity-70 px-2 py-1 text-lg font-semibold text-green-400"
      title="Add to collection"
    >
      <FaPlus className="icon" />
    </div>
  );
  const RemoveToGroup = (
    <div
      onClick={() => {
        if (RenderType === "groupList") {
          ToggleGroup(AnimeId.toString(), "DELETE_DB", NameOfGroup);
          return;
        }
        ToggleGroup(AnimeId.toString(), "DELETE");
      }}
      className="bg-bgi-darker absolute top-1 right-1 z-10 rounded-lg bg-opacity-70 px-2 py-1 text-lg font-semibold text-red-500"
    >
      <FaMinus className="icon" />
    </div>
  );

  return (
    <div
      className="group xl:min-h-80 min-h-72 bg-bgi-whiter shadow-bgi-whitest relative w-52 cursor-pointer rounded-lg 
    p-1 shadow transition-all delay-150 hover:scale-[1.025] xl:w-56"
    >
      <div>
        <div
          className={`absolute top-1 ${
            !!NewEpisodeAvailable ? "right-10" : "left-1"
          } text-headline bg-bgi-darker z-10 rounded-lg bg-opacity-70 px-2 py-1 text-xl font-semibold`}
          onClick={() => ToggleFav(AnimeId.toString(), Fav)}
        >
          {Fav ? (
            <AiFillStar className="icon text-yellow-500" />
          ) : (
            <AiOutlineStar className="icon text-yellow-500" />
          )}
        </div>
        {RenderType === "groupList"
          ? RemoveToGroup
          : IsAnimeToAdd
          ? RemoveToGroup
          : AddToGroup}
        <div
          onClick={() => {
            copyToClipboard(title);
            setCopyClicked(true);

            setTimeout(() => {
              setCopyClicked(false);
            }, 2000);
          }}
          className="text-headline bg-bgi-darker absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-lg bg-opacity-70 px-2 py-1 text-xl group-hover:block"
        >
          {CopyClicked ? <FcOk /> : <FaCopy className="icon" />}
        </div>
        {!!NewEpisodeAvailable && (
          <div className="text-headline bg-primary-darker absolute top-1 z-10 rounded-md px-3 py-1 font-bold tracking-wide">
            NEW
          </div>
        )}
      </div>

      <Link href={`/watch/${AnimeId}`}>
        <a>
          <Image
            src={photoURL}
            alt="PosterImg"
            height="132"
            width="100%"
            layout="responsive"
            className="rounded-lg object-cover"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNcwfC/HgAFJwIozPyfrQAAAABJRU5ErkJggg=="
            onError={() => {
              console.warn("Img Cannot be load");
              if (ImageAlreadyFetchedOnce.current) return;
              ImageAlreadyFetchedOnce.current = true;
              RevalidateAnime(AnimeId);
            }}
          />
          <h1
            className={`${Color} items-center truncate text-center text-xl font-bold capitalize`}
          >
            {title}
          </h1>
        </a>
      </Link>
    </div>
  );
}

function GroupItemPoster({
  GroupData,
  setSelectedGroup,
}: HomeGroupItemPosterProp) {
  const PreviewImg = ({ src }: { src: string }) => (
    <Image
      src={src}
      alt="Preview"
      width={30}
      height={30}
      layout="responsive"
      className="rounded-lg object-cover"
    />
  );

  return (
    <div
      className="bg-bgi-whiter grid h-80 w-52 cursor-pointer grid-rows-6 rounded-lg"
      onClick={() => {
        scrollTo(0, 80);
        setSelectedGroup({ name: GroupData.GroupName, data: GroupData });
      }}
    >
      <div className="row-span-5 grid grid-cols-2">
        {GroupData.Animes.slice(0, 2).map(({ photoURL }, i) => (
          <PreviewImg key={i} src={photoURL} />
        ))}
      </div>
      <h1 className="text-headline row-span-1 flex items-center justify-center text-xl font-bold capitalize">
        {GroupData.GroupName}
      </h1>
    </div>
  );
}

export default HomePoster;
