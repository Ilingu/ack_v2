import React, { FC } from "react";

/* INTERFACES */
interface MovieListProps {
  Duration: string;
}

/* COMPONENT */
const MovieList: FC<MovieListProps> = ({ Duration }) => {
  const DurationDataNum = Duration.split("Hr").map((str) => str.trim());
  const HoursToMin = parseInt(DurationDataNum[0]) * 60;
  const MinutesRemaining = parseInt(DurationDataNum[1]?.split(" min")[0]);
  const DurationToMin =
    HoursToMin + (!isNaN(MinutesRemaining) ? MinutesRemaining : 0);

  return (
    <div className="relative w-full">
      <h1 className="text-headline mb-3 flex flex-col text-center text-4xl font-bold">
        {Duration}
        <span className="text-description text-lg font-semibold">
          (1 ep x {DurationToMin} min)
        </span>
      </h1>
    </div>
  );
};

export default MovieList;
