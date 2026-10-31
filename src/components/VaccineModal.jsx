import { Button, Group, Modal, Select, SimpleGrid, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { api } from '../api';
import { VACCINE_TYPES } from '../data/seed';
import { useSession } from '../auth/session';
import { useApi, useSubmit } from '../hooks/useApi';
import { act } from '../lib/notify';
import { toISO } from '../lib/format';
import { FormActions } from './ui';

export default function VaccineModal({ opened, onClose, petId, name }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Registrar aplicação" size="lg">
      {opened && <VaccineForm onClose={onClose} petId={petId} name={name} />}
    </Modal>
  );
}

function VaccineForm({ onClose, petId, name }) {
  const { user } = useSession();
  const pets = useApi(() => api.pets.list(), []);
  const vets = useApi(() => api.staff.vets(), []);
  const form = useForm({
    initialValues: {
      petId: petId ?? null,
      name: name ?? null,
      lot: '',
      appliedAt: new Date(),
      nextDueAt: dayjs().add(1, 'year').toDate(),
      vetId: user?.role === 'vet' ? user.id : null,
    },
    validate: {
      petId: (v) => (v ? null : 'Escolha o paciente'),
      name: (v) => (v ? null : 'Escolha a vacina'),
      lot: (v) => (v.trim() ? null : 'Informe o lote do frasco'),
      appliedAt: (v) => (v ? null : 'Informe a data'),
      vetId: (v) => (v ? null : 'Escolha o veterinário'),
    },
  });
  const pet = (pets.data ?? []).find((p) => p.id === form.values.petId);
  const names = pet ? VACCINE_TYPES[pet.species] : [...new Set(Object.values(VACCINE_TYPES).flat())];
  const setNext = (amount, unit) => form.setFieldValue('nextDueAt', dayjs(form.values.appliedAt ?? new Date()).add(amount, unit).toDate());

  const [saving, submit] = useSubmit();
  const onSubmit = form.onSubmit((v) =>
    submit(async () => {
      const ok = await act(
        api.vaccines.apply({ petId: v.petId, name: v.name, lot: v.lot.trim().toUpperCase(), appliedAt: toISO(v.appliedAt), nextDueAt: toISO(v.nextDueAt), vetId: v.vetId }),
        'Aplicação registrada. O tutor foi avisado.',
      );
      if (ok) onClose();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select label="Paciente" searchable data={(pets.data ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${p.tutor?.name ?? ''}` }))} disabled={!!petId} {...form.getInputProps('petId')} />
        <Select label="Vacina" data={names} searchable {...form.getInputProps('name')} />
        <TextInput label="Lote" placeholder="Ex.: V10-2504" {...form.getInputProps('lot')} />
        <Select label="Aplicada por" data={(vets.data ?? []).map((u) => ({ value: u.id, label: u.name }))} {...form.getInputProps('vetId')} />
        <DatePickerInput label="Data da aplicação" valueFormat="DD/MM/YYYY" maxDate={new Date()} {...form.getInputProps('appliedAt')} />
        <div>
          <DatePickerInput label="Próxima dose" valueFormat="DD/MM/YYYY" clearable minDate={new Date()} placeholder="Sem reforço" {...form.getInputProps('nextDueAt')} />
          <Group gap={6} mt={6}>
            <Button size="compact-xs" variant="light" onClick={() => setNext(21, 'day')}>21 dias</Button>
            <Button size="compact-xs" variant="light" onClick={() => setNext(30, 'day')}>30 dias</Button>
            <Button size="compact-xs" variant="light" onClick={() => setNext(1, 'year')}>1 ano</Button>
          </Group>
        </div>
      </SimpleGrid>
      {pet && (
        <Text size="sm" c="dimmed" mt="md">
          Se havia uma dose de {form.values.name ?? 'vacina'} agendada para {pet.name}, ela é marcada como aplicada.
        </Text>
      )}
      <FormActions onCancel={onClose} loading={saving} submitLabel="Salvar aplicação" />
    </form>
  );
}
