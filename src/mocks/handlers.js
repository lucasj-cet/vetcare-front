import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "../api/endpoints";
import { STATUS } from "../api/statusCodes";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

const PASSWORD = "password";
const USERS = [
  { name: "Renata Freitas", email: "admin@vetcare.com.br", role: "admin" },
  { name: "Juliana Prado", email: "recepcao@vetcare.com.br", role: "recepcao" },
];

// the token is derived from the email so sessions survive page reloads
const TOKEN_PREFIX = "mock-token-";

export const handlers = [
  http.post(`${API_URL}${ENDPOINTS.auth.login}`, async ({ request }) => {
    const { email, password } = await request.json();
    const user = USERS.find((u) => u.email === email);
    if (!user || password !== PASSWORD) {
      return HttpResponse.json(
        { message: "Invalid credentials" },
        { status: STATUS.UNAUTHORIZED },
      );
    }
    return HttpResponse.json({ token: TOKEN_PREFIX + user.email, user });
  }),

  http.get(`${API_URL}${ENDPOINTS.users.me}`, ({ request }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = USERS.find((u) => TOKEN_PREFIX + u.email === token);
    if (!user) {
      return HttpResponse.json(
        { message: "Unauthorized" },
        { status: STATUS.UNAUTHORIZED },
      );
    }
    return HttpResponse.json(user);
  }),
];
