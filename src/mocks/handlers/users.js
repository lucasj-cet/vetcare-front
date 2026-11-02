import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "../../api/endpoints";
import { STATUS } from "../../api/statusCodes";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 8;

// the token is derived from the email so sessions survive page reloads
export const TOKEN_PREFIX = "mock-token-";

const ago = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

const active = (id, name, email, role, lastAccessDays) => ({
  id,
  name,
  email,
  role,
  password: "password",
  status: "active",
  lastAccessAt: ago(lastAccessDays),
  inviteSentAt: null,
});

const pending = (id, name, email, role, sentDays) => ({
  id,
  name,
  email,
  role,
  password: null,
  status: "peding_invite",
  lastAccessAt: null,
  inviteSentAt: ago(sentDays),
  inviteToken: `convite-${id}`,
});

const deactivated = (...args) => ({
  ...active(...args),
  status: "deactivated",
});

// in-memory store shared by the auth and users handlers
export const store = {
  users: [
    active("u1", "Renata Freitas", "admin@vetcare.com.br", "admin", 0),
    active("u2", "Juliana Prado", "recepcao@vetcare.com.br", "recepcao", 1),
    active(
      "u3",
      "Bruno Carvalho",
      "bruno.carvalho@vetcare.com.br",
      "recepcao",
      3,
    ),
    active("u4", "Camila Duarte", "camila.duarte@vetcare.com.br", "admin", 5),
    active(
      "u5",
      "Diego Moreira",
      "diego.moreira@vetcare.com.br",
      "recepcao",
      8,
    ),
    active(
      "u6",
      "Elisa Tavares",
      "elisa.tavares@vetcare.com.br",
      "recepcao",
      12,
    ),
    active("u7", "Fábio Nunes", "fabio.nunes@vetcare.com.br", "recepcao", 20),
    pending(
      "u8",
      "Gabriela Lins",
      "gabriela.lins@vetcare.com.br",
      "recepcao",
      2,
    ),
    pending(
      "u9",
      "Henrique Alves",
      "henrique.alves@vetcare.com.br",
      "admin",
      6,
    ),
    deactivated(
      "u10",
      "Isabela Rocha",
      "isabela.rocha@vetcare.com.br",
      "recepcao",
      40,
    ),
    deactivated(
      "u11",
      "João Pedro Maia",
      "joao.maia@vetcare.com.br",
      "recepcao",
      70,
    ),
  ],
};

let nextId = 1000;

const err = (status, message) =>
  HttpResponse.json({ statusCode: status, message }, { status });

// never expose the password or the invite token
const publicUser = ({ password, inviteToken, ...u }) => u;

export const userFromRequest = (request) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  return store.users.find((u) => TOKEN_PREFIX + u.email === token);
};

// null when the caller is an authenticated admin, otherwise the error response
const requireAdmin = (request) => {
  const user = userFromRequest(request);
  if (!user || user.status !== "active")
    return err(STATUS.UNAUTHORIZED, "Unauthorized");
  if (user.role !== "admin")
    return err(403, "Acesso restrito a administradores.");
  return null;
};

const matches = (search, ...fields) => {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  return fields.some((f) =>
    String(f ?? "")
      .toLowerCase()
      .includes(s),
  );
};

export const userHandlers = [
  http.get(`${API_URL}${ENDPOINTS.users.list}`, ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const found = store.users
      .filter((u) => matches(search, u.name, u.email))
      .sort((a, b) => a.name.localeCompare(b.name));

    return HttpResponse.json({
      data: found
        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        .map(publicUser),
      total: found.length,
      page,
      pageSize: PAGE_SIZE,
    });
  }),

  http.post(`${API_URL}${ENDPOINTS.users.invite}`, async ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    const { name, email, role } = await request.json();
    if (!name || !email || !role)
      return err(400, "Dados do convite incompletos.");
    if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return err(409, "Já existe um usuário com esse e-mail.");

    const id = `u${++nextId}`;
    const user = {
      id,
      name,
      email,
      role,
      password: null,
      status: "peding_invite",
      lastAccessAt: null,
      inviteSentAt: new Date().toISOString(),
      inviteToken: `convite-${id}-${Math.random().toString(36).slice(2, 10)}`,
    };
    store.users.push(user);
    // no e-mail in dev: the link is logged instead
    console.info(
      `[mock] convite para ${email}: ${window.location.origin}/convite/${user.inviteToken}`,
    );
    return HttpResponse.json(publicUser(user), { status: 201 });
  }),

  http.post(
    `${API_URL}${ENDPOINTS.users.acceptInvite(":token")}`,
    async ({ request, params }) => {
      const user = store.users.find(
        (u) => u.inviteToken === params.token && u.status === "peding_invite",
      );
      if (!user) return err(404, "Convite inválido ou expirado.");

      const { password } = await request.json();
      if (!password || password.length < 8)
        return err(400, "A senha precisa ter pelo menos 8 caracteres.");

      user.password = password;
      user.status = "active";
      user.inviteToken = null;
      user.lastAccessAt = new Date().toISOString();
      return HttpResponse.json({ token: TOKEN_PREFIX + user.email });
    },
  ),

  http.post(
    `${API_URL}${ENDPOINTS.users.deactivate(":id")}`,
    ({ request, params }) => {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const user = store.users.find((u) => u.id === params.id);
      if (!user) return err(404, "Usuário não encontrado.");
      user.status = "deactivated";
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.patch(
    `${API_URL}${ENDPOINTS.users.byId(":id")}`,
    async ({ request, params }) => {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const user = store.users.find((u) => u.id === params.id);
      if (!user) return err(404, "Usuário não encontrado.");
      const { name, role } = await request.json();
      if (name) user.name = name;
      if (role) user.role = role;
      return HttpResponse.json(publicUser(user));
    },
  ),
];
