export const ENDPOINTS = {
  auth: { login: "/auth/login" },
  users: { me: "/users/me" },
  petOwners: {
    list: "/pet-owners",
    create: "/pet-owners",
    byId: (id) => `/pet-owners/${id}`,
  },
  pets: {
    list: "/pets",
    create: "/pets",
    byId: (id) => `/pets/${id}`,
  },
};
