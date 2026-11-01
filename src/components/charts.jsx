import { Text } from "@mantine/core";
import { pct } from "../lib/format";

// valores do eixo e das colunas: "R$ 8,6 mil"
const compact = (v) =>
  v >= 1000
    ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : `R$ ${Math.round(v)}`;

// Colunas simples em SVG: grade de 4 linhas, rótulos embaixo, valor no topo da maior e da atual
export function ColumnChart({ data, format = compact, height = 220 }) {
  const W = 640;
  const H = height;
  const top = 22;
  const bottom = 26;
  const left = 64;
  const max = Math.max(...data.map((d) => d.value), 1);
  const nice = niceMax(max);
  const plotH = H - top - bottom;
  const slot = (W - left) / data.length;
  const bw = Math.min(44, slot * 0.56);
  const peak = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0,
  );

  return (
    <div className="colchart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de colunas">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = top + plotH * (1 - f);
          return (
            <g key={f}>
              <line
                x1={left}
                x2={W}
                y1={y}
                y2={y}
                stroke="var(--vc-line)"
                strokeDasharray={f === 0 ? undefined : "3 4"}
              />
              {f > 0 && (
                <text x={left - 10} y={y + 4} textAnchor="end">
                  {format(nice * f)}
                </text>
              )}
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / nice) * plotH;
          const x = left + slot * i + (slot - bw) / 2;
          const y = top + plotH - h;
          const showValue = i === peak || i === data.length - 1;
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${format(d.value)}${d.partial ? " (semana em andamento)" : ""}`}</title>
              <rect
                x={x}
                y={y}
                width={bw}
                height={Math.max(h, 1)}
                rx={3}
                fill={
                  d.partial ? "var(--mantine-color-teal-2)" : "var(--vc-teal)"
                }
              />
              {showValue && (
                <text
                  x={x + bw / 2}
                  y={y - 6}
                  textAnchor="middle"
                  style={{ fill: "var(--vc-ink)", fontWeight: 600 }}
                >
                  {format(d.value)}
                </text>
              )}
              <text x={x + bw / 2} y={H - 6} textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function niceMax(v) {
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}

// Barras horizontais com rótulo, valor e participação
export function BarList({ items, format, showShare = true }) {
  if (!items.length)
    return (
      <Text c="dimmed" size="sm">
        Sem dados no período.
      </Text>
    );
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="barlist">
      {items.map((i) => (
        <div className="barlist-row" key={i.label}>
          <div className="barlist-top">
            <span>{i.label}</span>
            <span className="tnum">
              {format(i.value)}
              {showShare && <span className="muted"> · {pct(i.share)}</span>}
            </span>
          </div>
          <div className="barlist-track">
            <div
              className="barlist-fill"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
