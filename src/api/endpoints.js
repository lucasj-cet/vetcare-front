export const ENDPOINTS = {
  auth: { login: "/auth/login" },
  users: {
    me: "/users/me",
    list: "/users",
    invite: "/users/invite",
    acceptInvite: (token) => `/users/invite/${token}/accept`,
    deactivate: (id) => `/users/${id}/deactivate`,
    byId: (id) => `/users/${id}`,
  },
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
