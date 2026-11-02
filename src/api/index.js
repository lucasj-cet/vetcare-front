import dayjs from "dayjs";
import { onlyDigits, todayISO } from "../lib/format";
import { db } from "./db";
import { ENDPOINTS } from "./endpoints";
import { http } from "./http";
import { fromApiPage, fromApiPetOwner } from "./mappers";

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
function matches(search, ...fields) {
  if (!search) return true;
  const s = search.trim().toLowerCase();
  const digits = onlyDigits(s);
  return fields.some((f) => {
    if (!f) return false;
    const v = String(f).toLowerCase();
    return (
      v.includes(s) || (digits.length >= 3 && onlyDigits(v).includes(digits))
    );
  });
}

export const petOwners = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.petOwners.list, { search, page }),
      fromApiPetOwner,
    ),
};

export const tutors = {
  list: ({ search } = {}) =>
    call(() =>
      db
        .all("tutors")
        .filter(alive)
        .map((t) => ({
          ...t,
          pets: db.all("pets").filter((p) => p.tutorId === t.id && alive(p)),
        }))
        .filter((t) =>
          matches(
            search,
            t.name,
            t.cpf,
            t.phone,
            t.email,
            ...t.pets.map((p) => p.name),
          ),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    ),
  get: (id) =>
    call(() => {
      const t = tutorById(id);
      if (!t || !alive(t)) fail("Tutor não encontrado.");
      const pets = db.all("pets").filter((p) => p.tutorId === id && alive(p));
      return {
        ...t,
        pets,
      };
    }),
  // POST /tutors (com o primeiro pet opcional) | PUT /tutors/:id
  save: ({ id, pet, ...data }) =>
    call(() => {
      const cpf = onlyDigits(data.cpf);
      if (
        db
          .all("tutors")
          .some((t) => alive(t) && t.id !== id && onlyDigits(t.cpf) === cpf)
      )
        fail("Já existe um tutor com esse CPF.");
      return db.batch(() => {
        if (id) return db.update("tutors", id, data);
        const tutor = db.insert("tutors", { ...data, createdAt: todayISO() });
        if (pet) db.insert("pets", { ...pet, tutorId: tutor.id });
        return tutor;
      });
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
  list: ({ search, tutorId } = {}) =>
    call(() =>
      db
        .all("pets")
        .filter(alive)
        .filter((p) => !tutorId || p.tutorId === tutorId)
        .map((p) => {
          const tutor = tutorById(p.tutorId);

          return {
            ...p,
            tutor,
          };
        })
        .filter((p) =>
          matches(search, p.name, p.breed, p.tutor?.name, p.tutor?.phone),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
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
