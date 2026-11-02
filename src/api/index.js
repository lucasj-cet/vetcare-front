import dayjs from "dayjs";
import { onlyDigits } from "../lib/format";
import { db } from "./db";
import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import {
  fromApiPage,
  fromApiPet,
  fromApiPetOwner,
  toApiCreatePetOwner,
} from "./mappers";

// ---------------------------------------------------------------------------
// Serviços do VetCare. As telas só chamam estas funções, todas assíncronas.
// Hoje elas leem e gravam no banco de demonstração (db.js); para ligar na API,
// troque o corpo de cada uma por uma chamada do http.js. O README desta pasta
// lista a rota sugerida para cada função.
// ---------------------------------------------------------------------------

const LATENCY = 150;
const call = (fn) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, LATENCY),
  );
const fail = (message) => {
  const e = new Error(message);
  e.userMessage = message;
  throw e;
};

const alive = (r) => !r.deletedAt;
const petById = (id) => db.find("pets", id);
const tutorById = (id) => db.find("tutors", id);

function petProfile(petId) {
  const pet = petById(petId);
  if (!pet) fail("Paciente não encontrado.");
  return {
    pet,
    tutor: tutorById(pet.tutorId),
  };
}

// ============================== autenticação ==============================

export const auth = {
  login: ({ email, password }) =>
    http.post(ENDPOINTS.auth.login, { email, password }),
  me: () => http.get(ENDPOINTS.users.me),
};

// ============================== equipe ==============================
export const staff = {
  list: () => call(() => db.all("users").filter((u) => u.role !== "tutor")),
  invite: ({ name, email, role, crmv }) =>
    call(() => {
      if (
        db
          .all("users")
          .some((u) => u.email.toLowerCase() === email.toLowerCase())
      )
        fail("Já existe um usuário com esse e-mail.");
      return db.insert("users", {
        name,
        email,
        role,
        status: "convite",
        invitedAt: dayjs().format("YYYY-MM-DDTHH:mm"),
      });
    }),
  update: (id, patch) => call(() => db.update("users", id, patch)),
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
};

export const tutors = {
  save: ({ id, ...data }) =>
    call(() => {
      const cpf = onlyDigits(data.cpf);
      if (
        db
          .all("tutors")
          .some((t) => alive(t) && t.id !== id && onlyDigits(t.cpf) === cpf)
      )
        fail("Já existe um tutor com esse CPF.");
      return db.update("tutors", id, data);
    }),
  // DELETE /tutors/:id (exclusão lógica: o histórico clínico e financeiro fica)
  remove: (id) =>
    call(() => {
      const pets = db.all("pets").filter((p) => p.tutorId === id && alive(p));

      const stamp = dayjs().format("YYYY-MM-DDTHH:mm");
      db.batch(() => {
        pets.forEach((p) => db.update("pets", p.id, { deletedAt: stamp }));
        db.update("tutors", id, { deletedAt: stamp });
      });
    }),
};

export const pets = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.pets.list, { search, page }),
      fromApiPet,
    ),
  profile: (id) => call(() => petProfile(id)),
  // POST /pets | PUT /pets/:id
  save: ({ id, ...data }) =>
    call(() => (id ? db.update("pets", id, data) : db.insert("pets", data))),
  remove: (id) =>
    call(() => {
      db.update("pets", id, { deletedAt: dayjs().format("YYYY-MM-DDTHH:mm") });
    }),
};

export const demo = {
  reset: () => call(() => db.reset()),
};

export const api = {
  auth,
  staff,
  petOwners,
  tutors,
  pets,
  demo,
};
