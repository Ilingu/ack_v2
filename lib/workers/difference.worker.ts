import type {
  AnimeShape,
  DifferenceWWShapeReq,
  FunctionJob,
  WebWorkerRequest,
} from "../utils/types/interface";
import {
  filterUserAnime,
  GetAnimesDatasByIds,
  SpotDifferenciesBetweenArrays,
} from "../utils/UtilsFunc";

onmessage = async (e: MessageEvent<WebWorkerRequest<DifferenceWWShapeReq>>) => {
  const { CachedValues, NewValues: NonFilteredNewVals } = e.data.data;
  const NewValues = filterUserAnime(NonFilteredNewVals);

  const MissingDependencies = SpotDifferenciesBetweenArrays(
    NewValues,
    CachedValues,
    "AnimeId",
    "malId"
  );
  let MissingAnimesDatas: AnimeShape[] = [];

  if (MissingDependencies.length > 0)
    MissingAnimesDatas = await GetAnimesDatasByIds(MissingDependencies);

  // Animes in IDB but not in UserAnimes
  const OverflowDependencies = SpotDifferenciesBetweenArrays(
    CachedValues,
    NewValues,
    "malId",
    "AnimeId"
  );
  let GlobalAnimesWithoutOverflow: AnimeShape[] = [];

  if (OverflowDependencies.length > 0)
    GlobalAnimesWithoutOverflow = [...CachedValues].filter(
      ({ malId }) => !OverflowDependencies.includes(malId)
    );

  // Merge
  if (MissingAnimesDatas.length > 0 || GlobalAnimesWithoutOverflow.length > 0) {
    const WithOverflow = GlobalAnimesWithoutOverflow.length > 0;

    const NewDatasToRender = [
      ...(WithOverflow ? GlobalAnimesWithoutOverflow : CachedValues || []),
      ...(MissingAnimesDatas || []),
    ];

    return postMessage({ success: true, data: NewDatasToRender } as FunctionJob<
      AnimeShape[]
    >);
  }
  postMessage({ success: true } as FunctionJob);
};
