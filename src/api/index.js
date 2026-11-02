import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import {
  fromApiPage,
  fromApiPet,
  fromApiPetOwner,
  fromApiUser,
  toApiCreatePet,
  toApiCreatePetOwner,
  toApiUpdatePet,
  toApiUpdatePetOwner,
} from "./mappers";

// Serviços do VetCare. As telas só chamam estas funções, todas assíncronas e
// ligadas à API real (http.js + ENDPOINTS). O README desta pasta lista as rotas.

// ============================== autenticação ==============================

export const auth = {
  login: ({ email, password }) =>
    http.post(ENDPOINTS.auth.login, { email, password }),
  me: () => http.get(ENDPOINTS.users.me),
};

// ============================== usuários ==============================
export const users = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.users.list, { search, page }),
      fromApiUser,
    ),
  invite: ({ name, email, role }) =>
    http.post(ENDPOINTS.users.invite, { name, email, role }),
  update: (id, { name, role }) =>
    http.patch(ENDPOINTS.users.byId(id), { name, role }),
  deactivate: (id) => http.post(ENDPOINTS.users.deactivate(id)),
  acceptInvite: (token, { password }) =>
    http.post(ENDPOINTS.users.acceptInvite(token), { password }),
};

// ============================== tutores e pacientes ==============================
export const petOwners = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.petOwners.list, { search, page }),
      fromApiPetOwner,
    ),
  get: async (id) =>
    fromApiPetOwner(await http.get(ENDPOINTS.petOwners.byId(id))),
  create: async (data) =>
    fromApiPetOwner(
      await http.post(ENDPOINTS.petOwners.create, toApiCreatePetOwner(data)),
    ),
  update: async (id, data) =>
    fromApiPetOwner(
      await http.patch(ENDPOINTS.petOwners.byId(id), toApiUpdatePetOwner(data)),
    ),
  remove: (id) => http.delete(ENDPOINTS.petOwners.byId(id)),
};

export const pets = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.pets.list, { search, page }),
      fromApiPet,
    ),
  get: async (id) => fromApiPet(await http.get(ENDPOINTS.pets.byId(id))),
  create: async (data) =>
    fromApiPet(await http.post(ENDPOINTS.pets.create, toApiCreatePet(data))),
  update: async (id, data) =>
    fromApiPet(await http.patch(ENDPOINTS.pets.byId(id), toApiUpdatePet(data))),
  remove: (id) => http.delete(ENDPOINTS.pets.byId(id)),
};

export const api = {
  auth,
  users,
  petOwners,
  pets,
};
