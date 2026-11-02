import { authHandlers } from "./auth";
import { petHandlers, petOwnerHandlers } from "./petOwners";

export const handlers = [...authHandlers, ...petOwnerHandlers, ...petHandlers];
