import React, { FC } from "react";
import { GetStaticProps } from "next";
// Types
import { callApi, Return404, WhitchSeason } from "../../lib/utilityfunc";
import {
  JikanApiResSeasonAnime,
  JikanApiResSeasonRoot,
} from "../../lib/types/interface";
// Template
import seasonAnime from "../../lib/template";

/* Interface */
interface SeasonAnimeProps {
  seasonAnime: JikanApiResSeasonAnime[]; // SeasonAnimeShape
}

/* ISR */
// export const getStaticProps: GetStaticProps = async () => {
//   try {
//     const seasonAnime = (await callApi(
//       `https://api.jikan.moe/v3/season`
//     )) as JikanApiResSeasonRoot;
//     if (seasonAnime.status === 404) return Return404();

//     return {
//       props: { seasonAnime: seasonAnime.anime.slice(0, 50) },
//       revalidate: 120,
//     };
//   } catch (err) {
//     return Return404();
//   }
// };

/* Components */
const SeasonAnime: FC<SeasonAnimeProps> = ({}) => {
  console.log(seasonAnime);
  return <div></div>;
};

export default SeasonAnime;
