import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import debounce from "lodash.debounce";
import { GetStaticProps, NextPage } from "next";
// Types
import {
  callApi,
  IsError,
  JikanApiToSeasonAnimeShape,
  Return404,
  WhitchSeason,
} from "../../../lib/utils/UtilsFunc";
import {
  JikanApiERROR,
  JikanApiResSeason,
  JikanApiResSeasonRoot,
  SeasonAnimesShape,
} from "../../../lib/utils/types/interface";
import { TheFourSeason } from "../../../lib/utils/types/types";
import { TheFourSeasonEnum } from "../../../lib/utils/types/enums";
// UI
import { FaCalendarAlt, FaExternalLinkAlt, FaStar } from "react-icons/fa";
import Divider from "../../../components/Design/Divider";
import MetaTags from "../../../components/Common/Metatags";

/* Interface */
interface SeasonAnimesProps {
  seasonAnimesISR: JikanApiResSeason[];
}
interface SeasonAnimeItemProps {
  seasonAnimeData: SeasonAnimesShape;
}

/* ISR */
export const getStaticProps: GetStaticProps = async () => {
  try {
    const seasonAnime: JikanApiResSeasonRoot = await callApi({
      url: `https://api.jikan.moe/v4/seasons/upcoming`,
    });

    return {
      props: {
        seasonAnimesISR: IsError(seasonAnime as unknown as JikanApiERROR)
          ? []
          : seasonAnime.data.slice(0, 50),
      },
      revalidate: IsError(seasonAnime as unknown as JikanApiERROR) ? 60 : 900,
    };
  } catch (err) {
    console.error(err);
    return Return404(60);
  }
};

/* Components */
const SeasonAnimes: NextPage<SeasonAnimesProps> = ({ seasonAnimesISR }) => {
  const [SeasonAnimesData, setSeasonAnimes] = useState(() => seasonAnimesISR);
  const [RenderedSeasonAnime, setRenderedSeasonAnime] =
    useState<JSX.Element[]>();
  const [Season, setSeason] = useState(() => WhitchSeason());
  const [Year, setYear] = useState(() => {
    let y = new Date().getFullYear();
    const m = new Date().getMonth() + 1;
    const season = WhitchSeason();

    if (season === "winter" && m === 12) y++;
    return y.toString();
  });
  const SkipFirstCallbackInstance = useRef(true);
  const UpComingAnime = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => LoadSeasonAnime(), [SeasonAnimesData]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => CheckFinishChoosing(Year, Season), [Year, Season]);

  const LoadSeasonAnime = () => {
    if (!SeasonAnimesData) return;
    const ToSeasonAnimeShape = JikanApiToSeasonAnimeShape(SeasonAnimesData);
    const JSXElems = ToSeasonAnimeShape.map((seasonAnimeData, i) => (
      <SeasonAnimeItem key={i} seasonAnimeData={seasonAnimeData} />
    ));
    setRenderedSeasonAnime(JSXElems);
  };

  const GetSeason = async (year: string, season: TheFourSeason) => {
    try {
      UpComingAnime.current = false;
      const seasonAnimeFetch: JikanApiResSeasonRoot = await callApi({
        url: `https://api.jikan.moe/v4/seasons/${year}/${season}`,
      });
      if (IsError(seasonAnimeFetch as unknown as JikanApiERROR)) return;

      setSeasonAnimes(seasonAnimeFetch.data.slice(0, 50));
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const CheckFinishChoosing = useCallback(
    debounce((y: string, season: TheFourSeason) => {
      if (SkipFirstCallbackInstance.current) {
        SkipFirstCallbackInstance.current = false;
        return;
      }
      GetSeason(y, season);
    }, 2000),
    []
  );

  return (
    <div className="py-2 px-2">
      <MetaTags
        title="Season Animes"
        description="All the animes of the moment !"
      />
      <header className="relative">
        <Link href="/anime/season/last-released-episodes">
          <a>
            <button className="bg-primary-main text-headline rounded-lg p-2 text-center text-lg font-semibold lg:absolute">
              <FaExternalLinkAlt className="icon" /> Last Release
            </button>
          </a>
        </Link>

        <h1 className="text-headline text-center text-5xl font-semibold tracking-wide">
          {UpComingAnime.current ? (
            <Fragment>
              <span className="text-primary-main">Upcoming</span> Animes
            </Fragment>
          ) : (
            <Fragment>
              <span className="text-primary-main capitalize">{Season}</span>
              &apos;s <span className="text-primary-main"> {Year}</span> animes
            </Fragment>
          )}
        </h1>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-2 mb-4 flex justify-center"
        >
          <input
            type="number"
            value={Year}
            onChange={(e) => {
              const val = e.target.valueAsNumber;
              if (val < 1990 || isNaN(val)) return;
              setYear(val.toString());
            }}
            min="1990"
            className="bg-bgi-black text-headline focus:ring-primary-main mr-2 rounded-md py-2 px-1 text-center font-semibold shadow-lg outline-none
             transition focus:ring-2"
            placeholder="Year"
          />
          <select
            value={Season}
            onChange={(e) => setSeason(e.target.value as TheFourSeason)}
            placeholder="Season"
            className="bg-bgi-black text-headline focus:ring-primary-main w-52 rounded-md py-2 px-1 text-center font-semibold capitalize shadow-lg outline-none
             transition focus:ring-2"
          >
            <option value={TheFourSeasonEnum.SPRING}>
              {TheFourSeasonEnum.SPRING}
            </option>
            <option value={TheFourSeasonEnum.SUMMER}>
              {TheFourSeasonEnum.SUMMER}
            </option>
            <option value={TheFourSeasonEnum.FALL}>
              {TheFourSeasonEnum.FALL}
            </option>
            <option value={TheFourSeasonEnum.WINTER}>
              {TheFourSeasonEnum.WINTER}
            </option>
          </select>
        </form>
        <Divider />
      </header>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6">
        {RenderedSeasonAnime}
      </div>
    </div>
  );
};

function SeasonAnimeItem({ seasonAnimeData }: SeasonAnimeItemProps) {
  const { title, type, PhotoUrl, BeginAiring, score, MalId } =
    seasonAnimeData || {};

  return (
    <div className="rounded-md px-4 py-2 text-center">
      <Link href={`/anime/${MalId}`} passHref prefetch={false}>
        <a>
          <div className="flex justify-center">
            <div className="group relative w-56">
              <Image
                src={PhotoUrl}
                alt="cover"
                width={210}
                height={300}
                className="cursor-pointer rounded-lg opacity-95 transition hover:opacity-50"
              />
              <div className="text-headline bg-bgi-darker absolute top-0 left-1.5 rounded-lg bg-opacity-70 px-2 py-1 font-semibold">
                <FaStar className="icon text-yellow-500" /> {score || "None"}
              </div>
              <div className="text-headline bg-bgi-darker absolute top-0 right-1.5 rounded-lg bg-opacity-70 px-2 py-1 font-semibold">
                {type}
              </div>
              <div
                className="text-headline bg-bgi-darker absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg 
            bg-opacity-80 px-1 py-2 font-semibold"
              >
                <FaCalendarAlt className="icon text-primary-whiter" />{" "}
                {BeginAiring}
              </div>
            </div>
          </div>

          <h1 className="text-headline cursor-pointer truncate text-lg font-semibold transition hover:text-gray-200">
            {title}
          </h1>
        </a>
      </Link>
    </div>
  );
}

export default SeasonAnimes;
