import { maskCpf, maskPhone, onlyDigits } from "../lib/format";

// The API speaks `petOwner` / `specie` / `birthdate` / `notes`; the pages keep
// the `species` / `birth` / `alerts` names they already use.

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
    petOwnerId: p.petOwner.id,
    petOwner: { id: p.petOwner.id, name: p.petOwner.name },
  }),
});

export const fromApiPetOwner = (o) => ({
  id: o.id,
  name: o.name,
  cpf: maskCpf(o.cpf),
  phone: maskPhone(o.phone),
  email: o.email,
  address: o.address,
  pets: (o.pets ?? []).map((p) => ({ ...fromApiPet(p), petOwnerId: o.id })),
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

export const toApiCreatePet = ({ petOwnerId, ...p }) => ({
  ...toApiNewPet(p),
  petOwnerId,
});

export const toApiUpdatePet = toApiNewPet;

export const toApiCreatePetOwner = ({ pet, ...o }) => ({
  name: o.name,
  cpf: onlyDigits(o.cpf),
  phone: onlyDigits(o.phone),
  email: o.email,
  address: o.address,
  ...(pet && { pets: [toApiNewPet(pet)] }),
});

export const toApiUpdatePetOwner = (o) => ({
  name: o.name,
  phone: onlyDigits(o.phone),
  email: o.email,
  address: o.address,
});

// The page keeps its own status names; `peding_invite` is spelled as in the contract.
const USER_STATUS_FROM_API = {
  active: "ativo",
  peding_invite: "convite",
  pending_invite: "convite",
  deactivated: "inativo",
};

export const fromApiUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: USER_STATUS_FROM_API[u.status] ?? u.status,
  lastSeen: u.lastAccessAt,
  invitedAt: u.inviteSentAt,
});

export const fromApiPage = (res, map) => ({
  rows: res.data.map(map),
  total: res.total,
  pageSize: res.pageSize,
});
