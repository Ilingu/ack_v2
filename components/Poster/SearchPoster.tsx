import { FC, Fragment } from "react";
// Types
import { PosterSearchData } from "../../lib/types/interface";

/* Interface */
interface AnimePosterProps {
  AnimeToTransform: PosterSearchData[];
}
interface AnimeItemProps {
  animeData: PosterSearchData;
}

const AnimePoster: FC<AnimePosterProps> = ({ AnimeToTransform }) => {
  const JsonToPoster = AnimeToTransform.map((animeData, i) => (
    <AnimeItem key={i} animeData={animeData} />
  ));
  return <Fragment>{JsonToPoster}</Fragment>;
};

function AnimeItem({ animeData }: AnimeItemProps) {
  return <div></div>;
}

export default AnimePoster;
