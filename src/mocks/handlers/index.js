import { delay, http } from "msw";
import { authHandlers } from "./auth";
import { petHandlers, petOwnerHandlers } from "./petOwners";
import { userHandlers } from "./users";

export const handlers = [
  http.all("*", () => delay(1000)),
  ...authHandlers,
  ...petOwnerHandlers,
  ...petHandlers,
  ...userHandlers,
];
