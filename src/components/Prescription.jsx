import { useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus, IconPrinter, IconTrash } from "@tabler/icons-react";
import { api } from "../api";
import { useSession } from "../auth/session";
import { useApi, useSubmit } from "../hooks/useApi";
import { act, toast } from "../lib/notify";
import { age, fmtDate, kg } from "../lib/format";
import { escapeHtml, printDocument, tableHtml } from "../lib/download";
import { FormActions, Pill } from "./ui";
import { RX_STATUS } from "../lib/status";

export const emptyItem = () => ({
  drug: "",
  dose: "",
  frequency: "",
  duration: "",
});

// Lista editável de medicamentos (usada na prescrição e na ficha de atendimento)
export function RxItemsEditor({ items, onChange, disabled, error }) {
  const set = (i, key, value) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: value } : it)));
  return (
    <Stack gap="sm">
      {items.map((it, i) => (
        <Group key={i} align="flex-end" gap="sm" wrap="nowrap">
          <SimpleGrid
            cols={{ base: 1, sm: 4 }}
            spacing="sm"
            style={{ flex: 1 }}
          >
            <TextInput
              label={i === 0 ? "Medicamento" : undefined}
              aria-label="Medicamento"
              placeholder="Ex.: Cefalexina 150 mg"
              value={it.drug}
              disabled={disabled}
              onChange={(e) => set(i, "drug", e.currentTarget.value)}
            />
            <TextInput
              label={i === 0 ? "Dose" : undefined}
              aria-label="Dose"
              placeholder="1 comprimido"
              value={it.dose}
              disabled={disabled}
              onChange={(e) => set(i, "dose", e.currentTarget.value)}
            />
            <TextInput
              label={i === 0 ? "Frequência" : undefined}
              aria-label="Frequência"
              placeholder="a cada 12 horas"
              value={it.frequency}
              disabled={disabled}
              onChange={(e) => set(i, "frequency", e.currentTarget.value)}
            />
            <TextInput
              label={i === 0 ? "Duração" : undefined}
              aria-label="Duração"
              placeholder="7 dias"
              value={it.duration}
              disabled={disabled}
              onChange={(e) => set(i, "duration", e.currentTarget.value)}
            />
          </SimpleGrid>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Remover medicamento"
            disabled={disabled || items.length === 1}
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      {error && (
        <Text c="red" size="xs">
          {error}
        </Text>
      )}
      <div>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconPlus size={14} />}
          disabled={disabled}
          onClick={() => onChange([...items, emptyItem()])}
        >
          Adicionar medicamento
        </Button>
      </div>
    </Stack>
  );
}

export const filledItems = (items) =>
  items
    .filter((i) => i.drug.trim())
    .map((i) => ({
      drug: i.drug.trim(),
      dose: i.dose.trim(),
      frequency: i.frequency.trim(),
      duration: i.duration.trim(),
    }));

export function PrescriptionModal({ opened, onClose, prescription, petId }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={prescription ? "Editar prescrição" : "Nova prescrição"}
      size="xl"
    >
      {opened && (
        <PrescriptionForm onClose={onClose} rx={prescription} petId={petId} />
      )}
    </Modal>
  );
}

