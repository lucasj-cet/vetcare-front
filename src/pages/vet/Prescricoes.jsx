import { useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  SegmentedControl,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPlus, IconPrinter, IconSearch } from "@tabler/icons-react";
import { api } from "../../api";
import { useApi } from "../../hooks/useApi";
import { fmtDate, todayISO } from "../../lib/format";
import { RX_STATUS } from "../../lib/status";
import {
  PrescriptionModal,
  PrescriptionView,
  printPrescription,
} from "../../components/Prescription";
import {
  Async,
  Block,
  DataTable,
  Kpis,
  KpisLoading,
  PageHeader,
  Pill,
} from "../../components/ui";

export default function Prescricoes() {
  const [view, setView] = useState("todas");
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 200);
  const [edit, setEdit] = useState(null); // { rx? }
  const [show, setShow] = useState(null);
  const q = useApi(() => api.prescriptions.list(), []);
  const all = q.data ?? [];
  const today = todayISO();
  const s = debounced.trim().toLowerCase();
  const rows = all
    .filter((r) => view === "todas" || r.status === view)
    .filter(
      (r) =>
        !s ||
        [
          r.title,
          r.pet?.name,
          r.tutor?.name,
          ...r.items.map((i) => i.drug),
        ].some((f) => f?.toLowerCase().includes(s)),
    );
  const drafts = all.filter((r) => r.status === "rascunho").length;

  return (
    <>
      <PageHeader
        title="Prescrições"
        finding={
          q.data
            ? drafts
              ? `${drafts} ${drafts === 1 ? "rascunho" : "rascunhos"} esperando emissão`
              : "Todas as prescrições foram emitidas"
            : undefined
        }
      >
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setEdit({})}
        >
          Nova prescrição
        </Button>
      </PageHeader>
      <div className="stack">
        {q.data ? (
          <Kpis
            items={[
              {
                label: "Emitidas hoje",
                value: all.filter(
                  (r) => r.status === "emitida" && r.date === today,
                ).length,
              },
              { label: "Rascunhos", value: drafts },
              {
                label: "No mês",
                value: all.filter(
                  (r) => r.date.slice(0, 7) === today.slice(0, 7),
                ).length,
              },
            ]}
          />
        ) : (
          <KpisLoading n={3} />
        )}
        <Block
          title="Prescrições"
          actions={
            <>
              <TextInput
                leftSection={<IconSearch size={15} />}
                placeholder="Paciente, tutor ou medicamento"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                w={{ base: "100%", sm: 260 }}
                aria-label="Buscar"
              />
              <SegmentedControl
                size="xs"
                value={view}
                onChange={setView}
                data={[
                  { value: "todas", label: "Todas" },
                  { value: "emitida", label: "Emitidas" },
                  { value: "rascunho", label: "Rascunhos" },
                ]}
              />
            </>
          }
          flush
        >
          <Async q={q} rows={5}>
            {() => (
              <DataTable
                rows={rows}
                empty="Nenhuma prescrição encontrada."
                onRowClick={setShow}
                columns={[
                  { key: "d", label: "Data", render: (r) => fmtDate(r.date) },
                  {
                    key: "p",
                    label: "Paciente",
                    render: (r) => (
                      <>
                        <div className="cell-main">{r.pet?.name}</div>
                        <div className="cell-sub">{r.tutor?.name}</div>
                      </>
                    ),
                  },
                  {
                    key: "t",
                    label: "Prescrição",
                    render: (r) => (
                      <>
                        <div>{r.title}</div>
                        <div className="cell-sub">
                          {r.items.map((i) => i.drug).join(", ")}
                        </div>
                      </>
                    ),
                  },
                  {
                    key: "v",
                    label: "Veterinário",
                    render: (r) => r.vet?.name,
                  },
                  {
                    key: "s",
                    label: "Situação",
                    render: (r) => <Pill status={r.status} map={RX_STATUS} />,
                  },
                  {
                    key: "a",
                    label: "",
                    render: (r) => (
                      <Group
                        gap={4}
                        wrap="nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.status === "rascunho" ? (
                          <Button
                            size="compact-sm"
                            variant="light"
                            onClick={() => setEdit({ rx: r })}
                          >
                            Continuar
                          </Button>
                        ) : (
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            aria-label="Imprimir"
                            onClick={() => printPrescription(r)}
                          >
                            <IconPrinter size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    ),
                  },
                ]}
                mobile={{
                  title: (r) => `${r.pet?.name} · ${r.title}`,
                  sub: (r) =>
                    `${fmtDate(r.date)} · ${r.items.length} medicamento(s)`,
                  side: (r) => (
                    <Pill status={r.status} map={RX_STATUS} size="sm" />
                  ),
                }}
                minWidth={820}
              />
            )}
          </Async>
        </Block>
      </div>
      <PrescriptionModal
        opened={!!edit}
        onClose={() => setEdit(null)}
        prescription={edit?.rx}
      />
      <PrescriptionView
        rx={show}
        onClose={() => setShow(null)}
        onEdit={(rx) => {
          setShow(null);
          setEdit({ rx });
        }}
      />
    </>
  );
}
