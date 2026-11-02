import { authHandlers } from "./auth";
import { petOwnerHandlers } from "./petOwners";

export const handlers = [...authHandlers, ...petOwnerHandlers];
