// trpc
import { z } from "zod";
// DB
import { auth, db } from "../../../lib/firebase/firebase-admin";
// Funcs
import { createRouter, ThrowError } from "../trpc";
import { FbAuthentificate, IsBlacklistedHost } from "../ApiFunc";
import { IsEmptyString, postToJSON } from "../../utils/UtilsFunc";
// Types
import { AnimeWatchType } from "../../utils/types/enums";
import { ResDataUser, UserAnimeShape } from "../../utils/types/interface";
// Routes
import getUser from "../handlers/getUser";

const users = createRouter().query("getUser", {
  input: z
    .string({
      required_error: "Username is required",
      invalid_type_error: "Username must be a string",
    })
    .min(3, { message: "Username must be >= 3 charaters" })
    .max(15, { message: "Username must be <= 15 charaters" }),

  resolve: (req) => getUser(req),
});

export default users;
