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
import {
  UserAnimePosterShape,
  UserGroupPosterShape,
  UserGroupShape,
} from "../../lib/utils/types/interface";
// Auth
import {
  deleteField,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
// Func
import {
  copyToClipboard,
  GetAnimeData,
  removeDuplicates,
  shuffleArray,
  ToggleFav,
} from "../../lib/utils/UtilsFunc";
// UI
import { AiFillCloseCircle, AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaCopy, FaMinus, FaPlus, FaSearch } from "react-icons/fa";
import { FcOk } from "react-icons/fc";
import toast from "react-hot-toast";
import VerticalDivider from "../Design/VerticalDivider";
import HandleInput from "./HandleInput";

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
  IsModeGroup: boolean;
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
  const filterUserAnime = useCallback(
    () =>
      UserAnimes?.filter(
        ({ WatchType }) =>
          WatchType !== AnimeWatchType.WONT_WATCH &&
          WatchType !== AnimeWatchType.UNWATCHED
      ),
    [UserAnimes]
  );

  const AnimesHomePostersData: UserAnimePosterShape[] = useMemo(
    () =>
      filterUserAnime()
        ?.map(
          ({
            AnimeId,
            Fav,
            WatchType,
            NewEpisodeAvailable,
            NextEpisodeReleaseDate,
          }) => {
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
    [GlobalAnime, filterUserAnime]
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
      const AllAnimesId = filterUserAnime().map(({ AnimeId }) =>
        AnimeId.toString()
      );

      const AnimesOrder = shuffleArray(AllAnimesId);
      AnimesElementsOrder.current = AnimesOrder;
    }
    if (filterUserAnime().length !== AnimesElementsOrder.current.length) {
      const AllRealAnime = filterUserAnime();

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

  const SearchGroup = useCallback(
    (GrName: string) =>
      UserGroups.filter(({ GroupName }) => {
        const GrNameToSearch = encodeURI(kebabCase(GrName));
        return GroupName.includes(GrNameToSearch);
      }).map(({ GroupName }) => GroupName),
    [UserGroups]
  );

  /* Other Func */
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
    <div className="mt-5 flex flex-col items-center relative">
      <HomeHeader
        HomeDisplayType={HomeDisplayType}
        setHomeDisplayType={setHomeDisplayType}
        setAnimeSearchMode={setAnimeSearchMode}
      />
      {HomeDisplayType !== HomeDisplayTypeEnum.GROUP && (
        <SortByWatchType
          IsModeGroup={!!(AnimesToAdd.length > 0)}
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

      <div className="w-10/12 relative">
        {HomeDisplayType === HomeDisplayTypeEnum.GROUP ? (
          <GroupComponent
            GroupRenderedElements={GroupRenderedElements}
            selectedGroupName={selectedGroupName}
            setSelectedGroup={setSelectedGroup}
            ToggleGroup={ToggleGroup}
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
        } group font-bold sm:text-2xl text-xl cursor-pointer hover:text-headline transition-all uppercase mr-2 ${
          HomeDisplayType === HomeDisplayTypeEnum.ANIMES &&
          " underline decoration-primary-darker text-headline"
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
                window.mobileAndTabletCheck() ? "" : " hidden"
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
          Animes
        </span>{" "}
        Folder
      </h1>
      <VerticalDivider />
      <h1
        className={`${
          HomeDisplayType === HomeDisplayTypeEnum.ANIMES && "text-description"
        } font-bold sm:text-2xl text-xl cursor-pointer hover:text-headline transition-all uppercase ml-2 ${
          HomeDisplayType === HomeDisplayTypeEnum.GROUP &&
          " underline decoration-primary-darker text-headline"
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
          Group
        </span>{" "}
        Folder
      </h1>
    </header>
  );
}

function SortByWatchType({
  IsModeGroup,
  ActiveWatchType,
  setActiveWatchType,
}: SortByWatchTypeProps) {
  const { WATCHED, WATCHING, WANT_TO_WATCH, DROPPED, ALL, FAV } =
    AnimeWatchTypeDisplayable;

  return (
    <div
      className={`flex flex-wrap justify-center gap-4 text-headline text-lg font-semibold cursor-pointer capitalize ${
        IsModeGroup ? "mb-2" : "mb-4"
      }`}
    >
      {[WATCHING, WATCHED, WANT_TO_WATCH, FAV, DROPPED, ALL].map(
        (CurrentActiveWatch, i) => (
          <Fragment key={i}>
            <span
              onClick={() =>
                ActiveWatchType !== CurrentActiveWatch &&
                setActiveWatchType(CurrentActiveWatch)
              }
              className={`hover:text-primary-main transition-all${
                ActiveWatchType === CurrentActiveWatch
                  ? " text-primary-whiter"
                  : ""
              }`}
            >
              {CurrentActiveWatch.replaceAll("_", " ")}
            </span>
            {i !== 5 && <VerticalDivider />}
          </Fragment>
        )
      )}
    </div>
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
            className="xl:absolute xl:top-8 xl:left-2 z-10 rounded-md p-0.5 sm:w-96 w-80 text-center font-semibold text-primary-whitest 
          outline-none bg-slate-800 capitalize mb-3 cursor-pointer"
          >
            {GroupsMatch.map((text) => (
              <p
                key={text}
                onClick={() => setInputGroupName(text)}
                className="hover:text-headline transition-all mb-1 border-t border-t-primary-darker"
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
    <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3 justify-items-center">
      {AnimeRenderedElements?.length <= 0 ? (
        <span className="font-bold text-2xl text-red-300">💢 No Anime</span>
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
}: GroupComponentProps) {
  return (
    <Fragment>
      <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3 justify-items-center">
        {GroupRenderedElements}
      </div>

      <div className="absolute top-0 w-9/12 left-1/2 -translate-x-1/2">
        {selectedGroupName?.name && (
          <div
            className="flex flex-col animate-fadeIn p-2 bg-bgi-darker 
          bg-opacity-90 cursor-pointer rounded-lg"
          >
            <h1 className="text-headline font-bold text-2xl capitalize text-center">
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
            <div className="grid 2xl:grid-cols-4 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-3 justify-items-center mt-3">
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
      className="absolute top-1 right-1 font-semibold z-10 text-lg text-green-400 bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg"
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
      className="absolute top-1 right-1 font-semibold z-10 text-lg text-red-500 bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg"
    >
      <FaMinus className="icon" />
    </div>
  );

  return (
    <div className="group xl:w-56 xl:min-h-80 w-52 min-h-72 bg-bgi-whiter cursor-pointer rounded-lg p-1 relative">
      <div>
        <div
          className={`absolute top-1 ${
            !!NewEpisodeAvailable ? "right-10" : "left-1"
          } font-semibold z-10 text-xl text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg`}
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
          className="group-hover:block absolute hidden bottom-5 left-1/2 z-10 text-xl -translate-x-1/2 -translate-y-1/2 text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg"
        >
          {CopyClicked ? <FcOk /> : <FaCopy className="icon" />}
        </div>
        {!!NewEpisodeAvailable && (
          <div className="absolute top-1 z-10 tracking-wide font-bold text-headline bg-primary-darker px-3 py-1 rounded-md">
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
              GetAnimeData(AnimeId.toString(), true);
            }}
          />
          <h1
            className={`${Color} text-center text-xl font-bold capitalize items-center truncate`}
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
      className="object-cover rounded-lg"
    />
  );

  return (
    <div
      className="w-52 h-80 bg-bgi-whiter grid grid-rows-6 cursor-pointer rounded-lg"
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
      <h1 className="text-headline font-bold text-xl capitalize row-span-1 flex justify-center items-center">
        {GroupData.GroupName}
      </h1>
    </div>
  );
}

export default HomePoster;
