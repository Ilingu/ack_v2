import Image from "next/image";
import Link from "next/link";
import React, { FC, Fragment, useEffect, useState } from "react";
// Types
import {
  JikanApiResRecommandations,
  RecommendationsShape,
} from "../../lib/types/interface";
import { JikanApiToRecommendationShape } from "../../lib/utilityfunc";

interface RecommandationsListProps {
  RecommandationsData: JikanApiResRecommandations[];
}
interface RecommandationItemProps {
  RecomData: RecommendationsShape;
}

const RecommandationsList: FC<RecommandationsListProps> = ({
  RecommandationsData,
}) => {
  const [RenderElements, setNewRender] = useState<JSX.Element[]>();

  useEffect(
    () => LoadRecom(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [RecommandationsData]
  );

  const LoadRecom = () => {
    let ToRecomShape = JikanApiToRecommendationShape(RecommandationsData);
    const JSXElems = ToRecomShape.map((recomData, i) => (
      <RecommendationItem key={i} RecomData={recomData} />
    ));
    setNewRender(JSXElems);
  };

  return (
    <Fragment>
      <h1 className="xs:text-4xl text-3xl font-bold tracking-wider text-headline mb-8 text-center">
        Recommendations
      </h1>
      <div className="grid 2xl:grid-cols-7 xl:grid-cols-5 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-2">
        {RenderElements}
      </div>
    </Fragment>
  );
};

function RecommendationItem({ RecomData }: RecommandationItemProps) {
  const { malId, photoUrl, recommendationCount, title } = RecomData || {};
  return (
    <div className="px-4 py-2 rounded-md relative">
      <Link href={`/anime/${malId}`} passHref>
        <a>
          <Image
            src={photoUrl}
            alt="cover"
            width={200}
            height={250}
            className="opacity-95 hover:opacity-50 transition cursor-pointer rounded-lg"
          />
          <h1 className="text-headline font-semibold text-center cursor-pointer text-lg hover:text-gray-200 transition">
            {title}
          </h1>
          <h2 className="text-description text-center font-semibold uppercase tracking-wider mt-1">
            {recommendationCount} Votes
          </h2>
        </a>
      </Link>
    </div>
  );
}

export default RecommandationsList;
