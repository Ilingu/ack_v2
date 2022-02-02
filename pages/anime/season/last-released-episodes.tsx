import { GetServerSideProps, NextPage } from "next";
import { Fragment, useEffect, useState } from "react";
// Types/Func
import {
  AdkamiLastReleasedEpisodeShape,
  ADKamiScrapperApiERROR,
} from "../../../lib/utils/types/interface";
import {
  callApi,
  GetLastReleasedAnimeEp,
  Return404,
} from "../../../lib/utils/UtilsFunc";
// UI
import MetaTags from "../../../components/Common/Metatags";
import Divider from "../../../components/Design/Divider";
import Loader from "../../../components/Design/Loader";
import VerticalDivider from "../../../components/Design/VerticalDivider";
import { FaExternalLinkAlt } from "react-icons/fa";

/* INTERFACES */
interface LastEpPageProps {
  LastAnimeEpISR: AdkamiLastReleasedEpisodeShape[];
}
interface LastEpItemProps {
  EpisodeData: PosterLastReleasedEpisodeShape;
}
type PosterLastReleasedEpisodeShape = Omit<
  AdkamiLastReleasedEpisodeShape,
  "Img"
>;

/* SSR */
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const LastAnimeEp:
      | AdkamiLastReleasedEpisodeShape[]
      | ADKamiScrapperApiERROR = await callApi(
      `https://adkami-scapping-api.herokuapp.com/last`
    );
    if (!LastAnimeEp || (LastAnimeEp as ADKamiScrapperApiERROR)?.statusCode)
      return {
        props: {
          LastAnimeEpISR: null,
        },
      };

    return {
      props: {
        LastAnimeEpISR: (LastAnimeEp as AdkamiLastReleasedEpisodeShape[]).slice(
          0,
          60
        ),
      },
    };
  } catch (err) {
    console.error(err);
    return Return404();
  }
};

/* COMPONENTS */
const LastEpPage: NextPage<LastEpPageProps> = ({ LastAnimeEpISR }) => {
  const [LastAnimeEpData, setLastAnimeEp] = useState<
    AdkamiLastReleasedEpisodeShape[]
  >(() => LastAnimeEpISR);

  const [RenderedEpisodes, setNewRender] = useState<JSX.Element[]>();

  useEffect(() => {
    if (!LastAnimeEpISR || LastAnimeEpISR?.length <= 0)
      GetLastReleasedEpBrutForce();
  }, [LastAnimeEpISR]);

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
      const newData = await GetLastReleasedAnimeEp();
      setLastAnimeEp(newData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-2 px-2 relative">
      <MetaTags
        title="Last Released Episodes"
        description="All the Last 2days Released Anime Episodes in the world!"
      />
      <header>
        <p className="md:absolute md:top-2 md:left-2 text-center text-headline font-semibold">
          Data Get From{" "}
          <a
            href="https://www.adkami.com/"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#71a7ff] hover:text-[#3b83f6] transition-all hover:underline hover:decoration-[#3b83f6]"
          >
            <FaExternalLinkAlt className="icon" /> ADKami
          </a>{" "}
        </p>
        <h1 className="text-center text-primary-whiter font-bold xs:text-5xl text-4xl tracking-wide mb-4">
          Last Released <br />{" "}
          <span className="sm:ml-40 font-semibold text-description-whiter">
            Anime Episodes
          </span>
        </h1>
        <Divider />
      </header>
      <div className="grid grid-cols-1 justify-items-center gap-2 text-headline py-5">
        {RenderedEpisodes || (
          <div className="text-xl text-headline text-bold text-center">
            <Loader show /> Loading...
          </div>
        )}
      </div>
    </div>
  );
};

function LastReleasedEpItem({ EpisodeData }: LastEpItemProps) {
  const { title, episodeId, TimeReleased, Team } = EpisodeData || {};
  const TransformEpId = () => {
    const EpisodesType = episodeId.includes("Episode");
    const OAVType = episodeId.includes("OAV");
    const SpecialType = episodeId.includes("Spécial");
    const MoovieType = episodeId.includes("Film");

    let result = episodeId;
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
      className="md:w-4/5 w-full flex flex-col justify-center items-center gap-2 bg-bgi-darker py-2 rounded-lg shadow-md
     shadow-bgi-black hover:shadow-inner transition-all"
    >
      <div className="flex sm:flex-row flex-col justify-center items-center gap-x-3">
        <h1
          className="text-primary-whiter font-semibold cursor-pointer text-xl hover:text-gray-200 transition truncate"
          title={title}
        >
          {title.slice(0, 30)}
        </h1>
        <VerticalDivider Styling="sm:block hidden" />
        <h2 className="text-lg text-description sm:block hidden">
          {TransformEpId()}
        </h2>
      </div>
      <div className="flex justify-center items-center gap-x-3">
        <h2 className=" text-description sm:hidden block">{TransformEpId()}</h2>
        <p>{Team}</p>
        <p className="text-description-whiter">
          {TimeReleased.replaceAll("-", "/").split(" ")[0]}
        </p>
      </div>
    </div>
  );
}

export default LastEpPage;
