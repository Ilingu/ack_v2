import { FC, Fragment, useContext } from "react";
import Image from "next/image";
import { SearchPosterContext } from "../../lib/context";
// Types
import { PosterSearchData } from "../../lib/types/interface";
// Icon
import { FaInfo, FaStar } from "react-icons/fa";
import Link from "next/link";
import { useEffect } from "react";
import { useState } from "react";

/* Interface */
interface AnimePosterProps {
  AnimeToTransform: PosterSearchData[];
}
interface AnimeItemProps {
  animeData: PosterSearchData;
}

const AnimePoster: FC<AnimePosterProps> = ({ AnimeToTransform }) => {
  const [RenderElements, setNewRender] = useState<JSX.Element[]>();

  useEffect(() => {
    const SearchPosters = AnimeToTransform.map((animeData, i) => (
      <AnimeItem key={i} animeData={animeData} />
    ));
    setNewRender(SearchPosters);
  }, [AnimeToTransform]);

  return <Fragment>{RenderElements}</Fragment>;
};

function AnimeItem({ animeData }: AnimeItemProps) {
  const { reqTitle } = useContext(SearchPosterContext);
  const enhanceWord = (title: string) =>
    title
      .toLowerCase()
      .replace(
        reqTitle.toLowerCase(),
        `<span class="text-primary-main font-bold">${reqTitle.toLowerCase()}</span>`
      );

  return (
    <div className="cursor-pointer relative">
      <Link href={`/anime/${animeData.malId}`} prefetch={false}>
        <a>
          <div className="relative group">
            <Image
              src={animeData?.photoPath}
              alt={`${animeData?.title}'s cover`}
              width="75%"
              height="100%"
              layout="responsive"
              objectFit="cover"
              loading="lazy"
              className="opacity-95 group-hover:opacity-50 transition rounded-lg"
            />
            <button className="absolute opacity-0 group-hover:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition ease-in bg-primary-whiter py-2 px-2 rounded-full">
              <FaInfo className="icon text-4xl font-bold text-headline" />
            </button>
          </div>
          <div className="absolute top-1 left-1 font-semibold text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg">
            <FaStar className="icon text-yellow-500" />{" "}
            {animeData?.OverallScore}
          </div>
          <div className="absolute top-1 right-1 font-semibold text-headline bg-bgi-darker bg-opacity-70 px-2 py-1 rounded-lg">
            {animeData?.type}
          </div>
          <h1
            dangerouslySetInnerHTML={{ __html: enhanceWord(animeData?.title) }}
            className="text-center text-headline font-semibold text-lg capitalize"
          ></h1>
        </a>
      </Link>
    </div>
  );
}

export default AnimePoster;
