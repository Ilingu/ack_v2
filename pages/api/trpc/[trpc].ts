import * as trpcNext from "@trpc/server/adapters/next";
import appRouter from "../../../lib/server/routes/main";
import { createContext } from "../../../lib/server/trpc";

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  onError: ({ error, type, path }) => {
    console.error(`API ERROR!\nAt "${path}"\nRequest Type: ${type}`);
    console.error({ error });
  },
});
