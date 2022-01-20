import { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import MetaTags from "../../../components/Common/Metatags";
import Divider from "../../../components/Design/Divider";
import {
  AdkamiLastReleasedEpisodeShape,
  ADKamiScrapperApiERROR,
} from "../../../lib/types/interface";
import {
  callApi,
  GetLastReleasedAnimeEp,
  Return404,
} from "../../../lib/utilityfunc";

/* INTERFACES */
interface LastEpPageProps {
  LastAnimeEpISR: AdkamiLastReleasedEpisodeShape[];
}
interface LastEpItemProps {
  EpisodeData: AdkamiLastReleasedEpisodeShape;
}

/* ISR */
export const getStaticProps: GetStaticProps = async () => {
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
        revalidate: 60,
      };

    return {
      props: {
        LastAnimeEpISR: (LastAnimeEp as AdkamiLastReleasedEpisodeShape[]).slice(
          0,
          60
        ),
      },
      revalidate: 3600,
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
    !LastAnimeEpISR && GetLastReleasedEpBrutForce();
  }, [LastAnimeEpISR]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => LoadEpisodes(), [LastAnimeEpData]);

  const LoadEpisodes = () => {
    if (!LastAnimeEpData) return;
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
    <div className="py-2 px-2">
      <MetaTags
        title="Last Released Episodes"
        description="All the Last 2days Released Anime Episodes in the world!"
      />
      <header>
        <h1 className="text-center text-primary-whiter font-bold text-5xl tracking-wide mb-4">
          Last Released <br />{" "}
          <span className="ml-40 font-semibold text-description-whiter">
            Anime Episodes
          </span>
        </h1>
        <Divider />
      </header>
      <div className="grid 2xl:grid-cols-6 xl:grid-cols-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2 text-headline">
        {RenderedEpisodes || "Nothing To Display :("}
      </div>
    </div>
  );
};

function LastReleasedEpItem({ EpisodeData }: LastEpItemProps) {
  const { title, Img, episodeId, TimeReleased, Team } = EpisodeData || {};
  return (
    <div>
      <div className="px-4 py-2 rounded-md text-center">
        <div className="flex justify-center">
          <div className="group relative w-[210px] h-[300px]">
            {/* <Image
              src={Img.split("?")[0]}
              alt="cover"
              width={210}
              height={300}
              className="opacity-95 hover:opacity-50 transition cursor-pointer rounded-lg"
            /> */}
            <div className="absolute top-0 left-1.5 font-semibold text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg">
              {Team}
            </div>
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-headline bg-bgi-darker 
            bg-opacity-80 px-1 py-2 rounded-lg"
            >
              {TimeReleased}
            </div>
          </div>
        </div>

        <h1 className="text-headline font-semibold cursor-pointer text-lg hover:text-gray-200 transition truncate">
          {title}
        </h1>
        <h2>{episodeId}</h2>
      </div>
    </div>
  );
}

export default LastEpPage;
