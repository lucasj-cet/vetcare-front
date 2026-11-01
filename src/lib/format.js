import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

export const ISO = "YYYY-MM-DD";
export const todayISO = () => dayjs().format(ISO);
export const toISO = (d) => (d ? dayjs(d).format(ISO) : null);

export const brl = (v) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// valores grandes nos indicadores: "R$ 48,2 mil"
export const brlShort = (v) =>
  Math.abs(v) >= 10000
    ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : brl(v);

export const int = (v) => (v ?? 0).toLocaleString("pt-BR");
export const pct = (v) => `${Math.round(v * 100)}%`;

export const fmtDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");
export const fmtShort = (d) => (d ? dayjs(d).format("D MMM") : "—");
export const fmtLong = (d) => dayjs(d).format("dddd, D [de] MMMM");
export const fmtDateTime = (d) =>
  d ? dayjs(d).format("DD/MM/YYYY [às] HH:mm") : "—";

export function relDay(d) {
  const diff = dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return diff > 1 ? `em ${diff} dias` : `há ${-diff} dias`;
}

export function age(birth) {
  if (!birth) return "—";
  const years = dayjs().diff(birth, "year");
  if (years >= 1) return `${years} ${years === 1 ? "ano" : "anos"}`;
  const months = Math.max(dayjs().diff(birth, "month"), 0);
  return `${months} ${months === 1 ? "mês" : "meses"}`;
}

export const kg = (w) =>
  w == null || w === ""
    ? "—"
    : `${Number(w).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;

export const initials = (name = "") =>
  name
    .replace(/^(Dra?\.)\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

export const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const onlyDigits = (v = "") => v.replace(/\D/g, "");

export function maskCpf(v = "") {
  return onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(v = "") {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export const isEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// primeiro dia (segunda) da semana de uma data
export const weekStart = (d) => {
  const day = dayjs(d).startOf("day");
  return day.subtract((day.day() + 6) % 7, "day");
};
