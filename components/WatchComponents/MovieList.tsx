import React, { FC } from "react";
import { UserAnimeShape } from "../../lib/types/interface";

interface MovieListProps {
  UserAnimeData: UserAnimeShape;
  Duration: string;
}

const MovieList: FC<MovieListProps> = ({
  Duration,
  UserAnimeData: { WatchType },
}) => {
  const DurationDataNum = Duration.split(" Hr ");
  const DurationToMin =
    parseInt(DurationDataNum[0]) * 60 +
    parseInt(DurationDataNum[1].split(" min")[0]);

  console.log(DurationToMin);

  return (
    <div className="w-full relative">
      <h1 className="flex flex-col text-center text-4xl text-headline font-bold mb-3">
        {Duration}
        <span className="text-description font-semibold text-lg">
          (1 ep x {DurationToMin} min)
        </span>
      </h1>
    </div>
  );
};

export default MovieList;
