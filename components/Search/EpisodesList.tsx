import React, { FC, Fragment, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { EpisodesSearchContext } from "../../lib/context";
// Types
import {
  EpisodesShape,
  JikanApiResAnimeEpisodes,
} from "../../lib/types/interface";
// Imp
import { JikanApiToEpisodesShape } from "../../lib/utilityfunc";
// UI
import { FaEye } from "react-icons/fa";

/* Interface */
interface EpisodesListProps {
  Eps: JikanApiResAnimeEpisodes[];
}
interface EpisodeItemProps {
  EpisodeData: EpisodesShape;
}

// JSX
const EpisodesList: FC<EpisodesListProps> = ({ Eps }) => {
  const [RenderElements, setNewRender] = useState<JSX.Element[]>();

  useEffect(
    () => LoadEps(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Eps]
  );

  const LoadEps = (withRestriction = true) => {
    let ToEpisodesShape = JikanApiToEpisodesShape(Eps);
    if (withRestriction) ToEpisodesShape = ToEpisodesShape.slice(0, 24);
    const JSXElems = ToEpisodesShape.map((episodeData, i) => (
      <EpisodeItem key={i} EpisodeData={episodeData} />
    ));
    setNewRender(JSXElems);
  };

  return (
    <Fragment>
      <h1 className="text-4xl font-bold tracking-wider text-headline mb-8 text-center">
        Episodes{" "}
        <span className="text-2xl text-description">({Eps?.length})</span>
      </h1>
      <div className="grid grid-cols-6 gap-2">{RenderElements}</div>

      {RenderElements?.length !== Eps?.length ? (
        <div className="w-full flex justify-center">
          <button
            onClick={() => LoadEps(false)}
            className="text-center text-headline bg-primary-darker py-2 px-2 rounded-lg font-bold w-56 outline-none focus:ring-2
             focus:ring-primary-whiter transition"
          >
            <FaEye className="inline transform -translate-y-0.5" /> Load All
          </button>
        </div>
      ) : null}
    </Fragment>
  );
};

function EpisodeItem({ EpisodeData }: EpisodeItemProps) {
  const { photoLink } = useContext(EpisodesSearchContext);
  const { title, epsId, EpsURL, Filler, ForumURL, Recap } = EpisodeData || {};

  return (
    <div
      className={`px-2 py-2 rounded-md relative${
        Filler ? " transform scale-90 bg-bgi-whiter" : ""
      }${Recap ? " transform scale-90 bg-bgi-whiter" : ""}`}
    >
      {Filler && (
        <div className="absolute -top-1 -left-1 z-10 bg-red-500 px-2 py-1 font-semibold tracking-wide text-headline rounded-md">
          FILLER
        </div>
      )}
      {Recap && (
        <div className="absolute -top-1 -right-1 z-10 bg-gray-400 px-2 py-1 font-semibold tracking-wide text-headline rounded-md">
          RECAP
        </div>
      )}
      <a href={ForumURL} target="_blank" rel="noreferrer">
        <Image
          src={photoLink}
          alt="cover"
          width="100%"
          height="50%"
          layout="responsive"
          objectFit="cover"
          loading="lazy"
          className="opacity-95 hover:opacity-50 transition rounded-lg"
        />
      </a>

      <h2 className="text-description font-semibold uppercase tracking-wider mt-2">
        Episode {epsId}
      </h2>
      <a href={EpsURL} target="_blank" rel="noreferrer">
        <h1 className="text-headline font-semibold text-xl hover:text-gray-200 transition">
          {title}
        </h1>
      </a>
    </div>
  );
}

export default EpisodesList;
