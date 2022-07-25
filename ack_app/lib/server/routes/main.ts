import { createRouter } from "../trpc";
// Routes
import users from "./users";
import animes from "./animes";

const appRouter = createRouter()
  .merge("users.", users)
  .merge("animes.", animes);

export default appRouter;
