import { useState } from "react";
import { Button, SegmentedControl } from "@mantine/core";
import { IconCalendarPlus } from "@tabler/icons-react";
import { api } from "../../api";
import { useSession } from "../../auth/session";
import { useApi, useSubmit } from "../../hooks/useApi";
import { act } from "../../lib/notify";
import { fmtDate, relDay, todayISO } from "../../lib/format";
import AppointmentModal from "../../components/AppointmentModal";
import {
  Async,
  Block,
  ConfirmDialog,
  DataTable,
  Kpis,
  KpisLoading,
  PageHeader,
  Pill,
} from "../../components/ui";

// no portal, "agendada" aparece como confirmada e "solicitada" como aguardando confirmação
const TUTOR_STATUS = {
  solicitada: { label: "Aguardando confirmação", color: "yellow" },
  agendada: { label: "Confirmada", color: "teal" },
  aguardando: { label: "Na clínica", color: "orange" },
  em_atendimento: { label: "Em atendimento", color: "teal" },
  concluida: { label: "Realizada", color: "gray" },
  cancelada: { label: "Cancelada", color: "red" },
};

export default function Consultas() {
  const { user } = useSession();
  const tutorId = user.tutorId;
  const q = useApi(() => api.appointments.forTutor(tutorId), [tutorId]);
  const [view, setView] = useState("proximas");
  const [schedule, setSchedule] = useState(false);
  const [cancel, setCancel] = useState(null);
  const [busy, submit] = useSubmit();
  const all = q.data ?? [];
  const today = todayISO();
  const upcoming = all.filter(
    (a) => a.date >= today && !["concluida", "cancelada"].includes(a.status),
  );
  const past = all.filter((a) => !upcoming.includes(a)).reverse();
  const rows = view === "proximas" ? upcoming : past;

  return (
    <>
      <PageHeader
        title="Consultas"
        finding={
          q.data
            ? upcoming[0]
              ? `Próxima: ${upcoming[0].pet.name}, ${fmtDate(upcoming[0].date)} às ${upcoming[0].time} (${relDay(upcoming[0].date)})`
              : "Nenhuma consulta marcada"
            : undefined
        }
      >
        <Button
          leftSection={<IconCalendarPlus size={16} />}
          onClick={() => setSchedule(true)}
        >
          Agendar consulta
        </Button>
      </PageHeader>
      <div className="stack">
        {q.data ? (
          <Kpis
            items={[
              {
                label: "Próximas",
                value: upcoming.length,
                hint: upcoming.some((a) => a.status === "solicitada")
                  ? `${upcoming.filter((a) => a.status === "solicitada").length} aguardando confirmação`
                  : undefined,
              },
              {
                label: "Realizadas",
                value: all.filter((a) => a.status === "concluida").length,
              },
              {
                label: "Canceladas",
                value: all.filter((a) => a.status === "cancelada").length,
              },
            ]}
          />
        ) : (
          <KpisLoading n={3} />
        )}
        <Block
          title="Minhas consultas"
          actions={
            <SegmentedControl
              size="xs"
              value={view}
              onChange={setView}
              data={[
                { value: "proximas", label: "Próximas" },
                { value: "historico", label: "Histórico" },
              ]}
            />
          }
          flush
        >
          <Async q={q} rows={5}>
            {() => (
              <DataTable
                rows={rows}
                empty={
                  view === "proximas"
                    ? "Nenhuma consulta marcada. Use “Agendar consulta” para pedir um horário."
                    : "Nenhuma consulta no histórico."
                }
                columns={[
                  {
                    key: "d",
                    label: "Data",
                    render: (a) => (
                      <>
                        <div className="tnum">
                          {fmtDate(a.date)} às {a.time}
                        </div>
                        <div className="cell-sub">{relDay(a.date)}</div>
                      </>
                    ),
                  },
                  {
                    key: "p",
                    label: "Pet",
                    render: (a) => (
                      <span className="cell-main">{a.pet.name}</span>
                    ),
                  },
                  {
                    key: "t",
                    label: "Atendimento",
                    render: (a) => (
                      <>
                        <div>{a.type}</div>
                        {a.notes && <div className="cell-sub">{a.notes}</div>}
                      </>
                    ),
                  },
                  {
                    key: "v",
                    label: "Veterinário",
                    render: (a) => a.vet?.name ?? "A definir",
                  },
                  {
                    key: "s",
                    label: "Situação",
                    render: (a) => (
                      <Pill status={a.status} map={TUTOR_STATUS} />
                    ),
                  },
                  ...(view === "proximas"
                    ? [
                        {
                          key: "a",
                          label: "",
                          render: (a) =>
                            ["solicitada", "agendada"].includes(a.status) && (
                              <Button
                                size="compact-sm"
                                variant="subtle"
                                color="red"
                                onClick={() => setCancel(a)}
                              >
                                Cancelar
                              </Button>
                            ),
                        },
                      ]
                    : []),
                ]}
                mobile={{
                  title: (a) => `${a.pet.name} · ${a.type}`,
                  sub: (a) =>
                    `${fmtDate(a.date)} às ${a.time} · ${a.vet?.name ?? "A definir"}`,
                  side: (a) => (
                    <>
                      <Pill status={a.status} map={TUTOR_STATUS} size="sm" />
                      {view === "proximas" &&
                        ["solicitada", "agendada"].includes(a.status) && (
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            color="red"
                            onClick={() => setCancel(a)}
                          >
                            Cancelar
                          </Button>
                        )}
                    </>
                  ),
                }}
                minWidth={760}
              />
            )}
          </Async>
        </Block>
      </div>
      <AppointmentModal
        opened={schedule}
        onClose={() => setSchedule(false)}
        mode="tutor"
        tutorId={tutorId}
      />
      <ConfirmDialog
        opened={!!cancel}
        onClose={() => setCancel(null)}
        title="Cancelar consulta"
        confirmLabel="Cancelar consulta"
        loading={busy}
        onConfirm={() =>
          submit(async () => {
            if (
              await act(
                api.appointments.cancelByTutor(cancel.id),
                "Consulta cancelada. A clínica foi avisada.",
              )
            )
              setCancel(null);
          })
        }
      >
        Cancelar a consulta de {cancel?.pet.name} em {fmtDate(cancel?.date)} às{" "}
        {cancel?.time}? O horário fica livre para outro paciente.
      </ConfirmDialog>
    </>
  );
}
