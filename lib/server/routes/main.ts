import { createRouter } from "../trpc";
// Routes
import users from "./users";

const appRouter = createRouter().merge("users.", users);

export default appRouter;
