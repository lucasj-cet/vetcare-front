import { useState } from 'react';
import { Alert, Button, Group, NumberInput, Stack, Tabs, Text, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertTriangle, IconCheck, IconPlayerPlay } from '@tabler/icons-react';
import { api } from '../../api';
import { PRICES } from '../../data/seed';
import { useSession } from '../../auth/session';
import { useApi, useSubmit } from '../../hooks/useApi';
import { act } from '../../lib/notify';
import { age, brl, kg, todayISO } from '../../lib/format';
import { APPT_STATUS } from '../../lib/status';
import { emptyItem, filledItems, RxItemsEditor } from '../../components/Prescription';
import { RecordList, VaccineTable } from '../../components/PetProfile';
import VaccineModal from '../../components/VaccineModal';
import { Async, Block, Empty, PageHeader, PetAvatar, Pill } from '../../components/ui';

export default function Atendimentos() {
  const { user } = useSession();
  const q = useApi(() => api.appointments.forVet(user.id, todayISO()), [user.id]);
  const [sel, setSel] = useState(null);
  const list = (q.data ?? []).filter((a) => a.status !== 'cancelada');
  const current =
    list.find((a) => a.id === sel) ??
    list.find((a) => a.status === 'em_atendimento') ??
    list.find((a) => a.status === 'aguardando') ??
    list.find((a) => a.status === 'agendada') ??
    null;
  const left = list.filter((a) => ['agendada', 'aguardando', 'em_atendimento'].includes(a.status)).length;
  const done = list.filter((a) => a.status === 'concluida').length;
  const waiting = list.filter((a) => a.status === 'aguardando').length;

  return (
    <>
      <PageHeader
        title="Atendimentos"
        finding={q.data ? `${left} ${left === 1 ? 'paciente' : 'pacientes'} na fila de hoje${waiting ? `, ${waiting} na sala de espera` : ''} · ${done} ${done === 1 ? 'concluído' : 'concluídos'}` : 'Fila de hoje'}
      />
      <div className="care-grid">
        <Block title="Fila de hoje" sub={user.name} flush>
          <Async q={q}>
            {() =>
              list.length === 0 ? (
                <Empty>Nenhum paciente marcado para hoje.</Empty>
              ) : (
                list.map((a) => (
                  <button key={a.id} type="button" className={`queue-item ${current?.id === a.id ? 'active' : ''}`} onClick={() => setSel(a.id)}>
                    <span className="time">{a.time}</span>
                    <span style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>{a.pet.name}</Text>
                      <Text size="xs" c="dimmed" truncate>{a.type}</Text>
                    </span>
                    <Pill status={a.status} map={APPT_STATUS} size="sm" />
                  </button>
                ))
              )
            }
          </Async>
        </Block>

        {current ? <Ficha key={current.id} appt={current} /> : q.data && <Block><Empty>Selecione um paciente na fila.</Empty></Block>}
      </div>
    </>
  );
}

