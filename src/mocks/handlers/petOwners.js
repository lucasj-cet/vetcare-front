import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "../../api/endpoints";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 8;

const digits = (v = "") => v.replace(/\D/g, "");

const pet = (id, name, specie, breed, sex, birthdate, weight, notes = "") => ({
  id,
  name,
  specie,
  breed,
  sex,
  birthdate,
  weight,
  notes,
});

let nextSeedPetId = 6; // p1–p5 are written by hand below

// in-memory store, shared by the owner and pet handlers
export const store = {
  petOwners: [
    {
      id: "po1",
      name: "Marina Ribeiro",
      cpf: "31245789012",
      phone: "11987654321",
      email: "marina.ribeiro@email.com",
      address: "Rua Harmonia, 412 · Vila Madalena, São Paulo",
      pets: [
        pet(
          "p1",
          "Thor",
          "Cão",
          "Golden Retriever",
          "Macho",
          "2019-03-12",
          32.5,
          "Alergia a dipirona",
        ),
        pet("p2", "Mel", "Gato", "SRD", "Fêmea", "2021-07-02", 4.2),
      ],
    },
    {
      id: "po2",
      name: "Carlos Mota",
      cpf: "45678912345",
      phone: "11976543210",
      email: "carlos.mota@email.com",
      address: "Av. Paulista, 1000 · Bela Vista, São Paulo",
      pets: [
        pet("p3", "Bolt", "Cão", "Border Collie", "Macho", "2020-11-20", 18),
      ],
    },
    {
      id: "po3",
      name: "Ana Beatriz Souza",
      cpf: "12345678909",
      phone: "11965432109",
      email: "ana.souza@email.com",
      address: "",
      pets: [
        pet(
          "p4",
          "Luna",
          "Gato",
          "Siamês",
          "Fêmea",
          "2018-05-30",
          3.8,
          "Doença renal crônica",
        ),
      ],
    },
    {
      id: "po4",
      name: "Pedro Almeida",
      cpf: "98765432100",
      phone: "11954321098",
      email: "pedro.almeida@email.com",
      address: "Rua Augusta, 220 · Consolação, São Paulo",
      pets: [pet("p5", "Pipo", "Cão", "Shih Tzu", "Macho", "2022-02-10", 6.5)],
    },
    // 16 more owners with 25 pets: 30 pets from 20 owners in total
    ...[
      ["Fernanda Lima", "11122233344", [["Rex", "Cão", "SRD", "Macho", 8]]],
      [
        "Gustavo Rocha",
        "22233344455",
        [
          ["Nina", "Gato", "Persa", "Fêmea", 4.1],
          ["Zeus", "Cão", "Pastor Alemão", "Macho", 34],
        ],
      ],
      [
        "Helena Duarte",
        "33344455566",
        [["Amora", "Cão", "Poodle", "Fêmea", 5]],
      ],
      [
        "Igor Menezes",
        "44455566677",
        [
          ["Simba", "Gato", "SRD", "Macho", 5.3],
          ["Nala", "Gato", "SRD", "Fêmea", 3.9],
        ],
      ],
      [
        "Juliana Castro",
        "55566677788",
        [
          ["Pipoca", "Cão", "Beagle", "Fêmea", 11],
          ["Mingau", "Gato", "Ragdoll", "Macho", 6],
        ],
      ],
      [
        "Lucas Teixeira",
        "66677788899",
        [["Bento", "Cão", "Labrador", "Macho", 29]],
      ],
      [
        "Mariana Furtado",
        "77788899900",
        [
          ["Frida", "Cão", "Dachshund", "Fêmea", 7.2],
          ["Oliver", "Gato", "Maine Coon", "Macho", 7.8],
        ],
      ],
      [
        "Nelson Barros",
        "88899900011",
        [["Max", "Cão", "Rottweiler", "Macho", 41]],
      ],
      [
        "Olívia Ferraz",
        "99900011122",
        [
          ["Bela", "Cão", "Yorkshire", "Fêmea", 3.1],
          ["Fred", "Gato", "SRD", "Macho", 4.6],
        ],
      ],
      ["Paulo Nogueira", "10120230344", [["Toby", "Cão", "Pug", "Macho", 9.4]]],
      [
        "Quitéria Lopes",
        "20230340455",
        [
          ["Lola", "Cão", "Bulldog Francês", "Fêmea", 12],
          ["Cleo", "Gato", "Siamês", "Fêmea", 3.6],
        ],
      ],
      ["Rafael Pinto", "30340450566", [["Duque", "Cão", "Boxer", "Macho", 27]]],
      [
        "Sabrina Moraes",
        "40450560677",
        [
          ["Maya", "Cão", "Spitz Alemão", "Fêmea", 3.4],
          ["Tigre", "Gato", "Bengal", "Macho", 5.9],
        ],
      ],
      [
        "Tiago Vasconcelos",
        "50560670788",
        [["Chico", "Gato", "SRD", "Macho", 5]],
      ],
      [
        "Úrsula Campos",
        "60670780899",
        [
          ["Lord", "Cão", "Golden Retriever", "Macho", 33],
          ["Safira", "Gato", "Azul Russo", "Fêmea", 4.3],
        ],
      ],
      [
        "Vinícius Prado",
        "70780890900",
        [
          ["Nico", "Cão", "Schnauzer", "Macho", 8.7],
          ["Princesa", "Cão", "Lhasa Apso", "Fêmea", 6.1],
        ],
      ],
    ].map(([name, cpf, pets], i) => ({
      id: `po${i + 5}`,
      name,
      cpf,
      phone: `1194000${1000 + i}`,
      email: `${name.split(" ")[0].toLowerCase()}@email.com`,
      address: "",
      pets: pets.map(([petName, specie, breed, sex, weight]) =>
        pet(
          `p${nextSeedPetId++}`,
          petName,
          specie,
          breed,
          sex,
          "2020-01-15",
          weight,
        ),
      ),
    })),
  ],
};

