import dayjs from "dayjs";
import { buildSeed } from "../data/seed";

// Banco de demonstração guardado no navegador. Só os serviços de src/api/index.js falam com ele.

const KEY = "vetcare.demo.v1";

function persist(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sem armazenamento: segue só em memória */
  }
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    // os dados são montados em volta do dia de hoje; num novo dia, recomeçam
    if (saved && saved.seededOn === dayjs().format("YYYY-MM-DD")) return saved;
  } catch {
    /* recria abaixo */
  }
  const fresh = buildSeed();
  persist(fresh);
  return fresh;
}

let state = load();
let batching = false;
let seq = 0;

function commit() {
  if (batching) return;
  persist(state);
}

export const db = {
  all: (table) => state[table],
  find: (table, id) => state[table].find((r) => r.id === id),
  insert(table, row) {
    const rec = {
      id: `${table.slice(0, 2)}${Date.now().toString(36)}${(++seq).toString(36)}`,
      ...row,
    };
    state = { ...state, [table]: [...state[table], rec] };
    commit();
    return rec;
  },
  update(table, id, patch) {
    let out;
    state = {
      ...state,
      [table]: state[table].map((r) =>
        r.id === id ? (out = { ...r, ...patch }) : r,
      ),
    };
    commit();
    return out;
  },
  remove(table, id) {
    state = { ...state, [table]: state[table].filter((r) => r.id !== id) };
    commit();
  },
  // várias escritas, um só aviso de mudança
  batch(fn) {
    batching = true;
    try {
      return fn();
    } finally {
      batching = false;
      commit();
    }
  },
  reset() {
    state = buildSeed();
    commit();
  },
};
