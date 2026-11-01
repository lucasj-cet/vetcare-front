import dayjs from "dayjs";
import { db } from "./db";
import { DURATION, PRICES } from "../data/seed";
import { fromMin, onlyDigits, toMin, todayISO, weekStart } from "../lib/format";

// ---------------------------------------------------------------------------
// Serviços do VetCare. As telas só chamam estas funções, todas assíncronas.
// Hoje elas leem e gravam no banco de demonstração (db.js); para ligar na API,
// troque o corpo de cada uma por uma chamada do http.js. O README desta pasta
// lista a rota sugerida para cada função.
// ---------------------------------------------------------------------------

const LATENCY = 150;
const call = (fn) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    }, LATENCY),
  );
const fail = (message) => {
  const e = new Error(message);
  e.userMessage = message;
  throw e;
};

export const OPEN = 8 * 60;
export const CLOSE = 18 * 60;
const STEP = 30;

const alive = (r) => !r.deletedAt;
const petById = (id) => db.find("pets", id);
const tutorById = (id) => db.find("tutors", id);
const userById = (id) => (id ? db.find("users", id) : null);
const byDateTime = (a, b) =>
  `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
const sum = (rows, f = (r) => r.amount) => rows.reduce((s, r) => s + f(r), 0);
const inMonth = (iso, month) => iso?.startsWith(month);

function expand(a) {
  const pet = petById(a.petId);
  return {
    ...a,
    pet,
    tutor: pet && tutorById(pet.tutorId),
    vet: userById(a.vetId),
  };
}

function vaccineState(v) {
  if (v.status === "aplicada") return "aplicada";
  const days = dayjs(v.dueAt).diff(dayjs().startOf("day"), "day");
  if (days < 0) return "atrasada";
  if (days <= 30) return "proxima";
  return "agendada";
}
const withVaccineState = (v) => ({
  ...v,
  state: vaccineState(v),
  pet: petById(v.petId),
  vet: userById(v.vetId),
});

const overlaps = (start, dur, otherStart, otherDur) =>
  start < otherStart + otherDur && otherStart < start + dur;

function freeSlots({ date, vetId, type, ignoreId }) {
  const duration = DURATION[type] ?? 30;
  const busy = db
    .all("appointments")
    .filter(
      (a) =>
        a.date === date &&
        a.vetId &&
        a.id !== ignoreId &&
        !["cancelada", "solicitada"].includes(a.status),
    );
  const vets = vetId
    ? [vetId]
    : db
        .all("users")
        .filter((u) => u.role === "vet" && u.status === "ativo")
        .map((u) => u.id);
  const now = date === todayISO() ? dayjs().hour() * 60 + dayjs().minute() : -1;
  const slots = [];
  for (let m = OPEN; m + duration <= CLOSE; m += STEP) {
    const vetFree = vets.filter(
      (v) =>
        !busy.some(
          (a) =>
            a.vetId === v && overlaps(m, duration, toMin(a.time), a.duration),
        ),
    );
    slots.push({
      time: fromMin(m),
      past: m <= now,
      free: m > now && vetFree.length > 0,
      vets: vetFree,
    });
  }
  return slots;
}

function assertSlot({ date, time, vetId, type, ignoreId }) {
  if (dayjs(date).day() === 0) fail("A clínica não abre aos domingos.");
  const slot = freeSlots({ date, vetId, type, ignoreId }).find(
    (s) => s.time === time,
  );
  if (!slot || !slot.free)
    fail("Esse horário não está mais livre. Escolha outro.");
}

function petProfile(petId) {
  const pet = petById(petId);
  if (!pet) fail("Paciente não encontrado.");
  const appts = db.all("appointments").filter((a) => a.petId === petId);
  return {
    pet,
    tutor: tutorById(pet.tutorId),
    records: db
      .all("records")
      .filter((r) => r.petId === petId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((r) => ({ ...r, vet: userById(r.vetId) })),
    vaccines: db
      .all("vaccines")
      .filter((v) => v.petId === petId)
      .map(withVaccineState)
      .sort((a, b) =>
        (b.appliedAt ?? b.dueAt).localeCompare(a.appliedAt ?? a.dueAt),
      ),
    prescriptions: db
      .all("prescriptions")
      .filter((r) => r.petId === petId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((r) => ({ ...r, vet: userById(r.vetId) })),
    exams: db.all("exams").filter((e) => e.petId === petId),
    upcoming: appts
      .filter(
        (a) =>
          a.date >= todayISO() &&
          !["concluida", "cancelada"].includes(a.status),
      )
      .sort(byDateTime)
      .map(expand),
    lastVisit:
      appts
        .filter((a) => a.status === "concluida")
        .sort(byDateTime)
        .at(-1)?.date ?? null,
  };
}

// ============================== autenticação ==============================
const ROLE_USER = { tutor: "u6", recepcao: "u1", vet: "u2", admin: "u4" };

export const auth = {
  // POST /auth/login → { token, user }
  login: ({ email, password, role }) =>
    call(() => {
      if (!password || password.length < 6) fail("E-mail ou senha incorretos.");
      const match = db
        .all("users")
        .find(
          (u) =>
            u.role === role &&
            u.email.toLowerCase() === email.trim().toLowerCase() &&
            u.status === "ativo",
        );
      const user = match ?? userById(ROLE_USER[role]);
      db.update("users", user.id, {
        lastSeen: dayjs().format("YYYY-MM-DDTHH:mm"),
      });
      return { role, userId: user.id };
    }),
  // POST /auth/forgot-password
  recover: (email) => call(() => ({ sentTo: email })),
  me: (userId) => call(() => userById(userId)),
};

// ============================== equipe ==============================
export const staff = {
  vets: () =>
    call(() =>
      db.all("users").filter((u) => u.role === "vet" && u.status === "ativo"),
    ),
  list: () => call(() => db.all("users").filter((u) => u.role !== "tutor")),
  invite: ({ name, email, role, crmv }) =>
    call(() => {
      if (
        db
          .all("users")
          .some((u) => u.email.toLowerCase() === email.toLowerCase())
      )
        fail("Já existe um usuário com esse e-mail.");
      return db.insert("users", {
        name,
        email,
        role,
        crmv: crmv || undefined,
        status: "convite",
        invitedAt: dayjs().format("YYYY-MM-DDTHH:mm"),
      });
    }),
  resendInvite: (id) =>
    call(() =>
      db.update("users", id, { invitedAt: dayjs().format("YYYY-MM-DDTHH:mm") }),
    ),
  update: (id, patch) => call(() => db.update("users", id, patch)),
};

// ============================== tutores e pacientes ==============================
function matches(search, ...fields) {
  if (!search) return true;
  const s = search.trim().toLowerCase();
  const digits = onlyDigits(s);
  return fields.some((f) => {
    if (!f) return false;
    const v = String(f).toLowerCase();
    return (
      v.includes(s) || (digits.length >= 3 && onlyDigits(v).includes(digits))
    );
  });
}

export const tutors = {
  list: ({ search } = {}) =>
    call(() =>
      db
        .all("tutors")
        .filter(alive)
        .map((t) => ({
          ...t,
          pets: db.all("pets").filter((p) => p.tutorId === t.id && alive(p)),
        }))
        .filter((t) =>
          matches(
            search,
            t.name,
            t.cpf,
            t.phone,
            t.email,
            ...t.pets.map((p) => p.name),
          ),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    ),
  get: (id) =>
    call(() => {
      const t = tutorById(id);
      if (!t || !alive(t)) fail("Tutor não encontrado.");
      const pets = db.all("pets").filter((p) => p.tutorId === id && alive(p));
      const ids = pets.map((p) => p.id);
      return {
        ...t,
        pets: pets.map((p) => ({
          ...p,
          lastVisit:
            db
              .all("appointments")
              .filter((a) => a.petId === p.id && a.status === "concluida")
              .sort(byDateTime)
              .at(-1)?.date ?? null,
        })),
        upcoming: db
          .all("appointments")
          .filter(
            (a) =>
              ids.includes(a.petId) &&
              a.date >= todayISO() &&
              !["concluida", "cancelada"].includes(a.status),
          )
          .sort(byDateTime)
          .map(expand),
        pending: db
          .all("charges")
          .filter((c) => ids.includes(c.petId) && c.status === "pendente"),
      };
    }),
  // POST /tutors (com o primeiro pet opcional) | PUT /tutors/:id
  save: ({ id, pet, ...data }) =>
    call(() => {
      const cpf = onlyDigits(data.cpf);
      if (
        db
          .all("tutors")
          .some((t) => alive(t) && t.id !== id && onlyDigits(t.cpf) === cpf)
      )
        fail("Já existe um tutor com esse CPF.");
      return db.batch(() => {
        if (id) return db.update("tutors", id, data);
        const tutor = db.insert("tutors", { ...data, createdAt: todayISO() });
        if (pet) db.insert("pets", { ...pet, tutorId: tutor.id });
        return tutor;
      });
    }),
  // DELETE /tutors/:id (exclusão lógica: o histórico clínico e financeiro fica)
  remove: (id) =>
    call(() => {
      const pets = db.all("pets").filter((p) => p.tutorId === id && alive(p));
      const future = db
        .all("appointments")
        .some(
          (a) =>
            pets.some((p) => p.id === a.petId) &&
            a.date >= todayISO() &&
            !["concluida", "cancelada"].includes(a.status),
        );
      if (future)
        fail(
          "Esse tutor tem consultas marcadas. Cancele ou remarque antes de excluir.",
        );
      const stamp = dayjs().format("YYYY-MM-DDTHH:mm");
      db.batch(() => {
        pets.forEach((p) => db.update("pets", p.id, { deletedAt: stamp }));
        db.update("tutors", id, { deletedAt: stamp });
      });
    }),
};

export const pets = {
  list: ({ search, tutorId } = {}) =>
    call(() =>
      db
        .all("pets")
        .filter(alive)
        .filter((p) => !tutorId || p.tutorId === tutorId)
        .map((p) => {
          const tutor = tutorById(p.tutorId);
          const appts = db.all("appointments").filter((a) => a.petId === p.id);
          const vacc = db
            .all("vaccines")
            .filter((v) => v.petId === p.id)
            .map(withVaccineState);
          return {
            ...p,
            tutor,
            lastVisit:
              appts
                .filter((a) => a.status === "concluida")
                .sort(byDateTime)
                .at(-1)?.date ?? null,
            nextVaccine:
              vacc
                .filter((v) => v.state !== "aplicada")
                .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0] ?? null,
            overdue: vacc.filter((v) => v.state === "atrasada").length,
          };
        })
        .filter((p) =>
          matches(search, p.name, p.breed, p.tutor?.name, p.tutor?.phone),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    ),
  profile: (id) => call(() => petProfile(id)),
  // POST /pets | PUT /pets/:id
  save: ({ id, ...data }) =>
    call(() => (id ? db.update("pets", id, data) : db.insert("pets", data))),
  remove: (id) =>
    call(() => {
      db.update("pets", id, { deletedAt: dayjs().format("YYYY-MM-DDTHH:mm") });
    }),
};

// ============================== agenda ==============================
export const appointments = {
  // GET /appointments?from=&to=
  range: (from, to) =>
    call(() =>
      db
        .all("appointments")
        .filter(
          (a) => a.date >= from && a.date <= to && a.status !== "solicitada",
        )
        .sort(byDateTime)
        .map(expand),
    ),
  // GET /appointments?status=solicitada
  requests: () =>
    call(() =>
      db
        .all("appointments")
        .filter((a) => a.status === "solicitada")
        .sort(byDateTime)
        .map(expand),
    ),
  get: (id) => call(() => expand(db.find("appointments", id))),
  forVet: (vetId, date) =>
    call(() =>
      db
        .all("appointments")
        .filter(
          (a) =>
            a.vetId === vetId && a.date === date && a.status !== "solicitada",
        )
        .sort(byDateTime)
        .map(expand),
    ),
  forTutor: (tutorId) =>
    call(() => {
      const ids = db
        .all("pets")
        .filter((p) => p.tutorId === tutorId)
        .map((p) => p.id);
      return db
        .all("appointments")
        .filter((a) => ids.includes(a.petId))
        .sort(byDateTime)
        .map(expand);
    }),
  // GET /appointments/slots?date=&vetId=&type=
  slots: (params) => call(() => freeSlots(params)),
  // POST /appointments (recepção marca direto)
  create: (data) =>
    call(() => {
      assertSlot(data);
      return db.insert("appointments", {
        ...data,
        duration: DURATION[data.type] ?? 30,
        status: "agendada",
        source: "recepcao",
      });
    }),
  // POST /appointments/requests (tutor pede pelo portal; a recepção confirma)
  request: (data) =>
    call(() => {
      const slot = freeSlots(data).find((s) => s.time === data.time);
      if (!slot?.free) fail("Esse horário não está mais livre. Escolha outro.");
      const a = db.insert("appointments", {
        ...data,
        duration: DURATION[data.type] ?? 30,
        status: "solicitada",
        source: "tutor",
        requestedAt: dayjs().format("YYYY-MM-DDTHH:mm"),
      });
      const pet = petById(a.petId);
      return a;
    }),
  // PUT /appointments/:id (remarcar)
  update: (id, data) =>
    call(() => {
      assertSlot({ ...data, ignoreId: id });
      return db.update("appointments", id, {
        ...data,
        duration: DURATION[data.type] ?? 30,
      });
    }),
  confirmRequest: (id, vetId) =>
    call(() => {
      const a = db.find("appointments", id);
      assertSlot({ ...a, vetId, ignoreId: id });

      return db.update("appointments", id, { vetId, status: "agendada" });
    }),
  // PATCH /appointments/:id/status
  setStatus: (id, status, reason) =>
    call(() => {
      const a = db.find("appointments", id);
      return db.batch(() => {
        return db.update("appointments", id, { status, cancelReason: reason });
      });
    }),
  // tutor cancela pelo portal
  cancelByTutor: (id) =>
    call(() => {
      return db.update("appointments", id, {
        status: "cancelada",
        cancelReason: "Cancelada pelo tutor",
      });
    }),
};

// ============================== atendimento ==============================
export const care = {
  start: (id) =>
    call(() =>
      db.update("appointments", id, {
        status: "em_atendimento",
        startedAt: dayjs().format("HH:mm"),
      }),
    ),
  // POST /appointments/:id/finish → grava prontuário, prescrição e manda a cobrança ao caixa
  finish: (id, { record, prescription }) =>
    call(() => {
      const a = db.find("appointments", id);
      if (a.status !== "em_atendimento")
        fail("Inicie o atendimento antes de concluir.");
      const pet = petById(a.petId);
      return db.batch(() => {
        db.insert("records", {
          ...record,
          petId: a.petId,
          vetId: a.vetId,
          appointmentId: id,
          date: a.date,
          type: a.type,
        });
        if (record.weight) db.update("pets", pet.id, { weight: record.weight });
        if (prescription?.items?.length) {
          db.insert("prescriptions", {
            ...prescription,
            petId: a.petId,
            vetId: a.vetId,
            date: a.date,
            status: "emitida",
          });
        }
        db.insert("charges", {
          appointmentId: id,
          petId: a.petId,
          vetId: a.vetId,
          description: `${a.type} · ${pet.name}`,
          amount: PRICES[a.type] ?? 0,
          status: "pendente",
          installments: 1,
          createdAt: dayjs().format("YYYY-MM-DDTHH:mm"),
        });
        return db.update("appointments", id, {
          status: "concluida",
          finishedAt: dayjs().format("HH:mm"),
        });
      });
    }),
};

export const records = {
  // POST /pets/:id/records
  create: (data) => call(() => db.insert("records", data)),
};

// ============================== caixa ==============================
export const charges = {
  pending: () =>
    call(() =>
      db
        .all("charges")
        .filter((c) => c.status === "pendente")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((c) => ({
          ...c,
          pet: petById(c.petId),
          tutor: c.petId ? tutorById(petById(c.petId)?.tutorId) : null,
        })),
    ),
  paidOn: (date) =>
    call(() =>
      db
        .all("charges")
        .filter((c) => c.status === "pago" && c.paidAt?.startsWith(date))
        .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
        .map((c) => ({ ...c, pet: petById(c.petId) })),
    ),
  // POST /charges/:id/pay
  pay: (id, { method, installments }) =>
    call(() =>
      db.update("charges", id, {
        status: "pago",
        method,
        installments: installments ?? 1,
        paidAt: dayjs().format("YYYY-MM-DDTHH:mm"),
      }),
    ),
  // POST /charges (lançamento avulso já pago: venda de balcão, por exemplo)
  createPaid: ({ description, petId, amount, method, installments }) =>
    call(() => {
      const now = dayjs().format("YYYY-MM-DDTHH:mm");
      return db.insert("charges", {
        description,
        petId: petId || null,
        amount,
        method,
        installments: installments ?? 1,
        status: "pago",
        createdAt: now,
        paidAt: now,
      });
    }),
};

// ============================== vacinas ==============================
export const vaccines = {
  list: () =>
    call(() =>
      db
        .all("vaccines")
        .filter((v) => alive(petById(v.petId) ?? {}))
        .map(withVaccineState)
        .map((v) => ({ ...v, tutor: tutorById(v.pet?.tutorId) })),
    ),
  forTutor: (tutorId) =>
    call(() =>
      db
        .all("vaccines")
        .filter((v) => petById(v.petId)?.tutorId === tutorId)
        .map(withVaccineState),
    ),
  // POST /vaccines/apply
  apply: ({ petId, name, lot, appliedAt, nextDueAt, vetId }) =>
    call(() => {
      const pet = petById(petId);
      return db.batch(() => {
        const scheduled = db
          .all("vaccines")
          .filter(
            (v) =>
              v.petId === petId && v.name === name && v.status === "agendada",
          )
          .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
        const applied = { status: "aplicada", appliedAt, lot, vetId };
        const rec = scheduled
          ? db.update("vaccines", scheduled.id, applied)
          : db.insert("vaccines", { petId, name, ...applied });
        if (nextDueAt)
          db.insert("vaccines", {
            petId,
            name,
            status: "agendada",
            dueAt: nextDueAt,
          });
        return rec;
      });
    }),
};

export const reminders = {
  forTutor: (tutorId) =>
    call(() =>
      db.all("reminders").filter((r) => petById(r.petId)?.tutorId === tutorId),
    ),
  // PUT /pets/:id/reminder
  save: ({ petId, ...data }) =>
    call(() => {
      const current = db.all("reminders").find((r) => r.petId === petId);
      return current
        ? db.update("reminders", current.id, data)
        : db.insert("reminders", { petId, ...data });
    }),
};

// ============================== prescrições e documentos ==============================
export const prescriptions = {
  list: () =>
    call(() =>
      db
        .all("prescriptions")
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((r) => ({
          ...r,
          pet: petById(r.petId),
          tutor: tutorById(petById(r.petId)?.tutorId),
          vet: userById(r.vetId),
        })),
    ),
  // POST /prescriptions | PUT /prescriptions/:id
  save: ({ id, ...data }) =>
    call(() => {
      return id
        ? db.update("prescriptions", id, data)
        : db.insert("prescriptions", { ...data, date: todayISO() });
    }),
};

export const documents = {
  // GET /tutors/:id/documents → prescrições emitidas + resultados de exame
  forTutor: (tutorId) =>
    call(() => {
      const ids = db
        .all("pets")
        .filter((p) => p.tutorId === tutorId)
        .map((p) => p.id);
      const rx = db
        .all("prescriptions")
        .filter((r) => ids.includes(r.petId) && r.status === "emitida")
        .map((r) => ({
          ...r,
          kind: "prescricao",
          pet: petById(r.petId),
          vet: userById(r.vetId),
        }));
      const ex = db
        .all("exams")
        .filter((e) => ids.includes(e.petId))
        .map((e) => ({ ...e, kind: "exame", pet: petById(e.petId) }));
      return [...rx, ...ex].sort((a, b) => b.date.localeCompare(a.date));
    }),
};

// ============================== gestão ==============================
function monthStats(start, end) {
  const s = start.format("YYYY-MM-DD");
  const e = end.format("YYYY-MM-DD");
  const paid = db
    .all("charges")
    .filter(
      (c) =>
        c.status === "pago" &&
        c.paidAt.slice(0, 10) >= s &&
        c.paidAt.slice(0, 10) <= e,
    );
  const visits = db
    .all("appointments")
    .filter((a) => a.status === "concluida" && a.date >= s && a.date <= e);
  return { paid, revenue: sum(paid), visits };
}

export const dashboard = {
  // GET /dashboard/overview
  overview: () =>
    call(() => {
      const today = dayjs().startOf("day");
      const mStart = today.startOf("month");
      const cur = monthStats(mStart, today);
      const prevStart = mStart.subtract(1, "month");
      const prevEnd = prevStart.add(
        Math.min(today.date(), prevStart.daysInMonth()) - 1,
        "day",
      );
      const prev = monthStats(prevStart, prevEnd);
      const pending = db.all("charges").filter((c) => c.status === "pendente");

      const first = weekStart(today).subtract(7, "week");
      const weeks = Array.from({ length: 8 }, (_, i) => {
        const ws = first.add(i, "week");
        const we = ws.add(6, "day");
        const stats = monthStats(ws, we.isAfter(today) ? today : we);
        return {
          label: ws.format("DD/MM"),
          value: stats.revenue,
          partial: we.isAfter(today),
        };
      });

      const group = (rows, key) => {
        const map = new Map();
        rows.forEach((r) => map.set(key(r), (map.get(key(r)) ?? 0) + r.amount));
        return [...map]
          .map(([label, value]) => ({
            label,
            value,
            share: cur.revenue ? value / cur.revenue : 0,
          }))
          .sort((a, b) => b.value - a.value);
      };

      const vets = db.all("users").filter((u) => u.role === "vet");
      const byVet = vets
        .map((v) => {
          const visits = cur.visits.filter((a) => a.vetId === v.id);
          const revenue = sum(cur.paid.filter((c) => c.vetId === v.id));
          return { label: v.name, visits: visits.length, value: revenue };
        })
        .sort((a, b) => b.value - a.value);

      const services = new Map();
      cur.visits.forEach((a) =>
        services.set(a.type, (services.get(a.type) ?? 0) + 1),
      );

      return {
        revenue: cur.revenue,
        prevRevenue: prev.revenue,
        visits: cur.visits.length,
        prevVisits: prev.visits.length,
        ticket: cur.paid.length ? cur.revenue / cur.paid.length : 0,
        prevTicket: prev.paid.length ? prev.revenue / prev.paid.length : 0,
        pending: sum(pending),
        pendingCount: pending.length,
        weeks,
        methods: group(cur.paid, (c) => c.method),
        byVet,
        services: [...services]
          .map(([label, value]) => ({
            label,
            value,
            share: value / (cur.visits.length || 1),
          }))
          .sort((a, b) => b.value - a.value),
        payments: cur.paid,
      };
    }),
};

export const finance = {
  // GET /finance?month=YYYY-MM
  month: (month) =>
    call(() => {
      const paid = db
        .all("charges")
        .filter((c) => c.status === "pago" && inMonth(c.paidAt, month));
      const days = new Map();
      paid.forEach((c) => {
        const day = c.paidAt.slice(0, 10);
        const cur = days.get(day) ?? { amount: 0, count: 0 };
        days.set(day, { amount: cur.amount + c.amount, count: cur.count + 1 });
      });
      const income = [...days].map(([date, v]) => ({
        id: `in-${date}`,
        kind: "receita",
        auto: true,
        date,
        amount: v.amount,
        category: "Atendimentos",
        description: `Recebimentos do caixa (${v.count} ${v.count === 1 ? "pagamento" : "pagamentos"})`,
      }));
      const manual = db.all("movements").filter((m) => inMonth(m.date, month));
      const rows = [...income, ...manual].sort(
        (a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind),
      );
      const totalIn = sum(rows.filter((r) => r.kind === "receita"));
      const totalOut = sum(rows.filter((r) => r.kind === "despesa"));
      const categories = new Map();
      rows
        .filter((r) => r.kind === "despesa")
        .forEach((r) =>
          categories.set(
            r.category,
            (categories.get(r.category) ?? 0) + r.amount,
          ),
        );
      return {
        rows,
        totalIn,
        totalOut,
        balance: totalIn - totalOut,
        expenseByCategory: [...categories]
          .map(([label, value]) => ({
            label,
            value,
            share: totalOut ? value / totalOut : 0,
          }))
          .sort((a, b) => b.value - a.value),
      };
    }),
  // POST /finance/movements
  add: (data) => call(() => db.insert("movements", data)),
  // DELETE /finance/movements/:id
  remove: (id) => call(() => db.remove("movements", id)),
};

const REPORT_NAMES = {
  financeiro: "Fechamento financeiro",
  produtividade: "Produtividade por veterinário",
  pacientes: "Pacientes e procedimentos",
  vacinas: "Vacinas atrasadas e próximas",
};
export { REPORT_NAMES };

function buildReport(type, from, to) {
  const paid = db
    .all("charges")
    .filter(
      (c) =>
        c.status === "pago" &&
        c.paidAt.slice(0, 10) >= from &&
        c.paidAt.slice(0, 10) <= to,
    );
  const visits = db
    .all("appointments")
    .filter((a) => a.status === "concluida" && a.date >= from && a.date <= to);
  if (type === "financeiro") {
    const days = new Map();
    const bump = (date, k, v) => {
      const cur = days.get(date) ?? { in: 0, out: 0 };
      cur[k] += v;
      days.set(date, cur);
    };
    paid.forEach((c) => bump(c.paidAt.slice(0, 10), "in", c.amount));
    db.all("movements")
      .filter((m) => m.date >= from && m.date <= to)
      .forEach((m) =>
        bump(m.date, m.kind === "receita" ? "in" : "out", m.amount),
      );
    const rows = [...days]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => [
        dayjs(date).format("DD/MM/YYYY"),
        v.in,
        v.out,
        v.in - v.out,
      ]);
    const tIn = sum(rows, (r) => r[1]);
    const tOut = sum(rows, (r) => r[2]);
    return {
      header: ["Data", "Receitas (R$)", "Despesas (R$)", "Saldo (R$)"],
      rows: [...rows, ["Total", tIn, tOut, tIn - tOut]],
      numeric: [1, 2, 3],
    };
  }
  if (type === "produtividade") {
    const rows = db
      .all("users")
      .filter((u) => u.role === "vet")
      .map((v) => {
        const n = visits.filter((a) => a.vetId === v.id).length;
        const revenue = sum(paid.filter((c) => c.vetId === v.id));
        return [v.name, n, revenue, n ? revenue / n : 0];
      });
    return {
      header: [
        "Veterinário",
        "Atendimentos",
        "Faturamento (R$)",
        "Ticket médio (R$)",
      ],
      rows,
      numeric: [1, 2, 3],
    };
  }
  if (type === "pacientes") {
    const rows = db
      .all("pets")
      .filter(alive)
      .map((p) => {
        const mine = visits.filter((a) => a.petId === p.id);
        const kinds = [...new Set(mine.map((a) => a.type))].join(", ");
        return [
          p.name,
          p.species,
          tutorById(p.tutorId)?.name ?? "",
          mine.length,
          kinds || "—",
          mine.length
            ? dayjs(mine.sort(byDateTime).at(-1).date).format("DD/MM/YYYY")
            : "—",
        ];
      })
      .sort((a, b) => b[3] - a[3]);
    return {
      header: [
        "Paciente",
        "Espécie",
        "Tutor",
        "Atendimentos",
        "Procedimentos",
        "Último atendimento",
      ],
      rows,
      numeric: [3],
    };
  }
  const rows = db
    .all("vaccines")
    .map(withVaccineState)
    .filter((v) => v.state === "atrasada" || v.state === "proxima")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .map((v) => {
      const tutor = tutorById(v.pet?.tutorId);
      return [
        v.pet?.name ?? "",
        tutor?.name ?? "",
        tutor?.phone ?? "",
        v.name,
        dayjs(v.dueAt).format("DD/MM/YYYY"),
        v.state === "atrasada" ? "Atrasada" : "Em breve",
      ];
    });
  return {
    header: [
      "Paciente",
      "Tutor",
      "Telefone",
      "Vacina",
      "Prevista para",
      "Situação",
    ],
    rows,
    numeric: [],
  };
}

export const reports = {
  list: () =>
    call(() =>
      db
        .all("reports")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({
          ...r,
          name: REPORT_NAMES[r.type],
          author: userById(r.by),
        })),
    ),
  // POST /reports → arquivo
  generate: ({ type, from, to, format, by, save = true }) =>
    call(() => {
      const data = buildReport(type, from, to);
      if (save)
        db.insert("reports", {
          type,
          from,
          to,
          format,
          by,
          createdAt: dayjs().format("YYYY-MM-DDTHH:mm"),
        });
      return { ...data, name: REPORT_NAMES[type] };
    }),
};

export const demo = {
  reset: () => call(() => db.reset()),
};

export const api = {
  auth,
  staff,
  tutors,
  pets,
  appointments,
  care,
  records,
  charges,
  vaccines,
  reminders,
  prescriptions,
  documents,
  dashboard,
  finance,
  reports,
  demo,
};
