import { FC, Fragment, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { EpisodesSearchContext } from "../../../lib/context";
// Types
import type {
  EpisodesShape,
  JikanApiResEpisodes,
} from "../../../lib/utils/types/interface";
// Funcs
import { JikanApiToEpisodesShape } from "../../../lib/client/ClientFuncs";
// UI
import { FaEye } from "react-icons/fa";
import { GenerateEpProviderUrl } from "../../../lib/utils/UtilsFuncs";

/* Interface */
interface EpisodesListProps {
  Eps: JikanApiResEpisodes[];
  YugenId?: string;
}
interface EpisodeItemProps {
  EpisodeData: EpisodesShape;
}

let GlobalYugenId: string;

// JSX
const EpisodesList: FC<EpisodesListProps> = ({ Eps, YugenId }) => {
  const [RenderElements, setNewRender] = useState<JSX.Element[]>();
  GlobalYugenId = YugenId;

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
      <h1 className="mb-8 text-center text-4xl font-bold tracking-wider text-headline">
        Episodes{" "}
        <span className="text-2xl text-description">({Eps?.length})</span>
      </h1>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6">
        {RenderElements}
      </div>

      {RenderElements?.length !== Eps?.length ? (
        <div className="flex w-full justify-center">
          <button
            onClick={() => LoadEps(false)}
            className="w-56 rounded-lg bg-primary-darker py-2 px-2 text-center font-bold text-headline outline-none transition
             focus:ring-2 focus:ring-primary-whiter"
          >
            <FaEye className="icon" /> Load All
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
      className={`rounded-md px-2 py-2 relative${
        Filler ? " scale-90 transform bg-bgi-whiter" : ""
      }${Recap ? " scale-90 transform bg-bgi-whiter" : ""}`}
    >
      {Filler && (
        <div className="absolute -top-1 -left-1 z-10 rounded-md bg-red-500 px-2 py-1 font-semibold tracking-wide text-headline">
          FILLER
        </div>
      )}
      {Recap && (
        <div className="absolute -top-1 -right-1 z-10 rounded-md bg-gray-400 px-2 py-1 font-semibold tracking-wide text-headline">
          RECAP
        </div>
      )}
      <a
        href={
          GlobalYugenId
            ? GenerateEpProviderUrl(GlobalYugenId, epsId) || ForumURL
            : ForumURL
        }
        target="_blank"
        rel="noreferrer"
      >
        <Image
          src={photoLink}
          alt="cover"
          width="100%"
          height="50%"
          layout="responsive"
          objectFit="cover"
          loading="lazy"
          className="rounded-lg opacity-95 transition hover:opacity-50"
        />
      </a>

      <h2 className="mt-2 font-semibold uppercase tracking-wider text-description">
        Episode {epsId}
      </h2>
      <a href={EpsURL} target="_blank" rel="noreferrer">
        <h1 className="text-xl font-semibold text-headline transition hover:text-gray-200">
          {title}
        </h1>
      </a>
    </div>
  );
}

export default EpisodesList;
