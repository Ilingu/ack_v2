import { NextPage } from "next";
import { Fragment, useEffect, useRef, useState } from "react";
// Types/Func
import type {
  AdkamiLastReleasedEpisodeShape,
  ADKamiScrapperApiRes,
} from "../../../lib/utils/types/interface";
import { callApi } from "../../../lib/client/ClientFuncs";
// UI
import MetaTags from "../../../components/Services/Metatags";
import Divider from "../../../components/Design/Divider";
import Loader from "../../../components/Design/Loader";
import VerticalDivider from "../../../components/Design/VerticalDivider";
import { FaExternalLinkAlt } from "react-icons/fa";
import toast from "react-hot-toast";

/* INTERFACES */
interface LastEpItemProps {
  EpisodeData: PosterLastReleasedEpisodeShape;
}
type PosterLastReleasedEpisodeShape = Omit<
  AdkamiLastReleasedEpisodeShape,
  "Img"
>;

/* COMPONENTS */
const LastEpPage: NextPage = () => {
  const [LastAnimeEpData, setLastAnimeEp] =
    useState<AdkamiLastReleasedEpisodeShape[]>();

  const [RenderedEpisodes, setNewRender] = useState<JSX.Element[]>();
  const Mounted = useRef(false);

  useEffect(() => {
    if (Mounted.current) return;

    Mounted.current = true;
    GetLastReleasedEpBrutForce();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => LoadEpisodes(), [LastAnimeEpData]);

  const LoadEpisodes = () => {
    if (!LastAnimeEpData || LastAnimeEpData?.length <= 0) return;
    const JSXRenderedElement = LastAnimeEpData.map((epData, i) => (
      <LastReleasedEpItem key={i} EpisodeData={epData} />
    ));
    setNewRender(JSXRenderedElement);
  };

  const GetLastReleasedEpBrutForce = async () => {
    try {
      const {
        success,
        data: { success: fetchSucceed, data: LastEps },
      } = await callApi<ADKamiScrapperApiRes>(
        `https://adkami-scapping-api.up.railway.app/getLatestEps`
      );

      if (!success || !fetchSucceed || LastEps?.length <= 0)
        return toast.error("Cannot Load Ep List") as unknown as void;
      setLastAnimeEp(LastEps);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative py-2 px-2">
      <MetaTags
        title="Last Released Episodes"
        description="All the Last Released Anime Episodes in the world!"
      />
      <header>
        <p className="text-center font-semibold text-headline md:absolute md:top-2 md:left-2">
          Data Get From{" "}
          <a
            href="https://www.adkami.com/"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#71a7ff] transition-all hover:text-[#3b83f6] hover:underline hover:decoration-[#3b83f6]"
          >
            <FaExternalLinkAlt className="icon" /> ADKami
          </a>{" "}
        </p>
        <h1 className="mb-4 text-center text-4xl font-bold tracking-wide text-primary-whiter xs:text-5xl">
          Last Released <br />{" "}
          <span className="font-semibold text-description-whiter sm:ml-40">
            Anime Episodes
          </span>
        </h1>
        <Divider />
      </header>
      <div className="grid grid-cols-1 justify-items-center gap-2 py-5 text-headline">
        {RenderedEpisodes || (
          <div className="text-bold text-center text-xl text-headline">
            <Loader show /> Loading...
          </div>
        )}
      </div>
    </div>
  );
};

function LastReleasedEpItem({ EpisodeData }: LastEpItemProps) {
  const { Title, EpisodeId, TimeReleased, Team } = EpisodeData || {};
  const TransformEpId = () => {
    const EpisodesType = EpisodeId.includes("Episode");
    const OAVType = EpisodeId.includes("OAV");
    const SpecialType = EpisodeId.includes("Spécial");
    const MoovieType = EpisodeId.includes("Film");

    let result = EpisodeId;
    let WordToInject = "";
    let NumberToInject = "";

    if (EpisodesType) {
      const EpId = result.split("Episode ")[1].split(" ")[0];
      WordToInject = "Episode";
      NumberToInject = `N°${EpId}`;
      result = result.split("Episode ")[1].split(" ").slice(1).join(" ");
    }

    if (OAVType || SpecialType || MoovieType) {
      const SeparateVal = result.split(" ");

      WordToInject = SeparateVal[0];
      NumberToInject = `N°${SeparateVal[1]}`;
      result = result
        .split(`${OAVType ? "OAV" : SpecialType ? "Spécial" : "Film"}`)[1]
        .split(" ")
        .slice(2)
        .join(" ");
    }

    result = result.replaceAll("vostfr", "").replaceAll("vf", "");
    result = result.split(" ")[0].trim();

    return (
      <Fragment>
        <span className="font-semibold text-headline">{WordToInject}</span>{" "}
        <span className="font-bold text-primary-whiter underline">
          {NumberToInject}
        </span>{" "}
        {result}
      </Fragment>
    );
  };

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-2 rounded-lg bg-bgi-darker py-2 shadow-md shadow-bgi-black
     transition-all hover:shadow-inner md:w-4/5"
    >
      <div className="flex flex-col items-center justify-center gap-x-3 sm:flex-row">
        <h1
          className="cursor-pointer truncate text-xl font-semibold text-primary-whiter transition hover:text-gray-200"
          title={Title}
        >
          {Title.slice(0, 30)}
        </h1>
        <VerticalDivider Styling="sm:block hidden" />
        <h2 className="hidden text-lg text-description sm:block">
          {TransformEpId()}
        </h2>
      </div>
      <div className="flex items-center justify-center gap-x-3">
        <h2 className=" block text-description sm:hidden">{TransformEpId()}</h2>
        <p>{Team}</p>
        <p className="text-description-whiter">
          {TimeReleased.replaceAll("-", "/").split(" ")[0]}
        </p>
      </div>
    </div>
  );
}

export default LastEpPage;
