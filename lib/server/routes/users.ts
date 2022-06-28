// trpc
import { z } from "zod";
// Funcs
import { createRouter } from "../trpc";
// Routes
import getUser from "../handlers/users/getUser";
import deleteUser from "../handlers/users/deleteUser";
import renameUser from "../handlers/users/renameUser";

// Type Validation
const UsernameCheck = z
  .string({
    required_error: "Username is required",
    invalid_type_error: "Username must be a string",
  })
  .trim()
  .min(3, { message: "Username must be >= 3 charaters" })
  .max(15, { message: "Username must be <= 15 charaters" });

// Route
const users = createRouter()
  .query("getUser", {
    input: UsernameCheck,
    resolve: getUser,
  })
  .mutation("renameUser", {
    input: z.object({ OldUsername: UsernameCheck, NewUsername: UsernameCheck }),
    resolve: renameUser,
  })
  .mutation("deleteUser", {
    input: UsernameCheck,
    resolve: deleteUser,
  });

export default users;
