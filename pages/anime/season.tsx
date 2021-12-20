import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import debounce from "lodash.debounce";
import { GetStaticProps, NextPage } from "next";
// Types
import {
  callApi,
  JikanApiToSeasonAnimeShape,
  Return404,
  WhitchSeason,
} from "../../lib/utilityfunc";
import {
  JikanApiResSeasonAnime,
  JikanApiResSeasonRoot,
  SeasonAnimesShape,
} from "../../lib/types/interface";
import { TheFourSeason } from "../../lib/types/types";
import { TheFourSeasonEnum } from "../../lib/types/enums";
// UI
import { FaCalendarAlt, FaStar } from "react-icons/fa";
import Divider from "../../components/Design/Divider";
import MetaTags from "../../components/Common/Metatags";

/* Interface */
interface SeasonAnimesProps {
  seasonAnimesISR: JikanApiResSeasonAnime[];
}
interface SeasonAnimeItemProps {
  seasonAnimeData: SeasonAnimesShape;
}

/* ISR */
export const getStaticProps: GetStaticProps = async () => {
  try {
    const seasonAnime = (await callApi(
      `https://api.jikan.moe/v3/season`
    )) as JikanApiResSeasonRoot;
    if (seasonAnime.status === 404) return Return404();

    return {
      props: { seasonAnimesISR: seasonAnime.anime.slice(0, 50) },
      revalidate: 86400,
    };
  } catch (err) {
    return Return404();
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
      const seasonAnimeFetch = (await callApi(
        `https://api.jikan.moe/v3/season/${year}/${season}`
      )) as JikanApiResSeasonRoot;
      if (seasonAnimeFetch.status === 404) return;
      setSeasonAnimes(seasonAnimeFetch.anime.slice(0, 50));
    } catch (err) {
      return;
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
      <header>
        <h1 className="text-center text-headline font-semibold text-5xl tracking-wide">
          <span className="text-primary-main capitalize">{Season}</span>&apos;s
          <span className="text-primary-main"> {Year}</span> animes
        </h1>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex justify-center mt-2 mb-4"
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
            className="py-2 px-1 mr-2 rounded-md bg-bgi-black shadow-lg text-center text-headline font-semibold outline-none focus:ring-2
             focus:ring-primary-main transition"
            placeholder="Year"
          />
          <select
            value={Season}
            onChange={(e) => setSeason(e.target.value as TheFourSeason)}
            placeholder="Season"
            className="py-2 px-1 w-52 rounded-md capitalize bg-bgi-black shadow-lg text-center text-headline font-semibold outline-none focus:ring-2
             focus:ring-primary-main transition"
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
      <div className="grid grid-cols-6 gap-2">{RenderedSeasonAnime}</div>
    </div>
  );
};

function SeasonAnimeItem({ seasonAnimeData }: SeasonAnimeItemProps) {
  const { title, type, PhotoUrl, BeginAiring, score, MalId, r18 } =
    seasonAnimeData || {};
  if (r18) return <div></div>;

  return (
    <div className="px-4 py-2 rounded-md text-center">
      <Link href={`/anime/${MalId}`} passHref>
        <a>
          <div className="flex justify-center">
            <div className="group relative w-56">
              <Image
                src={PhotoUrl}
                alt="cover"
                width={210}
                height={300}
                className="opacity-95 hover:opacity-50 transition cursor-pointer rounded-lg"
              />
              <div className="absolute top-0 left-1.5 font-semibold text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg">
                <FaStar className="icon text-yellow-500" /> {score}
              </div>
              <div className="absolute top-0 right-1.5 font-semibold text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg">
                {type}
              </div>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-headline bg-bgi-darker 
            bg-opacity-80 px-1 py-2 rounded-lg"
              >
                <FaCalendarAlt className="icon text-primary-whiter" />{" "}
                {BeginAiring}
              </div>
            </div>
          </div>

          <h1 className="text-headline font-semibold text-center cursor-pointer text-lg hover:text-gray-200 transition">
            {title.slice(0, 70)}
          </h1>
        </a>
      </Link>
    </div>
  );
}

export default SeasonAnimes;
