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
      ({ AnimeId, Fav, PersonnalRate, WatchType }) => {
        const { title, photoPath, type } = GlobalAnime.find(
          ({ malId }) => malId === AnimeId
        );

        return {
          AnimeId,
          Fav,
          PersonnalRate,
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
            let Pass = true;
            GroupAnimesId.forEach((GroupAnimeId) => {
              if (AnimeId.toString() !== GroupAnimeId) Pass = false;
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
    <div className="mt-5 flex justify-center">
      <div className="w-11/12">
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
  return <div className="grid grid-cols-5">{AnimeRenderedElements}</div>;
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
              <motion.div className="grid grid-cols-3">
                {selectedGroupName.data.Animes.map((AnimeData, i) => (
                  <AnimeItemPoster
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
function AnimeItemPoster({ AnimeData }: HomeAnimeItemPosterProp) {
  console.log(AnimeData);
  return <div></div>;
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
      className="object-cover rounded-tl-lg rounded-bl-lg"
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
