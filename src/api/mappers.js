import { maskCpf, maskPhone, onlyDigits } from "../lib/format";

// The API speaks `petOwner` / `specie` / `birthdate` / `notes`; the pages keep
// the `tutor` / `species` / `birth` / `alerts` names they already use.

export const fromApiPet = (p) => ({
  id: p.id,
  name: p.name,
  species: p.specie,
  breed: p.breed,
  sex: p.sex,
  birth: p.birthdate,
  weight: p.weight,
  alerts: p.notes,
  ...(p.petOwner && {
    tutorId: p.petOwner.id,
    tutor: { id: p.petOwner.id, name: p.petOwner.name },
  }),
});

export const fromApiPetOwner = (o) => ({
  id: o.id,
  name: o.name,
  cpf: maskCpf(o.cpf),
  phone: maskPhone(o.phone),
  email: o.email,
  address: o.address,
  pets: (o.pets ?? []).map((p) => ({ ...fromApiPet(p), tutorId: o.id })),
});

const toApiNewPet = (p) => ({
  name: p.name,
  specie: p.species,
  breed: p.breed,
  sex: p.sex,
  birthdate: p.birth,
  weight: p.weight,
  notes: p.alerts,
});

export const toApiCreatePetOwner = ({ pet, ...o }) => ({
  name: o.name,
  cpf: onlyDigits(o.cpf),
  phone: onlyDigits(o.phone),
  email: o.email,
  address: o.address,
  ...(pet && { pets: [toApiNewPet(pet)] }),
});

export const fromApiPage = (res, map) => ({
  rows: res.data.map(map),
  total: res.total,
  pageSize: res.pageSize,
});
