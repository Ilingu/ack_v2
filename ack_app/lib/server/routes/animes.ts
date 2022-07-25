// tRPC
import { z } from "zod";
// Funcs
import { createRouter } from "../trpc";
// Routes
import revalidateAnime from "../handlers/animes/revalidate";

// Type Validation
const AnimeIDCheck = z
  .number({
    required_error: "AnimeID is required",
    invalid_type_error: "AnimeID must be a number",
  })
  .int({ message: "AnimeID must be a positive integer" })
  .positive({ message: "AnimeID must be a positive integer" });

// Route
const animes = createRouter().mutation("revalidate", {
  input: AnimeIDCheck,
  resolve: revalidateAnime,
});

export default animes;
