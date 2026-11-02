import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "../../api/endpoints";
import { STATUS } from "../../api/statusCodes";
import { store, TOKEN_PREFIX, userFromRequest } from "./users";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

const sessionUser = ({ id, name, email, role }) => ({ id, name, email, role });

export const authHandlers = [
  http.post(`${API_URL}${ENDPOINTS.auth.login}`, async ({ request }) => {
    const { email, password } = await request.json();
    const user = store.users.find((u) => u.email === email);
    // pending invites have no password; deactivated users cannot log in
    if (!user || user.status !== "ACTIVE" || password !== user.password) {
      return HttpResponse.json(
        { message: "Invalid credentials" },
        { status: STATUS.UNAUTHORIZED },
      );
    }
    return HttpResponse.json({
      access_token: TOKEN_PREFIX + user.email,
      user: sessionUser(user),
    });
  }),

  http.get(`${API_URL}${ENDPOINTS.users.me}`, ({ request }) => {
    const user = userFromRequest(request);
    if (!user || user.status !== "ACTIVE") {
      return HttpResponse.json(
        { message: "Unauthorized" },
        { status: STATUS.UNAUTHORIZED },
      );
    }
    return HttpResponse.json(sessionUser(user));
  }),
];
