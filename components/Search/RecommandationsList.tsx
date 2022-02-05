import Image from "next/image";
import Link from "next/link";
import React, { FC, Fragment, useEffect, useState } from "react";
// Types
import {
  JikanApiResRecommandations,
  RecommendationsShape,
} from "../../lib/utils/types/interface";
import { JikanApiToRecommendationShape } from "../../lib/utils/UtilsFunc";

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
      <h1 className="xs:text-4xl text-headline mb-8 text-center text-3xl font-bold tracking-wider">
        Recommendations
      </h1>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-7">
        {RenderElements}
      </div>
    </Fragment>
  );
};

function RecommendationItem({ RecomData }: RecommandationItemProps) {
  const { malId, photoUrl, recommendationCount, title } = RecomData || {};
  return (
    <div className="relative rounded-md px-4 py-2">
      <Link href={`/anime/${malId}`} passHref prefetch={false}>
        <a>
          <Image
            src={photoUrl}
            alt="cover"
            width={200}
            height={250}
            className="cursor-pointer rounded-lg opacity-95 transition hover:opacity-50"
          />
          <h1 className="text-headline cursor-pointer text-center text-lg font-semibold transition hover:text-gray-200">
            {title}
          </h1>
          <h2 className="text-description mt-1 text-center font-semibold uppercase tracking-wider">
            {recommendationCount} Votes
          </h2>
        </a>
      </Link>
    </div>
  );
}

export default RecommandationsList;
