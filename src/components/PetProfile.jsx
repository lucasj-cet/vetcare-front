import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertTriangle } from "@tabler/icons-react";
import { api } from "../api";
import { SERVICE_TYPES } from "../data/seed";
import { useSession } from "../auth/session";
import { useSubmit } from "../hooks/useApi";
import { act } from "../lib/notify";
import { age, fmtDate, kg, relDay, todayISO } from "../lib/format";
import { APPT_STATUS, VACCINE_STATUS } from "../lib/status";
import { DataTable, Empty, Facts, FormActions, PetAvatar, Pill } from "./ui";
import { PrescriptionView } from "./Prescription";

export function PetHeader({ profile, actions }) {
  const { pet, tutor } = profile;
  return (
    <>
      <Group
        justify="space-between"
        align="center"
        p="lg"
        pb="md"
        wrap="wrap"
        gap="md"
      >
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <PetAvatar pet={pet} size={48} />
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="lg">
              {pet.name}
            </Text>
            <Text size="sm" c="dimmed">
              {pet.species} · {pet.breed} · {pet.sex}
            </Text>
          </div>
        </Group>
        {actions}
      </Group>
      {pet.alerts && (
        <Alert
          color="red"
          variant="light"
          mx="lg"
          mb="md"
          icon={<IconAlertTriangle size={18} />}
          p="sm"
        >
          <Text size="sm" fw={500}>
            Alerta clínico: {pet.alerts}
          </Text>
        </Alert>
      )}
      <Facts
        items={[
          ["Idade", age(pet.birth)],
          ["Peso", kg(pet.weight)],
          ["Tutor", tutor ? tutor.name : null],
          ["Telefone", tutor?.phone],
          [
            "Última consulta",
            profile.lastVisit ? fmtDate(profile.lastVisit) : null,
          ],
        ]}
      />
    </>
  );
}

