import { useEffect, useMemo } from "react";
import { Modal, Select, SimpleGrid, Text, Textarea } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import { api } from "../api";
import { SERVICE_TYPES } from "../data/seed";
import { useApi, useSubmit } from "../hooks/useApi";
import { act } from "../lib/notify";
import { toISO, todayISO } from "../lib/format";
import { FormActions } from "./ui";

/**
 * Agendar / remarcar consulta.
 * mode "recepcao": marca direto, com veterinário obrigatório.
 * mode "tutor": vira um pedido que a recepção confirma; veterinário é opcional.
 */
export default function AppointmentModal({
  opened,
  onClose,
  mode = "recepcao",
  appointment,
  defaults,
  tutorId,
}) {
  const title = appointment
    ? "Remarcar consulta"
    : mode === "tutor"
      ? "Agendar consulta"
      : "Novo agendamento";
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      {opened && (
        <AppointmentForm
          onClose={onClose}
          mode={mode}
          appointment={appointment}
          defaults={defaults}
          tutorId={tutorId}
        />
      )}
    </Modal>
  );
}

function AppointmentForm({
  onClose,
  mode,
  appointment: a,
  defaults = {},
  tutorId,
}) {
  const isTutor = mode === "tutor";
  const form = useForm({
    initialValues: {
      petId: a?.petId ?? defaults.petId ?? null,
      type: a?.type ?? defaults.type ?? "Consulta",
      vetId: a?.vetId ?? defaults.vetId ?? (isTutor ? "any" : null),
      date: dayjs(a?.date ?? defaults.date ?? todayISO()).toDate(),
      time: a?.time ?? null,
      notes: a?.notes ?? "",
    },
    validate: {
      petId: (v) => (v ? null : "Escolha o paciente"),
      vetId: (v) => (v ? null : "Escolha o veterinário"),
      date: (v) => (v ? null : "Escolha a data"),
      time: (v) => (v ? null : "Escolha um horário livre"),
    },
  });
  const v = form.values;
  const date = toISO(v.date);
  const vetId = v.vetId === "any" ? null : v.vetId;

  const pets = useApi(
    () => api.pets.list({ tutorId: isTutor ? tutorId : undefined }),
    [isTutor, tutorId],
  );
  const vets = useApi(() => api.staff.vets(), []);
  const slots = useApi(
    () =>
      date
        ? api.appointments.slots({ date, vetId, type: v.type, ignoreId: a?.id })
        : Promise.resolve([]),
    [date, vetId, v.type],
  );

  const slotData = useMemo(
    () =>
      (slots.data ?? [])
        .filter((s) => !s.past)
        .map((s) => ({
          value: s.time,
          label: s.free ? s.time : `${s.time} · ocupado`,
          disabled: !s.free,
        })),
    [slots.data],
  );
  const freeCount = slotData.filter((s) => !s.disabled).length;

  // se o horário escolhido deixou de estar livre (mudou o veterinário ou a data), limpa
  useEffect(() => {
    if (
      v.time &&
      slots.data &&
      !slots.data.find((s) => s.time === v.time)?.free
    )
      form.setFieldValue("time", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.data]);

  const [saving, submit] = useSubmit();
  const onSubmit = form.onSubmit((values) =>
    submit(async () => {
      const payload = {
        petId: values.petId,
        type: values.type,
        vetId: values.vetId === "any" ? null : values.vetId,
        date: toISO(values.date),
        time: values.time,
        notes: values.notes.trim(),
      };
      const ok = a
        ? await act(
            api.appointments.update(a.id, payload),
            "Consulta remarcada.",
          )
        : isTutor
          ? await act(
              api.appointments.request(payload),
              "Pedido enviado. A recepção vai confirmar o horário.",
            )
          : await act(api.appointments.create(payload), "Consulta agendada.");
      if (ok) onClose();
    }),
  );

  const petOptions = (pets.data ?? []).map((p) => ({
    value: p.id,
    label: isTutor ? p.name : `${p.name} · ${p.tutor?.name ?? ""}`,
  }));
  const vetOptions = [
    ...(isTutor ? [{ value: "any", label: "Sem preferência" }] : []),
    ...(vets.data ?? []).map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <form onSubmit={onSubmit} noValidate>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label="Paciente"
          placeholder={isTutor ? "Escolha o pet" : "Busque por pet ou tutor"}
          data={petOptions}
          searchable
          nothingFoundMessage="Nenhum paciente encontrado"
          disabled={!!a}
          {...form.getInputProps("petId")}
        />
        <Select
          label="Tipo de atendimento"
          data={SERVICE_TYPES}
          allowDeselect={false}
          {...form.getInputProps("type")}
        />
        <Select
          label="Veterinário"
          placeholder="Escolha"
          data={vetOptions}
          allowDeselect={false}
          {...form.getInputProps("vetId")}
        />
        <DatePickerInput
          label="Data"
          valueFormat="DD/MM/YYYY"
          minDate={new Date()}
          excludeDate={(d) => d.getDay() === 0}
          {...form.getInputProps("date")}
        />
        <Select
          label="Horário"
          placeholder={slots.loading ? "Buscando horários…" : "Escolha"}
          data={slotData}
          description={
            date && !slots.loading
              ? freeCount
                ? `${freeCount} horários livres neste dia`
                : "Nenhum horário livre neste dia"
              : undefined
          }
          maxDropdownHeight={240}
          {...form.getInputProps("time")}
        />
      </SimpleGrid>
      <Textarea
        mt="md"
        label={isTutor ? "Conte o motivo da consulta" : "Observações"}
        placeholder={isTutor ? "Ex.: está comendo pouco há 3 dias" : "Opcional"}
        autosize
        minRows={2}
        {...form.getInputProps("notes")}
      />
      {isTutor && !a && (
        <Text size="sm" c="dimmed" mt="sm">
          O horário fica reservado até a recepção confirmar. Você recebe um
          aviso aqui no portal.
        </Text>
      )}
      <FormActions
        onCancel={onClose}
        loading={saving}
        submitLabel={
          a ? "Salvar novo horário" : isTutor ? "Enviar pedido" : "Agendar"
        }
      />
    </form>
  );
}
