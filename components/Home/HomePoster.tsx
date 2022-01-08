import React, {
  FC,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import kebabCase from "lodash.kebabcase";
// Types
import { GlobalAppContext } from "../../lib/context";
import { AnimeWatchType, HomeDisplayTypeEnum } from "../../lib/types/enums";
import {
  UserAnimePosterShape,
  UserGroupPosterShape,
  UserGroupShape,
} from "../../lib/types/interface";
// Auth
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
// Func
import {
  copyToClipboard,
  removeDuplicates,
  shuffleArray,
  ToggleFav,
} from "../../lib/utilityfunc";
import Image from "next/image";
// Icon
import { AiFillCloseCircle, AiFillStar, AiOutlineStar } from "react-icons/ai";
import Link from "next/link";
import { FaCheck, FaCopy, FaMinus, FaPlus } from "react-icons/fa";
import toast from "react-hot-toast";
import { FcOk } from "react-icons/fc";

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
  IsModeGroup: boolean;
  HomeDisplayType: HomeDisplayTypeEnum;
  setHomeDisplayType: React.Dispatch<React.SetStateAction<HomeDisplayTypeEnum>>;
}
interface GroupFormInputProps {
  IsModeGroup: boolean;
  HomeDisplayType: HomeDisplayTypeEnum;
  AddGroup: (GrName: string) => void;
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

/* COMPONENTS */
const HomePoster: FC = () => {
  const { UserAnimes, UserGroups, GlobalAnime, user } =
    useContext(GlobalAppContext);

  const [AnimeRenderedElements, setNewRenderForAnimes] =
    useState<JSX.Element[]>();
  const [GroupRenderedElements, setNewRenderForGroups] =
    useState<JSX.Element[]>();

  const [AnimesToAdd, setAnimeToAdd] = useState<string[]>([]);

  const AnimesElementsOrder = useRef<string[]>();
  const GroupsElementsOrder = useRef<string[]>();

  const [HomeDisplayType, setHomeDisplayType] = useState<HomeDisplayTypeEnum>(
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

  useEffect(() => {
    localStorage.setItem("HomeDisplayType", JSON.stringify(HomeDisplayType));
  }, [HomeDisplayType]);

  useEffect(() => {
    if (!GlobalAnime || !UserAnimes || !UserGroups) return;

    const filterUserAnime = () =>
      UserAnimes.filter(
        ({ WatchType }) =>
          WatchType !== AnimeWatchType.WONT_WATCH &&
          WatchType !== AnimeWatchType.WANT_TO_WATCH &&
          WatchType !== AnimeWatchType.UNWATCHED
      );

    const AnimesHomePostersData: UserAnimePosterShape[] = filterUserAnime()
      .map(({ AnimeId, Fav, WatchType }) => {
        const AnimeData = GlobalAnime.find(({ malId }) => malId === AnimeId);
        if (!AnimeData) return null;

        return {
          AnimeId,
          Fav,
          WatchType,
          title: AnimeData.title,
          photoURL: AnimeData.photoPath,
          type: AnimeData.type,
        };
      })
      .filter((UAP) => UAP);

    // Group Render
    if (HomeDisplayType === HomeDisplayTypeEnum.GROUP) {
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
          if (!ToObjCA[GroupName])
            GroupsElementsOrder.current.unshift(GroupName);
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
      return;
    }

    // Animes Render
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

    const AnimesPosterJSX = AnimesElementsOrder.current.map((animeId, i) => {
      const AnimeData = AnimesHomePostersData.find(
        ({ AnimeId }) => AnimeId.toString() === animeId
      );
      if (!AnimeData) return null;

      return (
        <AnimeItemPoster
          key={animeId || i}
          AnimeData={AnimeData}
          RenderType="animeList"
          IsAnimeToAdd={AnimesToAddToObj && !!AnimesToAddToObj[animeId]}
          ToggleGroup={ToggleGroup}
        />
      );
    });

    setNewRenderForAnimes(AnimesPosterJSX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GlobalAnime, HomeDisplayType, UserAnimes, UserGroups, AnimesToAdd]);

  const ToggleGroup = useCallback(
    (id: string, method: "ADD" | "DELETE" | "DELETE_DB", GrName?: string) => {
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
          updateDoc(GroupRef, {
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
          updateDoc(GroupRef, {
            GroupAnimesId: removeDuplicates([...GroupAnimesId, ...AnimesToAdd]),
          });
        } else
          setDoc(GroupRef, {
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

  return (
    <div className="mt-5 flex flex-col items-center">
      <HomeHeader
        IsModeGroup={!!(AnimesToAdd.length > 0)}
        HomeDisplayType={HomeDisplayType}
        setHomeDisplayType={setHomeDisplayType}
      />
      <GroupFormInput
        IsModeGroup={!!(AnimesToAdd.length > 0)}
        AddGroup={AddGroup}
        HomeDisplayType={HomeDisplayType}
      />
      <div className="w-10/12">
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
  IsModeGroup,
  HomeDisplayType,
  setHomeDisplayType,
}: HomeHeaderProps) {
  return (
    <header className={`${IsModeGroup ? "mb-2" : "mb-4"} flex`}>
      <h1
        className={`${
          HomeDisplayType === HomeDisplayTypeEnum.GROUP && "text-description"
        } font-bold sm:text-2xl text-xl cursor-pointer hover:text-headline transition-all uppercase mr-2 ${
          HomeDisplayType === HomeDisplayTypeEnum.ANIMES &&
          " underline decoration-primary-darker text-headline"
        }`}
        onClick={() =>
          HomeDisplayType === HomeDisplayTypeEnum.GROUP &&
          setHomeDisplayType(HomeDisplayTypeEnum.ANIMES)
        }
      >
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
      <div className="h-full w-2 rounded-sm cursor-default translate-y-1 py-3 text-headline overflow-hidden bg-headline"></div>
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

function GroupFormInput({
  IsModeGroup,
  HomeDisplayType,
  AddGroup,
}: GroupFormInputProps) {
  const [InputGroupName, setInputGroupName] = useState("");

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
      <form className="mb-4 mt-2" onSubmit={HandleSubmit}>
        <input
          type="text"
          value={InputGroupName}
          onChange={(e) => setInputGroupName(e.target.value)}
          className="bg-black sm:text-lg rounded-l-md py-2 sm:w-96 w-80 text-center font-semibold text-headline outline-none focus:ring-2 focus:ring-primary-main transition-all"
          placeholder="Name of group (Already existing or not)"
        />
        <button
          type="submit"
          className="bg-black h-11 py-2 px-2 rounded-r-md -translate-y-px font-semibold text-headline outline-none focus:ring-2 focus:ring-primary-main transition-all"
        >
          <FaCheck className="icon" />
        </button>
      </form>
    )
  );
}

function AnimePosterComponent({
  AnimeRenderedElements,
}: AnimePosterComponentProps) {
  return (
    <div className="grid 2xl:grid-cols-5 xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3 justify-items-center">
      {AnimeRenderedElements}
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

      <div className="flex justify-center items-center">
        {selectedGroupName?.name && (
          <div className="animate-fadeIn md:w-1/2 w-10/12 p-2 absolute bg-bgi-darker bg-opacity-90 cursor-pointer rounded-lg">
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
            <div className="grid 2xl:grid-cols-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-3 justify-items-center mt-3">
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
  AnimeData: { AnimeId, Fav, WatchType, photoURL, title },
  RenderType,
  IsAnimeToAdd,
  ToggleGroup,
  NameOfGroup,
}: HomeAnimeItemPosterProp) {
  const [CopyClicked, setCopyClicked] = useState(false);
  const { WATCHED, WATCHING } = AnimeWatchType;
  const Color =
    WatchType === WATCHING
      ? "text-primary-whiter"
      : WatchType === WATCHED
      ? "text-green-500"
      : "text-red-500";

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
          className="absolute top-1 left-1 font-semibold z-10 text-xl text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg"
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
      onClick={() =>
        setSelectedGroup({ name: GroupData.GroupName, data: GroupData })
      }
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