export function RecordList({ records }) {
  if (!records.length) return <Empty>Nenhum registro clínico ainda.</Empty>;
  return records.map((r) => (
    <div className="record" key={r.id}>
      <div>
        <div className="when">{fmtDate(r.date)}</div>
        <Text size="xs" c="dimmed">
          {r.type}
        </Text>
      </div>
      <div style={{ minWidth: 0 }}>
        <Text fw={600} size="sm">
          {r.diagnosis}
        </Text>
        <dl>
          <dt>Queixa</dt>
          <dd>{r.complaint}</dd>
          {r.exam && (
            <>
              <dt>Exame</dt>
              <dd>{r.exam}</dd>
            </>
          )}
          {r.conduct && (
            <>
              <dt>Conduta</dt>
              <dd>{r.conduct}</dd>
            </>
          )}
          <dt>Sinais</dt>
          <dd>
            {[
              r.weight && kg(r.weight),
              r.temperature && `${String(r.temperature).replace(".", ",")} °C`,
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </dd>
        </dl>
        <Text size="xs" c="dimmed" mt={6}>
          {r.vet?.name}
        </Text>
      </div>
    </div>
  ));
}

export function VaccineTable({ vaccines, onApply }) {
  return (
    <DataTable
      rows={vaccines}
      empty="Nenhuma vacina registrada."
      columns={[
        {
          key: "name",
          label: "Vacina",
          render: (v) => <span className="cell-main">{v.name}</span>,
        },
        {
          key: "date",
          label: "Data",
          render: (v) =>
            v.state === "aplicada"
              ? `Aplicada em ${fmtDate(v.appliedAt)}`
              : `Prevista para ${fmtDate(v.dueAt)}`,
        },
        { key: "lot", label: "Lote", render: (v) => v.lot ?? "—" },
        { key: "vet", label: "Veterinário", render: (v) => v.vet?.name ?? "—" },
        {
          key: "state",
          label: "Situação",
          render: (v) => <Pill status={v.state} map={VACCINE_STATUS} />,
        },
        ...(onApply
          ? [
              {
                key: "act",
                label: "",
                render: (v) =>
                  v.state !== "aplicada" && (
                    <Button
                      size="compact-xs"
                      variant="light"
                      onClick={() => onApply(v)}
                    >
                      Aplicar
                    </Button>
                  ),
              },
            ]
          : []),
      ]}
      mobile={{
        title: (v) => v.name,
        sub: (v) =>
          v.state === "aplicada"
            ? `Aplicada em ${fmtDate(v.appliedAt)}${v.lot ? ` · lote ${v.lot}` : ""}`
            : `Prevista para ${fmtDate(v.dueAt)} (${relDay(v.dueAt)})`,
        side: (v) => <Pill status={v.state} map={VACCINE_STATUS} />,
      }}
    />
  );
}

// Abas do histórico do paciente, usadas pelo prontuário e pelo portal do tutor
export function PetHistoryTabs({ profile, onApplyVaccine }) {
  const [rx, setRx] = useState(null);
  return (
    <>
      <Tabs defaultValue="historico">
        <Tabs.List px="lg">
          <Tabs.Tab value="historico">
            Histórico clínico ({profile.records.length})
          </Tabs.Tab>
          <Tabs.Tab value="vacinas">
            Vacinas ({profile.vaccines.length})
          </Tabs.Tab>
          <Tabs.Tab value="prescricoes">
            Prescrições ({profile.prescriptions.length})
          </Tabs.Tab>
          <Tabs.Tab value="consultas">
            Próximas consultas ({profile.upcoming.length})
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="historico">
          <RecordList records={profile.records} />
        </Tabs.Panel>
        <Tabs.Panel value="vacinas" pt="xs">
          <VaccineTable vaccines={profile.vaccines} onApply={onApplyVaccine} />
        </Tabs.Panel>
        <Tabs.Panel value="prescricoes" pt="xs">
          <DataTable
            rows={profile.prescriptions}
            empty="Nenhuma prescrição."
            onRowClick={(r) =>
              setRx({ ...r, pet: profile.pet, tutor: profile.tutor })
            }
            columns={[
              { key: "date", label: "Data", render: (r) => fmtDate(r.date) },
              {
                key: "title",
                label: "Prescrição",
                render: (r) => <span className="cell-main">{r.title}</span>,
              },
              {
                key: "items",
                label: "Medicamentos",
                render: (r) => r.items.map((i) => i.drug).join(", "),
              },
              { key: "vet", label: "Veterinário", render: (r) => r.vet?.name },
            ]}
            mobile={{
              title: (r) => r.title,
              sub: (r) =>
                `${fmtDate(r.date)} · ${r.items.length} medicamento(s)`,
            }}
          />
        </Tabs.Panel>
        <Tabs.Panel value="consultas" pt="xs">
          <DataTable
            rows={profile.upcoming}
            empty="Nenhuma consulta marcada."
            columns={[
              {
                key: "date",
                label: "Data",
                render: (a) => `${fmtDate(a.date)} às ${a.time}`,
              },
              { key: "type", label: "Atendimento", render: (a) => a.type },
              {
                key: "vet",
                label: "Veterinário",
                render: (a) => a.vet?.name ?? "A definir",
              },
              {
                key: "status",
                label: "Situação",
                render: (a) => <Pill status={a.status} map={APPT_STATUS} />,
              },
            ]}
            mobile={{
              title: (a) => `${fmtDate(a.date)} às ${a.time}`,
              sub: (a) => `${a.type} · ${a.vet?.name ?? "A definir"}`,
              side: (a) => <Pill status={a.status} map={APPT_STATUS} />,
            }}
          />
        </Tabs.Panel>
      </Tabs>
      <PrescriptionView rx={rx} onClose={() => setRx(null)} />
    </>
  );
}

// Novo registro avulso no prontuário (fora de um atendimento da agenda)
export function RecordModal({ opened, onClose, pet }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Novo registro no prontuário${pet ? ` · ${pet.name}` : ""}`}
      size="lg"
    >
      {opened && pet && <RecordForm onClose={onClose} pet={pet} />}
    </Modal>
  );
}

function RecordForm({ onClose, pet }) {
  const { user } = useSession();
  const form = useForm({
    initialValues: {
      type: "Consulta",
      weight: pet.weight ?? "",
      temperature: "",
      complaint: "",
      exam: "",
      diagnosis: "",
      conduct: "",
    },
    validate: {
      complaint: (v) => (v.trim() ? null : "Descreva a queixa ou o motivo"),
      diagnosis: (v) =>
        v.trim() ? null : "Informe o diagnóstico ou a suspeita",
    },
  });
  const [saving, submit] = useSubmit();
  const onSubmit = form.onSubmit((v) =>
    submit(async () => {
      const ok = await act(
        api.records.create({
          petId: pet.id,
          vetId: user.id,
          date: todayISO(),
          type: v.type,
          weight: v.weight === "" ? null : Number(v.weight),
          temperature: v.temperature === "" ? null : Number(v.temperature),
          complaint: v.complaint.trim(),
          exam: v.exam.trim(),
          diagnosis: v.diagnosis.trim(),
          conduct: v.conduct.trim(),
        }),
        "Registro salvo no prontuário.",
      );
      if (ok) onClose();
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Select
          label="Tipo"
          data={SERVICE_TYPES}
          allowDeselect={false}
          {...form.getInputProps("type")}
        />
        <NumberInput
          label="Peso"
          suffix=" kg"
          decimalSeparator=","
          decimalScale={1}
          hideControls
          {...form.getInputProps("weight")}
        />
        <NumberInput
          label="Temperatura"
          suffix=" °C"
          decimalSeparator=","
          decimalScale={1}
          hideControls
          {...form.getInputProps("temperature")}
        />
      </SimpleGrid>
      <TextInput
        mt="md"
        label="Queixa / motivo"
        {...form.getInputProps("complaint")}
      />
      <Textarea
        mt="md"
        label="Exame físico"
        autosize
        minRows={2}
        {...form.getInputProps("exam")}
      />
      <TextInput
        mt="md"
        label="Diagnóstico"
        {...form.getInputProps("diagnosis")}
      />
      <Textarea
        mt="md"
        label="Conduta"
        autosize
        minRows={2}
        {...form.getInputProps("conduct")}
      />
      <FormActions
        onCancel={onClose}
        loading={saving}
        submitLabel="Salvar registro"
      />
    </form>
  );
}
