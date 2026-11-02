export const ENDPOINTS = {
  auth: { login: "/auth/login" },
  users: { me: "/users/me" },
  petOwners: {
    list: "/pet-owners",
    byId: (id) => `/pet-owners/${id}`,
  },
};
