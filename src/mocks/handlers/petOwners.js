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
      pets: [],
    },
    ...[
      ["Fernanda Lima", "11122233344"],
      ["Gustavo Rocha", "22233344455"],
      ["Helena Duarte", "33344455566"],
      ["Igor Menezes", "44455566677"],
      ["Juliana Castro", "55566677788"],
      ["Lucas Teixeira", "66677788899"],
    ].map(([name, cpf], i) => ({
      id: `po${i + 5}`,
      name,
      cpf,
      phone: `1194000${String(1000 + i)}`,
      email: `${name.split(" ")[0].toLowerCase()}@email.com`,
      address: "",
      pets: [
        pet(
          `p${i + 5}`,
          ["Rex", "Nina", "Amora", "Simba", "Pipoca", "Bento"][i],
          i % 2 ? "Gato" : "Cão",
          "SRD",
          "Macho",
          "2020-01-15",
          8,
        ),
      ],
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

export const petOwnerHandlers = [
  http.get(`${API_URL}${ENDPOINTS.petOwners.list}`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    const found = store.petOwners
      .filter((o) =>
        matches(search, o.name, o.cpf, o.phone, ...o.pets.map((p) => p.name)),
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