function Ficha({ appt }) {
  const profile = useApi(() => api.pets.profile(appt.petId), [appt.petId]);
  const [tab, setTab] = useState('exame');
  const [items, setItems] = useState([emptyItem()]);
  const [vaccine, setVaccine] = useState(null);
  const [busy, submit] = useSubmit();
  const active = appt.status === 'em_atendimento';
  const finished = appt.status === 'concluida';
  const record = profile.data?.records.find((r) => r.appointmentId === appt.id);

  const form = useForm({
    initialValues: {
      weight: appt.pet.weight ?? '', temperature: '', heartRate: '', respRate: '',
      complaint: appt.notes ?? '', exam: '', diagnosis: '', conduct: '', rxTitle: '', rxNotes: '',
    },
    validate: {
      complaint: (v) => (v.trim() ? null : 'Descreva a queixa principal'),
      diagnosis: (v) => (v.trim() ? null : 'Informe o diagnóstico ou a suspeita'),
    },
  });

  const start = () => submit(() => act(api.care.start(appt.id), `Atendimento de ${appt.pet.name} iniciado.`));
  const finish = () => {
    if (form.validate().hasErrors) {
      setTab('exame');
      return;
    }
    const v = form.values;
    const list = filledItems(items);
    const num = (x) => (x === '' ? null : Number(x));
    submit(() =>
      act(
        api.care.finish(appt.id, {
          record: {
            weight: num(v.weight), temperature: num(v.temperature), heartRate: num(v.heartRate), respRate: num(v.respRate),
            complaint: v.complaint.trim(), exam: v.exam.trim(), diagnosis: v.diagnosis.trim(), conduct: v.conduct.trim(),
          },
          prescription: list.length ? { title: v.rxTitle.trim() || `Prescrição · ${appt.type}`, notes: v.rxNotes.trim(), items: list } : null,
        }),
        `Atendimento concluído. Cobrança de ${brl(PRICES[appt.type] ?? 0)} enviada ao caixa.`,
      ),
    );
  };

  const pet = profile.data?.pet ?? appt.pet;

  return (
    <Block flush>
      <Group justify="space-between" p="lg" pb="md" wrap="wrap" gap="md">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <PetAvatar pet={pet} size={48} />
          <div style={{ minWidth: 0 }}>
            <Group gap="xs">
              <Text fw={600} size="lg">{pet.name}</Text>
              <Pill status={appt.status} map={APPT_STATUS} size="sm" />
            </Group>
            <Text size="sm" c="dimmed">
              {pet.breed} · {age(pet.birth)} · {kg(pet.weight)} · Tutor(a) {appt.tutor.name} · {appt.tutor.phone}
            </Text>
            <Text size="sm" c="dimmed">{appt.time} · {appt.type}</Text>
          </div>
        </Group>
        {!finished &&
          (active ? (
            <Button leftSection={<IconCheck size={16} />} onClick={finish} loading={busy}>Concluir atendimento</Button>
          ) : (
            <Button leftSection={<IconPlayerPlay size={16} />} onClick={start} loading={busy}>Iniciar atendimento</Button>
          ))}
      </Group>
      {pet.alerts && (
        <Alert color="red" variant="light" mx="lg" mb="md" p="sm" icon={<IconAlertTriangle size={18} />}>
          <Text size="sm" fw={500}>Alerta clínico: {pet.alerts}</Text>
        </Alert>
      )}
      {!active && !finished && (
        <Text size="sm" c="dimmed" px="lg" mb="md">
          {appt.status === 'aguardando' ? `${pet.name} já está na sala de espera.` : `${pet.name} ainda não chegou.`} Inicie o atendimento para preencher a ficha.
        </Text>
      )}

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List px="lg">
          <Tabs.Tab value="exame">Anamnese e exame</Tabs.Tab>
          <Tabs.Tab value="historico">Histórico{profile.data ? ` (${profile.data.records.length})` : ''}</Tabs.Tab>
          <Tabs.Tab value="vacinas">Vacinação</Tabs.Tab>
          <Tabs.Tab value="prescricao">Prescrição{filledItems(items).length ? ` (${filledItems(items).length})` : ''}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="exame" p="lg">
          {finished ? (
            record ? <div style={{ margin: '-20px -20px' }}><RecordList records={[record]} /></div> : <Text size="sm" c="dimmed">Atendimento concluído.</Text>
          ) : (
            <Stack gap="md">
              <div className="vitals">
                <NumberInput label="Peso" suffix=" kg" decimalSeparator="," decimalScale={1} hideControls disabled={!active} {...form.getInputProps('weight')} />
                <NumberInput label="Temperatura" suffix=" °C" decimalSeparator="," decimalScale={1} hideControls disabled={!active} placeholder="38,5" {...form.getInputProps('temperature')} />
                <NumberInput label="Freq. cardíaca" suffix=" bpm" hideControls disabled={!active} {...form.getInputProps('heartRate')} />
                <NumberInput label="Freq. respiratória" suffix=" mpm" hideControls disabled={!active} {...form.getInputProps('respRate')} />
              </div>
              <TextInput label="Queixa principal" disabled={!active} {...form.getInputProps('complaint')} />
              <Textarea label="Exame físico" autosize minRows={3} disabled={!active} placeholder="Mucosas, hidratação, linfonodos, auscultação…" {...form.getInputProps('exam')} />
              <TextInput label="Diagnóstico" disabled={!active} placeholder="Diagnóstico ou suspeita clínica" {...form.getInputProps('diagnosis')} />
              <Textarea label="Conduta" autosize minRows={2} disabled={!active} placeholder="Tratamento, exames pedidos, retorno" {...form.getInputProps('conduct')} />
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="historico">
          <Async q={profile}>{(p) => <RecordList records={p.records.filter((r) => r.appointmentId !== appt.id)} />}</Async>
        </Tabs.Panel>

        <Tabs.Panel value="vacinas" pt="xs">
          <Group justify="flex-end" px="lg" py="xs">
            <Button size="xs" variant="light" onClick={() => setVaccine({})}>Registrar aplicação</Button>
          </Group>
          <Async q={profile}>{(p) => <VaccineTable vaccines={p.vaccines} onApply={(v) => setVaccine({ name: v.name })} />}</Async>
        </Tabs.Panel>

        <Tabs.Panel value="prescricao" p="lg">
          {finished ? (
            <Text size="sm" c="dimmed">As prescrições deste atendimento ficam em Prescrições e no portal do tutor.</Text>
          ) : (
            <Stack gap="md">
              <TextInput label="Nome da prescrição" placeholder={`Prescrição · ${appt.type}`} disabled={!active} {...form.getInputProps('rxTitle')} />
              <RxItemsEditor items={items} onChange={setItems} disabled={!active} />
              <Textarea label="Orientações ao tutor" autosize minRows={2} disabled={!active} {...form.getInputProps('rxNotes')} />
              <Text size="xs" c="dimmed">A prescrição é emitida junto com a conclusão do atendimento. Deixe sem medicamentos se não houver.</Text>
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

      <VaccineModal opened={!!vaccine} onClose={() => setVaccine(null)} petId={appt.petId} name={vaccine?.name} />
    </Block>
  );
}
