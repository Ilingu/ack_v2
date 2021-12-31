import React, {
  FC,
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
// UI
import { AnimatePresence, motion } from "framer-motion";
// Types
import { GlobalAppContext } from "../../lib/context";
import { HomeDisplayTypeEnum } from "../../lib/types/enums";
import {
  UserAnimePosterShape,
  UserGroupPosterShape,
  UserGroupShape,
} from "../../lib/types/interface";
// Func
import { shuffleArray } from "../../lib/utilityfunc";
import Image from "next/image";
// Icon
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

/* INTERFACE */
interface HomeAnimeItemPosterProp {
  AnimeData: UserAnimePosterShape;
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
  const { UserAnimes, UserGroups, GlobalAnime } = useContext(GlobalAppContext);

  const [AnimeRenderedElements, setNewRenderForAnimes] =
    useState<JSX.Element[]>();
  const [GroupRenderedElements, setNewRenderForGroups] =
    useState<JSX.Element[]>();

  const AnimesElementsOrder = useRef<string[]>();
  const GroupsElementsOrder = useRef<string[]>();

  const [HomeDisplayType, setHomeDisplayType] = useState<HomeDisplayTypeEnum>(
    HomeDisplayTypeEnum.GROUP
  ); // LocalStorage

  // Group
  const [selectedGroupName, setSelectedGroup] = useState<{
    name: string;
    data: UserGroupPosterShape;
  }>({
    name: null,
    data: null,
  });

  useEffect(() => {
    if (!GlobalAnime || !UserAnimes || !UserGroups) return;

    const AnimesHomePostersData: UserAnimePosterShape[] = UserAnimes.map(
      ({ AnimeId, Fav, WatchType }) => {
        const { title, photoPath, type } = GlobalAnime.find(
          ({ malId }) => malId === AnimeId
        );

        return {
          AnimeId,
          Fav,
          WatchType,
          title,
          photoURL: photoPath,
          type,
        };
      }
    );

    // Group Render
    if (HomeDisplayType === HomeDisplayTypeEnum.GROUP) {
      const AnimesGroupId: string[] = UserGroups.map(
        ({ GroupName }) => GroupName
      );

      // Shuffle Array -> Order
      if (!GroupsElementsOrder.current) {
        const GroupsOrder = shuffleArray(AnimesGroupId);
        GroupsElementsOrder.current = GroupsOrder;
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
    const AllAnimesId = UserAnimes.map(({ AnimeId }) => AnimeId.toString());

    // Shuffle Array -> Order
    if (!AnimesElementsOrder.current) {
      const AnimesOrder = shuffleArray(AllAnimesId);
      AnimesElementsOrder.current = AnimesOrder;
    }

    const AnimesPosterJSX = AnimesElementsOrder.current.map((animeId, i) => {
      const AnimeData = AnimesHomePostersData.find(
        ({ AnimeId }) => AnimeId.toString() === animeId
      );

      return <AnimeItemPoster key={animeId || i} AnimeData={AnimeData} />;
    });

    setNewRenderForAnimes(AnimesPosterJSX);
  }, [GlobalAnime, HomeDisplayType, UserAnimes, UserGroups]);

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
              HomeDisplayType === HomeDisplayTypeEnum.ANIMES &&
              "text-primary-main"
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
              HomeDisplayType === HomeDisplayTypeEnum.GROUP &&
              "text-primary-main"
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
      <div className="grid grid-cols-5">{GroupRenderedElements}</div>

      <div className="flex justify-center items-center">
        <AnimatePresence>
          {selectedGroupName?.name && (
            <motion.div
              layoutId={selectedGroupName.name}
              animate={{ scale: 1.5 }}
              className="w-1/2 h-96 absolute -translate-x-1/2 -translate-y-1/2 bg-bgi-darker cursor-pointer rounded-lg"
              onClick={() => setSelectedGroup(null)}
            >
              <motion.h1 className="text-headline font-bold text-2xl capitalize text-center">
                <motion.span className="text-primary-main">
                  {selectedGroupName.data.GroupName}
                </motion.span>{" "}
                Group
              </motion.h1>
              <motion.div className="grid grid-cols-4 justify-items-center mt-3">
                {selectedGroupName.data.Animes.map((AnimeData, i) => (
                  <AnimeGroupItemPoster
                    key={AnimeData?.AnimeId || i}
                    AnimeData={AnimeData}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Fragment>
  );
}

// [DYNAMIC-COMPONENTS]
function AnimeGroupItemPoster({ AnimeData }: HomeAnimeItemPosterProp) {
  return (
    <div className="w-36 h-56 bg-bgi-whiter grid grid-rows-6 cursor-pointer rounded-lg p-1">
      <div className="row-span-5">
        <Image
          src={AnimeData.photoURL}
          alt="PosterImg"
          height="125"
          width="100%"
          layout="responsive"
          className="rounded-lg object-cover"
        />
      </div>
      <h1 className="text-headline text-center text-sm font-semibold capitalize row-span-1 flex justify-center items-center">
        {AnimeData.title}
      </h1>
    </div>
  );
}

function AnimeItemPoster({ AnimeData }: HomeAnimeItemPosterProp) {
  return (
    <div className="xl:w-56 xl:min-h-80 w-52 min-h-72 bg-bgi-whiter cursor-pointer rounded-lg p-1 relative">
      <div>
        <div className="absolute top-1 left-1 font-semibold z-10 text-xl text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg">
          {/* <AiFillStar className="icon text-yellow-500" /> */}
          <AiOutlineStar className="icon text-yellow-500" />
        </div>
      </div>
      <Image
        src={AnimeData.photoURL}
        alt="PosterImg"
        height="132"
        width="100%"
        layout="responsive"
        className="rounded-lg object-cover"
      />
      <h1 className="text-primary-whiter text-center text-xl font-bold capitalize flex justify-center items-center">
        {AnimeData.title}
      </h1>
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
    <motion.div
      layoutId={GroupData.GroupName}
      className="w-52 h-80 bg-bgi-whiter grid grid-rows-6 cursor-pointer rounded-lg"
      onClick={() =>
        setSelectedGroup({ name: GroupData.GroupName, data: GroupData })
      }
    >
      <motion.div className="row-span-5 grid grid-cols-2">
        {GroupData.Animes.slice(0, 2).map(({ photoURL }, i) => (
          <PreviewImg key={i} src={photoURL} />
        ))}
      </motion.div>
      <motion.h1 className="text-headline font-bold text-2xl capitalize row-span-1 flex items-center">
        {GroupData.GroupName}
      </motion.h1>
    </motion.div>
  );
}

export default HomePoster;
