import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Drawer, Group, Stack, Text } from "@mantine/core";
import { IconCalendarPlus } from "@tabler/icons-react";
import dayjs from "dayjs";
import { api } from "../../api";
import { useSession } from "../../auth/session";
import { useApi } from "../../hooks/useApi";
import { age, fmtDate, kg, relDay, todayISO } from "../../lib/format";
import { APPT_STATUS } from "../../lib/status";
import AppointmentModal from "../../components/AppointmentModal";
import { PetHeader, PetHistoryTabs } from "../../components/PetProfile";
import {
  Async,
  Block,
  Empty,
  Facts,
  PageHeader,
  PetAvatar,
  Pill,
} from "../../components/ui";

export default function MeusPets() {
  const { user } = useSession();
  const navigate = useNavigate();
  const tutorId = user.tutorId;
  const pets = useApi(() => api.pets.list({ tutorId }), [tutorId]);
  const appts = useApi(() => api.appointments.forTutor(tutorId), [tutorId]);
  const docs = useApi(() => api.documents.forTutor(tutorId), [tutorId]);
  const [schedule, setSchedule] = useState(null);
  const [profile, setProfile] = useState(null);

  const next = (appts.data ?? []).filter(
    (a) =>
      a.date >= todayISO() && !["concluida", "cancelada"].includes(a.status),
  );
  const firstName = user.name.split(" ")[0];
  const due = (pets.data ?? [])
    .map((p) => p.nextVaccine && { pet: p, v: p.nextVaccine })
    .filter(Boolean)
    .sort((a, b) => a.v.dueAt.localeCompare(b.v.dueAt))[0];

  return (
    <>
      <PageHeader
        title="Meus pets"
        finding={
          due
            ? `Olá, ${firstName}. ${due.pet.name} tem ${due.v.name} ${due.v.state === "atrasada" ? `atrasada desde ${fmtDate(due.v.dueAt)}` : `prevista para ${fmtDate(due.v.dueAt)} (${relDay(due.v.dueAt)})`}.`
            : `Olá, ${firstName}.`
        }
      >
        <Button
          leftSection={<IconCalendarPlus size={16} />}
          onClick={() => setSchedule({})}
        >
          Agendar consulta
        </Button>
      </PageHeader>

      <div className="stack">
        <Async q={pets}>
          {(list) =>
            list.length === 0 ? (
              <Block>
                <Empty>
                  Nenhum pet no seu cadastro. Fale com a recepção para incluir.
                </Empty>
              </Block>
            ) : (
              <div className="grid-even">
                {list.map((p) => (
                  <Block key={p.id} flush>
                    <Group justify="space-between" p="lg" pb="md" wrap="nowrap">
                      <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                        <PetAvatar pet={p} size={52} />
                        <div style={{ minWidth: 0 }}>
                          <Text fw={600} size="lg">
                            {p.name}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {p.breed} · {age(p.birth)} · {kg(p.weight)}
                          </Text>
                        </div>
                      </Group>
                      {p.overdue ? (
                        <Badge color="red">Vacina atrasada</Badge>
                      ) : (
                        <Badge color="teal">Vacinas em dia</Badge>
                      )}
                    </Group>
                    <Facts
                      items={[
                        [
                          "Última consulta",
                          p.lastVisit ? fmtDate(p.lastVisit) : null,
                        ],
                        [
                          "Próxima vacina",
                          p.nextVaccine
                            ? `${p.nextVaccine.name} · ${fmtDate(p.nextVaccine.dueAt)}`
                            : null,
                        ],
                      ]}
                    />
                    <div
                      className="block-foot"
                      style={{ justifyContent: "flex-end" }}
                    >
                      <Button
                        variant="default"
                        size="xs"
                        onClick={() => setProfile(p.id)}
                      >
                        Ver perfil completo
                      </Button>
                      <Button
                        variant="light"
                        size="xs"
                        onClick={() => setSchedule({ petId: p.id })}
                      >
                        Agendar consulta
                      </Button>
                    </div>
                  </Block>
                ))}
              </div>
            )
          }
        </Async>

        <div className="grid-even">
          <Block
            title="Próximas consultas"
            flush
            footer={
              <Button
                variant="subtle"
                size="xs"
                onClick={() => navigate("/tutor/consultas")}
              >
                Ver todas
              </Button>
            }
          >
            <Async q={appts}>
              {() =>
                next.length === 0 ? (
                  <Empty>Nenhuma consulta marcada.</Empty>
                ) : (
                  <div className="mrows">
                    {next.slice(0, 3).map((a) => (
                      <div className="mrow" key={a.id}>
                        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                          <div
                            style={{
                              textAlign: "center",
                              width: 44,
                              flexShrink: 0,
                            }}
                          >
                            <Text size="xs" c="dimmed" tt="uppercase">
                              {dayjs(a.date).format("MMM")}
                            </Text>
                            <Text fw={600} size="lg" lh={1.1} className="tnum">
                              {dayjs(a.date).format("DD")}
                            </Text>
                          </div>
                          <div className="mrow-main">
                            <div className="mrow-title">
                              {a.notes && a.source !== "tutor"
                                ? a.notes
                                : a.type}{" "}
                              · {a.pet.name}
                            </div>
                            <div className="cell-sub">
                              {a.time} ·{" "}
                              {a.vet?.name ?? "Veterinário a definir"}
                            </div>
                          </div>
                        </Group>
                        <Pill
                          status={
                            a.status === "solicitada"
                              ? "solicitada"
                              : "agendada"
                          }
                          map={{
                            solicitada: {
                              label: "Aguardando confirmação",
                              color: "yellow",
                            },
                            agendada: { label: "Confirmada", color: "teal" },
                          }}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )
              }
            </Async>
          </Block>

          <Block
            title="Receitas e exames recentes"
            flush
            footer={
              <Button
                variant="subtle"
                size="xs"
                onClick={() => navigate("/tutor/receitas")}
              >
                Ver todos
              </Button>
            }
          >
            <Async q={docs}>
              {(list) =>
                list.length === 0 ? (
                  <Empty>Nenhum documento ainda.</Empty>
                ) : (
                  <div className="mrows">
                    {list.slice(0, 3).map((d) => (
                      <button
                        type="button"
                        className="mrow"
                        key={d.id}
                        onClick={() => navigate("/tutor/receitas")}
                      >
                        <div className="mrow-main">
                          <div className="mrow-title">{d.title}</div>
                          <div className="cell-sub">
                            {d.pet.name} · {fmtDate(d.date)}
                          </div>
                        </div>
                        <Text size="xs" c="dimmed">
                          {d.kind === "exame" ? "Exame" : "Prescrição"}
                        </Text>
                      </button>
                    ))}
                  </div>
                )
              }
            </Async>
          </Block>
        </div>
      </div>

      <AppointmentModal
        opened={!!schedule}
        onClose={() => setSchedule(null)}
        mode="tutor"
        tutorId={tutorId}
        defaults={schedule ?? undefined}
      />
      <Drawer
        opened={!!profile}
        onClose={() => setProfile(null)}
        title="Perfil do pet"
        size="xl"
      >
        {profile && <PetProfileView petId={profile} />}
      </Drawer>
    </>
  );
}

function PetProfileView({ petId }) {
  const q = useApi(() => api.pets.profile(petId), [petId]);
  return (
    <Async q={q}>
      {(p) => (
        <Stack
          gap={0}
          style={{
            border: "1px solid var(--vc-line)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <PetHeader profile={p} />
          <PetHistoryTabs profile={p} />
          {p.upcoming.length > 0 && (
            <Text size="xs" c="dimmed" p="md">
              {p.upcoming.length} consulta(s) marcada(s). Situação da próxima:{" "}
              {APPT_STATUS[p.upcoming[0].status].label.toLowerCase()}.
            </Text>
          )}
        </Stack>
      )}
    </Async>
  );
}