function PrescriptionForm({ onClose, rx, petId }) {
  const { user } = useSession();
  const pets = useApi(() => api.pets.list(), []);
  const [items, setItems] = useState(
    rx?.items?.length ? rx.items : [emptyItem()],
  );
  const [itemsError, setItemsError] = useState(null);
  const form = useForm({
    initialValues: {
      petId: rx?.petId ?? petId ?? null,
      title: rx?.title ?? "",
      notes: rx?.notes ?? "",
    },
    validate: {
      petId: (v) => (v ? null : "Escolha o paciente"),
      title: (v) => (v.trim() ? null : "Dê um nome à prescrição"),
    },
  });
  const [saving, submit] = useSubmit();

  const save = (status) => {
    const valid = !form.validate().hasErrors;
    const list = filledItems(items);
    if (!list.length) setItemsError("Inclua pelo menos um medicamento");
    if (!valid || !list.length) return;
    submit(async () => {
      const v = form.values;
      const ok = await act(
        api.prescriptions.save({
          id: rx?.id,
          petId: v.petId,
          vetId: rx?.vetId ?? user.id,
          title: v.title.trim(),
          notes: v.notes.trim(),
          items: list,
          status,
        }),
        status === "emitida"
          ? "Prescrição emitida. O tutor já pode ver no portal."
          : "Rascunho salvo.",
      );
      if (ok) onClose();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("emitida");
      }}
      noValidate
    >
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="Paciente"
          searchable
          data={(pets.data ?? []).map((p) => ({
            value: p.id,
            label: `${p.name} · ${p.tutor?.name ?? ""}`,
          }))}
          disabled={!!rx || !!petId}
          {...form.getInputProps("petId")}
        />
        <TextInput
          label="Nome da prescrição"
          placeholder="Ex.: Tratamento dermatológico"
          {...form.getInputProps("title")}
        />
      </SimpleGrid>
      <Text size="sm" fw={500} mt="lg" mb="xs">
        Medicamentos
      </Text>
      <RxItemsEditor
        items={items}
        onChange={(next) => {
          setItems(next);
          setItemsError(null);
        }}
        error={itemsError}
      />
      <Textarea
        mt="md"
        label="Orientações ao tutor"
        autosize
        minRows={2}
        placeholder="Ex.: dar junto com a comida"
        {...form.getInputProps("notes")}
      />
      <FormActions
        onCancel={onClose}
        loading={saving}
        submitLabel="Gerar prescrição"
        extra={
          <Button
            variant="subtle"
            onClick={() => save("rascunho")}
            disabled={saving}
          >
            Salvar rascunho
          </Button>
        }
      />
    </form>
  );
}

export function printPrescription(rx) {
  const rows = rx.items.map((i) => [i.drug, i.dose, i.frequency, i.duration]);
  const ok = printDocument(
    rx.title,
    `<p><strong>Paciente:</strong> ${escapeHtml(rx.pet?.name)} · ${escapeHtml(rx.pet?.species)} ${escapeHtml(rx.pet?.breed)}<br>
     <strong>Tutor:</strong> ${escapeHtml(rx.tutor?.name ?? "")}<br>
     <strong>Data:</strong> ${fmtDate(rx.date)}</p>
     ${tableHtml(["Medicamento", "Dose", "Frequência", "Duração"], rows)}
     ${rx.notes ? `<h2>Orientações</h2><p>${escapeHtml(rx.notes)}</p>` : ""}
     <div class="sign">${escapeHtml(rx.vet?.name ?? "")}<br><span class="muted">${escapeHtml(rx.vet?.crmv ?? "")}</span></div>`,
  );
  if (!ok)
    toast.err(
      null,
      "O navegador bloqueou a janela de impressão. Libere pop-ups para este site.",
    );
}

// Visualização da prescrição em formato de documento
export function PrescriptionView({ rx, onClose, onEdit }) {
  return (
    <Modal
      opened={!!rx}
      onClose={onClose}
      title="Visualizar documento"
      size="lg"
    >
      {rx && (
        <>
          <div className="doc">
            <Group justify="space-between" align="flex-start">
              <div>
                <h3>{rx.title}</h3>
                <Text size="sm" c="dimmed">
                  {fmtDate(rx.date)} · {rx.vet?.name}{" "}
                  {rx.vet?.crmv ? `· ${rx.vet.crmv}` : ""}
                </Text>
              </div>
              <Pill status={rx.status} map={RX_STATUS} />
            </Group>
            <Text size="sm" mt="md">
              <strong>{rx.pet?.name}</strong> · {rx.pet?.species}{" "}
              {rx.pet?.breed} · {age(rx.pet?.birth)} · {kg(rx.pet?.weight)}
              {rx.tutor && <> · Tutor {rx.tutor.name}</>}
            </Text>
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dose</th>
                  <th>Frequência</th>
                  <th>Duração</th>
                </tr>
              </thead>
              <tbody>
                {rx.items.map((i, k) => (
                  <tr key={k}>
                    <td>{i.drug}</td>
                    <td>{i.dose}</td>
                    <td>{i.frequency}</td>
                    <td>{i.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rx.notes && (
              <Text size="sm" mt="md">
                <strong>Orientações:</strong> {rx.notes}
              </Text>
            )}
          </div>
          <Group justify="flex-end" mt="lg">
            {onEdit && rx.status === "rascunho" && (
              <Button variant="default" onClick={() => onEdit(rx)}>
                Continuar editando
              </Button>
            )}
            <Button
              leftSection={<IconPrinter size={16} />}
              onClick={() => printPrescription(rx)}
              disabled={rx.status === "rascunho"}
            >
              Baixar PDF
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
