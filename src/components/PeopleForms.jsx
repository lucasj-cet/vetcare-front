import { Checkbox, Divider, Modal, NumberInput, SegmentedControl, Select, SimpleGrid, Text, TextInput, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import { api } from '../api';
import { useSubmit } from '../hooks/useApi';
import { act } from '../lib/notify';
import { isEmail, maskCpf, maskPhone, onlyDigits, toISO } from '../lib/format';
import { FormActions } from './ui';

const petInitial = (p = {}) => ({
  name: p.name ?? '',
  species: p.species ?? 'Cão',
  breed: p.breed ?? '',
  sex: p.sex ?? 'Macho',
  birth: p.birth ? dayjs(p.birth).toDate() : null,
  weight: p.weight ?? '',
  alerts: p.alerts ?? '',
});

const petRules = (on = () => true) => ({
  name: (v, values) => (on(values) && v.trim().length < 2 ? 'Informe o nome do pet' : null),
  breed: (v, values) => (on(values) && !v.trim() ? 'Informe a raça (ou SRD)' : null),
});

const petPayload = (p) => ({
  name: p.name.trim(),
  species: p.species,
  breed: p.breed.trim(),
  sex: p.sex,
  birth: toISO(p.birth),
  weight: p.weight === '' ? null : Number(p.weight),
  alerts: p.alerts.trim(),
});

function PetFields({ form, prefix = '' }) {
  const f = (k) => form.getInputProps(prefix + k);
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <TextInput label="Nome do pet" {...f('name')} />
      <div>
        <Text size="sm" fw={500} mb={4}>Espécie</Text>
        <SegmentedControl fullWidth data={['Cão', 'Gato']} {...f('species')} />
      </div>
      <TextInput label="Raça" placeholder="Ex.: Golden Retriever ou SRD" {...f('breed')} />
      <Select label="Sexo" data={['Macho', 'Fêmea']} allowDeselect={false} {...f('sex')} />
      <DatePickerInput label="Nascimento (aproximado)" valueFormat="DD/MM/YYYY" maxDate={new Date()} clearable {...f('birth')} />
      <NumberInput label="Peso" suffix=" kg" decimalSeparator="," decimalScale={1} min={0} max={120} hideControls {...f('weight')} />
      <Textarea label="Alertas clínicos" description="Alergias, doenças crônicas, cuidados na manipulação" autosize minRows={1} style={{ gridColumn: '1 / -1' }} {...f('alerts')} />
    </SimpleGrid>
  );
}

export function TutorModal({ opened, onClose, tutor }) {
  return (
    <Modal opened={opened} onClose={onClose} title={tutor ? 'Editar tutor' : 'Cadastro de tutor e pet'} size="xl">
      {opened && <TutorForm onClose={onClose} tutor={tutor} />}
    </Modal>
  );
}

function TutorForm({ onClose, tutor }) {
  const form = useForm({
    initialValues: {
      name: tutor?.name ?? '',
      cpf: tutor?.cpf ?? '',
      phone: tutor?.phone ?? '',
      email: tutor?.email ?? '',
      address: tutor?.address ?? '',
      withPet: !tutor,
      pet: petInitial(),
    },
    validate: {
      name: (v) => (v.trim().split(' ').length < 2 ? 'Informe nome e sobrenome' : null),
      cpf: (v) => (onlyDigits(v).length !== 11 ? 'CPF precisa ter 11 dígitos' : null),
      phone: (v) => (onlyDigits(v).length < 10 ? 'Telefone com DDD' : null),
      email: (v) => (!isEmail(v) ? 'E-mail inválido' : null),
      pet: petRules((values) => values.withPet),
    },
  });
  const [saving, submit] = useSubmit();
  const onSubmit = form.onSubmit((v) =>
    submit(async () => {
      const data = { name: v.name.trim(), cpf: v.cpf, phone: v.phone, email: v.email.trim().toLowerCase(), address: v.address.trim() };
      const ok = await act(
        api.tutors.save({ id: tutor?.id, ...data, pet: v.withPet ? petPayload(v.pet) : undefined }),
        tutor ? 'Cadastro atualizado.' : v.withPet ? `${data.name} e ${v.pet.name.trim()} cadastrados.` : 'Tutor cadastrado.',
      );
      if (ok) onClose();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput label="Nome completo" autoComplete="off" {...form.getInputProps('name')} />
        <TextInput
          label="CPF"
          placeholder="000.000.000-00"
          inputMode="numeric"
          {...form.getInputProps('cpf')}
          onChange={(e) => form.setFieldValue('cpf', maskCpf(e.currentTarget.value))}
        />
        <TextInput
          label="Telefone"
          placeholder="(00) 00000-0000"
          inputMode="tel"
          {...form.getInputProps('phone')}
          onChange={(e) => form.setFieldValue('phone', maskPhone(e.currentTarget.value))}
        />
        <TextInput label="E-mail" type="email" {...form.getInputProps('email')} />
        <TextInput label="Endereço" placeholder="Rua, número · bairro, cidade" style={{ gridColumn: '1 / -1' }} {...form.getInputProps('address')} />
      </SimpleGrid>

      {!tutor && (
        <>
          <Divider my="lg" />
          <Checkbox label="Cadastrar o primeiro pet agora" {...form.getInputProps('withPet', { type: 'checkbox' })} mb="md" />
          {form.values.withPet && <PetFields form={form} prefix="pet." />}
        </>
      )}
      <FormActions onCancel={onClose} loading={saving} submitLabel="Salvar cadastro" />
    </form>
  );
}

export function PetModal({ opened, onClose, pet, tutorId, tutorName }) {
  return (
    <Modal opened={opened} onClose={onClose} title={pet ? `Editar ${pet.name}` : `Novo pet${tutorName ? ` de ${tutorName}` : ''}`} size="xl">
      {opened && <PetForm onClose={onClose} pet={pet} tutorId={tutorId} />}
    </Modal>
  );
}

function PetForm({ onClose, pet, tutorId }) {
  const form = useForm({ initialValues: petInitial(pet), validate: petRules() });
  const [saving, submit] = useSubmit();
  const onSubmit = form.onSubmit((v) =>
    submit(async () => {
      const ok = await act(api.pets.save({ id: pet?.id, tutorId: pet?.tutorId ?? tutorId, ...petPayload(v) }), pet ? 'Dados do pet atualizados.' : `${v.name.trim()} cadastrado.`);
      if (ok) onClose();
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate>
      <PetFields form={form} />
      <FormActions onCancel={onClose} loading={saving} submitLabel="Salvar pet" />
    </form>
  );
}