const matches = (search, ...fields) => {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  const d = digits(s);
  return fields.some((f) => {
    const v = String(f ?? "").toLowerCase();
    return v.includes(s) || (d.length >= 3 && digits(v).includes(d));
  });
};

let nextId = 1000;

const badRequest = (message) =>
  HttpResponse.json({ statusCode: 400, message }, { status: 400 });

const notFound = (message) =>
  HttpResponse.json({ statusCode: 404, message }, { status: 404 });

const findPet = (id) => {
  for (const { pets, ...petOwner } of store.petOwners) {
    if (petOwner.deletedAt) continue;
    const pet = pets.find((p) => p.id === id);
    if (pet) return { pet, petOwner };
  }
};

const validatePet = (p) => {
  if (!p.name?.trim() || !p.specie || !p.breed?.trim())
    return "name, specie and breed are required";
  if (p.weight != null && (typeof p.weight !== "number" || p.weight < 0))
    return "weight must be a positive number";
};

export const petHandlers = [
  http.post(`${API_URL}${ENDPOINTS.pets.create}`, async ({ request }) => {
    const { petOwnerId, ...data } = await request.json();
    const error =
      validatePet(data) ?? (!petOwnerId && "petOwnerId is required");
    if (error) return badRequest(error);

    const petOwner = store.petOwners.find(
      (o) => o.id === petOwnerId && !o.deletedAt,
    );
    if (!petOwner) return notFound("Pet owner not found");

    const pet = { notes: "", ...data, id: `p${nextId++}` };
    petOwner.pets.push(pet);
    const { pets, ...owner } = petOwner;
    return HttpResponse.json({ ...pet, petOwner: owner }, { status: 201 });
  }),

  http.get(`${API_URL}${ENDPOINTS.pets.byId(":id")}`, ({ params }) => {
    const found = findPet(params.id);
    if (!found) return notFound("Pet not found");
    return HttpResponse.json({ ...found.pet, petOwner: found.petOwner });
  }),

  http.patch(
    `${API_URL}${ENDPOINTS.pets.byId(":id")}`,
    async ({ params, request }) => {
      const found = findPet(params.id);
      if (!found) return notFound("Pet not found");

      // petOwnerId is ignored: a pet cannot change owner
      const { name, specie, breed, sex, birthdate, weight, notes } =
        await request.json();
      const data = { name, specie, breed, sex, birthdate, weight, notes };
      const error = validatePet(data);
      if (error) return badRequest(error);

      Object.assign(found.pet, data, { notes: notes ?? "" });
      return HttpResponse.json({ ...found.pet, petOwner: found.petOwner });
    },
  ),

  http.delete(`${API_URL}${ENDPOINTS.pets.byId(":id")}`, ({ params }) => {
    const found = findPet(params.id);
    if (!found) return notFound("Pet not found");
    const owner = store.petOwners.find((o) => o.id === found.petOwner.id);
    owner.pets = owner.pets.filter((p) => p.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}${ENDPOINTS.pets.list}`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    const found = store.petOwners
      .filter((o) => !o.deletedAt)
      .flatMap(({ pets, ...petOwner }) => pets.map((p) => ({ ...p, petOwner })))
      .filter((p) =>
        matches(search, p.name, p.breed, p.petOwner.name, p.petOwner.cpf),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return HttpResponse.json({
      data: found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: found.length,
      page,
      pageSize: PAGE_SIZE,
    });
  }),
];

export const petOwnerHandlers = [
  http.post(`${API_URL}${ENDPOINTS.petOwners.create}`, async ({ request }) => {
    const {
      name,
      cpf,
      phone,
      email,
      address,
      pets = [],
    } = await request.json();

    if (!name?.trim() || !email?.trim())
      return badRequest("name and email are required");
    if (!/^\d{11}$/.test(cpf ?? "")) return badRequest("cpf must be 11 digits");
    if (!/^\d{10,11}$/.test(phone ?? ""))
      return badRequest("phone must be 10 or 11 digits");
    if (pets.some((p) => !p.name?.trim() || !p.specie || !p.breed))
      return badRequest("invalid pet");

    if (store.petOwners.some((o) => !o.deletedAt && o.cpf === cpf))
      return HttpResponse.json(
        { statusCode: 409, message: "Já existe um tutor com esse CPF." },
        { status: 409 },
      );

    const petOwner = {
      id: `po${nextId++}`,
      name,
      cpf,
      phone,
      email,
      address: address ?? "",
      pets: pets.map((p) => ({ notes: "", ...p, id: `p${nextId++}` })),
    };
    store.petOwners.push(petOwner);
    return HttpResponse.json(petOwner, { status: 201 });
  }),

  http.patch(
    `${API_URL}${ENDPOINTS.petOwners.byId(":id")}`,
    async ({ params, request }) => {
      const petOwner = store.petOwners.find((o) => o.id === params.id);
      if (!petOwner || petOwner.deletedAt) {
        return HttpResponse.json(
          { statusCode: 404, message: "Pet owner not found" },
          { status: 404 },
        );
      }

      const { name, phone, email, address } = await request.json();

      if (!name?.trim() || !email?.trim())
        return badRequest("name and email are required");
      if (!/^\d{10,11}$/.test(phone ?? ""))
        return badRequest("phone must be 10 or 11 digits");

      Object.assign(petOwner, { name, phone, email, address: address ?? "" });
      return HttpResponse.json(petOwner);
    },
  ),

  http.delete(`${API_URL}${ENDPOINTS.petOwners.byId(":id")}`, ({ params }) => {
    const petOwner = store.petOwners.find((o) => o.id === params.id);
    if (!petOwner || petOwner.deletedAt) return notFound("Pet owner not found");
    // soft delete: hidden from lists and GET by id, pets included
    petOwner.deletedAt = new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}${ENDPOINTS.petOwners.list}`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    const found = store.petOwners
      .filter((o) => !o.deletedAt)
      .filter((o) =>
        matches(search, o.name, o.phone, o.cpf, ...o.pets.map((p) => p.name)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return HttpResponse.json({
      data: found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: found.length,
      page,
      pageSize: PAGE_SIZE,
    });
  }),

  http.get(`${API_URL}${ENDPOINTS.petOwners.byId(":id")}`, ({ params }) => {
    const petOwner = store.petOwners.find((o) => o.id === params.id);
    if (!petOwner || petOwner.deletedAt) {
      return HttpResponse.json(
        { statusCode: 404, message: "Pet owner not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json(petOwner);
  }),
];
