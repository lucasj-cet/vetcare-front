import {
  Avatar,
  Badge,
  Button,
  Group,
  Modal,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { initials } from "../lib/format";

export const PHONE = "(max-width: 767px)";
export const usePhone = () => useMediaQuery(PHONE);

export function PageHeader({ title, finding, children }) {
  return (
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {finding && <p className="finding">{finding}</p>}
      </div>
      {children && (
        <Group gap="sm" wrap="wrap">
          {children}
        </Group>
      )}
    </div>
  );
}

// Indicadores num contêiner só, divididos por linhas finas
export function Kpis({ items }) {
  return (
    <div className="kpis" style={{ "--n": items.length }}>
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          {k.hint && (
            <div className={`kpi-hint ${k.trend ?? ""}`}>{k.hint}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function KpisLoading({ n = 4 }) {
  return (
    <div className="kpis" style={{ "--n": n }}>
      {Array.from({ length: n }, (_, i) => (
        <div className="kpi" key={i}>
          <Skeleton height={12} width="50%" />
          <Skeleton height={24} width="70%" mt={10} />
        </div>
      ))}
    </div>
  );
}

export function Block({
  title,
  sub,
  actions,
  children,
  flush,
  footer,
  className = "",
}) {
  return (
    <section className={`block ${className}`}>
      {(title || actions) && (
        <div className="block-head">
          <div style={{ minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {sub && <div className="sub">{sub}</div>}
          </div>
          {actions && (
            <Group gap="xs" wrap="wrap">
              {actions}
            </Group>
          )}
        </div>
      )}
      {flush ? children : <div className="block-body">{children}</div>}
      {footer && <div className="block-foot">{footer}</div>}
    </section>
  );
}

export function Pill({ status, map, size = "md" }) {
  const s = map[status];
  if (!s) return null;
  return (
    <Badge color={s.color} size={size}>
      {s.label}
    </Badge>
  );
}

export function Empty({ children, action }) {
  return (
    <div className="empty">
      <Text c="dimmed" size="sm">
        {children}
      </Text>
      {action}
    </div>
  );
}

export function LoadingRows({ rows = 4 }) {
  return (
    <Stack gap={12} p="md">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={16} width={`${90 - (i % 3) * 15}%`} />
      ))}
    </Stack>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <Empty
      action={
        onRetry && (
          <Button variant="default" size="xs" onClick={() => onRetry()}>
            Tentar de novo
          </Button>
        )
      }
    >
      Não foi possível carregar estas informações.
    </Empty>
  );
}

// Mostra carregando / erro / conteúdo de uma consulta do useApi ou do React Query
export function Async({ q, rows, children }) {
  if (q.error && q.data === undefined) {
    return <ErrorState onRetry={q.reload ?? q.refetch} />;
  }
  if (q.data === undefined) return <LoadingRows rows={rows} />;
  return children(q.data);
}

export const Dash = () => <span className="faint">—</span>;

export function PersonAvatar({ name, size = 32, color = "teal" }) {
  return (
    <Avatar
      size={size}
      radius="xl"
      color={color}
      variant="light"
      style={{ flexShrink: 0 }}
    >
      <span style={{ fontSize: size * 0.38, fontWeight: 600 }}>
        {initials(name)}
      </span>
    </Avatar>
  );
}

export function PetAvatar({ pet, size = 36 }) {
  return (
    <PersonAvatar
      name={pet?.name ?? "?"}
      size={size}
      color={pet?.species === "Gato" ? "grape" : "teal"}
    />
  );
}

/**
 * Tabela que no celular vira lista de duas linhas.
 * columns: [{ key, label, render(row), num, width }]
 * mobile: { title(row), sub(row), side(row) }
 */
export function DataTable({
  columns,
  rows,
  onRowClick,
  empty = "Nada por aqui.",
  mobile,
  footer,
  minWidth = 640,
  fixed = false,
}) {
  const phone = usePhone();
  if (!rows.length) return <Empty>{empty}</Empty>;

  if (phone && mobile) {
    const Row = onRowClick ? "button" : "div";
    return (
      <div className="mrows">
        {rows.map((r) => (
          <Row
            key={r.id}
            className="mrow"
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            type={onRowClick ? "button" : undefined}
          >
            <div className="mrow-main">
              <div className="mrow-title">{mobile.title(r)}</div>
              {mobile.sub && <div className="cell-sub">{mobile.sub(r)}</div>}
            </div>
            {mobile.side && <div className="mrow-side">{mobile.side(r)}</div>}
          </Row>
        ))}
        {footer && (
          <div className="mrow" style={{ fontWeight: 600 }}>
            {footer.mobile}
          </div>
        )}
      </div>
    );
  }

  return (
    <Table.ScrollContainer minWidth={minWidth} type="native">
      <Table
        className="vc-table"
        highlightOnHover={!!onRowClick}
        style={fixed ? { tableLayout: "fixed" } : undefined}
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th
                key={c.key}
                className={c.num ? "num" : undefined}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr
              key={r.id}
              className={onRowClick ? "clickable" : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => e.key === "Enter" && onRowClick(r)
                  : undefined
              }
            >
              {columns.map((c) => (
                <Table.Td key={c.key} className={c.num ? "num" : undefined}>
                  {c.render ? c.render(r) : (r[c.key] ?? <Dash />)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
        {footer && (
          <Table.Tfoot>
            <Table.Tr>{footer.cells}</Table.Tr>
          </Table.Tfoot>
        )}
      </Table>
    </Table.ScrollContainer>
  );
}

export function ConfirmDialog({
  opened,
  title,
  children,
  confirmLabel = "Excluir",
  color = "red",
  onConfirm,
  onClose,
  loading,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="sm">
      <Text size="sm">{children}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Voltar
        </Button>
        <Button color={color} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}

export function FormActions({ onCancel, submitLabel, loading, extra }) {
  return (
    <Group justify="flex-end" mt="lg" gap="sm">
      {extra}
      <Button variant="default" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </Group>
  );
}

// Par chave/valor para fichas e detalhes
export function Facts({ items }) {
  return (
    <div className="facts">
      {items.map(([k, v]) => (
        <div className="fact" key={k}>
          <div className="k">{k}</div>
          <div className="v">{v ?? <Dash />}</div>
        </div>
      ))}
    </div>
  );
}
