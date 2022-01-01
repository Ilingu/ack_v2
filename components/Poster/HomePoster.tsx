import React, {
  FC,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
// Types
import { GlobalAppContext } from "../../lib/context";
import { AnimeWatchType, HomeDisplayTypeEnum } from "../../lib/types/enums";
import {
  UserAnimePosterShape,
  UserGroupPosterShape,
  UserGroupShape,
} from "../../lib/types/interface";
// Auth
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
// Func
import { shuffleArray } from "../../lib/utilityfunc";
import Image from "next/image";
// Icon
import { AiFillCloseCircle, AiFillStar, AiOutlineStar } from "react-icons/ai";
import Link from "next/link";

/* INTERFACE */
interface HomeAnimeItemPosterProp {
  AnimeData: UserAnimePosterShape;
  ToggleFav?: (AnimeId: string, currentVal: boolean) => Promise<void>;
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
}

/* COMPONENTS */
const HomePoster: FC = () => {
  const { UserAnimes, UserGroups, GlobalAnime, user } =
    useContext(GlobalAppContext);

  const [AnimeRenderedElements, setNewRenderForAnimes] =
    useState<JSX.Element[]>();
  const [GroupRenderedElements, setNewRenderForGroups] =
    useState<JSX.Element[]>();

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
          CurrentAnimes.splice(indexToDel, 1);
        }
      });
    }

    const AnimesPosterJSX = AnimesElementsOrder.current.map((animeId, i) => {
      const AnimeData = AnimesHomePostersData.find(
        ({ AnimeId }) => AnimeId.toString() === animeId
      );
      if (!AnimeData) return null;

      return (
        <AnimeItemPoster
          key={animeId || i}
          AnimeData={AnimeData}
          ToggleFav={ToggleFav}
        />
      );
    });

    setNewRenderForAnimes(AnimesPosterJSX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GlobalAnime, HomeDisplayType, UserAnimes, UserGroups]);

  const ToggleFav = useCallback(
    async (AnimeId: string, currentVal: boolean) => {
      const AnimeRef = doc(doc(db, "users", user.uid), "animes", AnimeId);
      await updateDoc(AnimeRef, {
        Fav: !currentVal,
      });
    },
    [user]
  );

  return (
    <div className="mt-5 flex flex-col items-center">
      <header className="mb-4 flex">
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
        <div className="h-full w-2 rounded-sm cursor-default translate-y-1 text-headline overflow-hidden bg-headline">
          TEXT
        </div>
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
      <div className="w-10/12">
        {HomeDisplayType === HomeDisplayTypeEnum.GROUP ? (
          <GroupComponent
            GroupRenderedElements={GroupRenderedElements}
            selectedGroupName={selectedGroupName}
            setSelectedGroup={setSelectedGroup}
          />
        ) : (
          <AnimePosterComponent AnimeRenderedElements={AnimeRenderedElements} />
        )}
      </div>
    </div>
  );
};

// [SUB-COMPONENTS]
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
  ToggleFav,
}: HomeAnimeItemPosterProp) {
  const { WATCHED, WATCHING } = AnimeWatchType;
  const Color =
    WatchType === WATCHING
      ? "text-primary-whiter"
      : WatchType === WATCHED
      ? "text-green-500"
      : "text-red-500";

  return (
    <div className="xl:w-56 xl:min-h-80 w-52 min-h-72 bg-bgi-whiter cursor-pointer rounded-lg p-1 relative">
      <div
        className="absolute top-1 left-1 font-semibold z-10 text-xl text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg"
        onClick={() => ToggleFav && ToggleFav(AnimeId.toString(), Fav)}
      >
        {Fav ? (
          <AiFillStar className="icon text-yellow-500" />
        ) : (
          <AiOutlineStar className="icon text-yellow-500" />
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
          />
          <h1
            className={`${Color} text-center text-xl font-bold capitalize flex justify-center items-center`}
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
  // eslint-disable-next-line @next/next/no-img-element
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
