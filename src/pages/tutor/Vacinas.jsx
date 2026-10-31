import { useEffect, useState } from 'react';
import { Button, Group, Modal, SegmentedControl, Select, Switch, Text } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { api } from '../../api';
import { useSession } from '../../auth/session';
import { useApi, useSubmit } from '../../hooks/useApi';
import { act } from '../../lib/notify';
import { fmtDate, relDay } from '../../lib/format';
import { VaccineTable } from '../../components/PetProfile';
import { Async, Block, Kpis, KpisLoading, PageHeader } from '../../components/ui';

export default function TutorVacinas() {
  const { user } = useSession();
  const tutorId = user.tutorId;
  const pets = useApi(() => api.pets.list({ tutorId }), [tutorId]);
  const vacc = useApi(() => api.vaccines.forTutor(tutorId), [tutorId]);
  const rem = useApi(() => api.reminders.forTutor(tutorId), [tutorId]);
  const [petId, setPetId] = useState(null);
  const [reminder, setReminder] = useState(false);

  useEffect(() => {
    if (!petId && pets.data?.length) setPetId(pets.data[0].id);
  }, [pets.data, petId]);

  const pet = (pets.data ?? []).find((p) => p.id === petId);
  const mine = (vacc.data ?? []).filter((v) => v.petId === petId).sort((a, b) => (b.appliedAt ?? b.dueAt).localeCompare(a.appliedAt ?? a.dueAt));
  const upcoming = mine.filter((v) => v.state !== 'aplicada').sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const overdue = mine.filter((v) => v.state === 'atrasada');
  const current = (rem.data ?? []).find((r) => r.petId === petId);

  return (
    <>
      <PageHeader title="Vacinas" finding={pet ? (overdue.length ? `${pet.name} tem ${overdue.length} vacina(s) atrasada(s). Agende a aplicação.` : `As vacinas de ${pet.name} estão em dia.`) : undefined}>
        <Button variant={current?.active ? 'default' : 'filled'} leftSection={<IconBell size={16} />} onClick={() => setReminder(true)} disabled={!pet}>
          {current?.active ? 'Lembretes ativados' : 'Ativar lembretes'}
        </Button>
      </PageHeader>

      {(pets.data ?? []).length > 1 && (
        <SegmentedControl mb="lg" value={petId ?? ''} onChange={setPetId} data={pets.data.map((p) => ({ value: p.id, label: p.name }))} />
      )}

      <div className="stack">
        {vacc.data && pet ? (
          <Kpis
            items={[
              { label: 'Aplicadas', value: mine.filter((v) => v.state === 'aplicada').length },
              { label: 'Próxima dose', value: upcoming[0] ? fmtDate(upcoming[0].dueAt) : '—', hint: upcoming[0] ? `${upcoming[0].name} · ${relDay(upcoming[0].dueAt)}` : undefined },
              { label: 'Atrasadas', value: overdue.length, trend: overdue.length ? 'down' : undefined },
            ]}
          />
        ) : (
          <KpisLoading n={3} />
        )}
        <Block title={pet ? `Carteira de vacinas de ${pet.name}` : 'Carteira de vacinas'} sub={current?.active ? `Lembrete por ${current.channel}, ${current.daysBefore} dias antes de cada dose` : 'Lembretes desligados'} flush>
          <Async q={vacc} rows={5}>{() => <VaccineTable vaccines={mine} />}</Async>
        </Block>
      </div>

      <ReminderModal opened={reminder} onClose={() => setReminder(false)} pet={pet} current={current} />
    </>
  );
}

function ReminderModal({ opened, onClose, pet, current }) {
  const [active, setActive] = useState(true);
  const [channel, setChannel] = useState('WhatsApp');
  const [days, setDays] = useState('7');
  const [busy, submit] = useSubmit();

  useEffect(() => {
    if (opened) {
      setActive(current?.active ?? true);
      setChannel(current?.channel ?? 'WhatsApp');
      setDays(String(current?.daysBefore ?? 7));
    }
  }, [opened, current]);

  return (
    <Modal opened={opened} onClose={onClose} title="Lembrete de vacina" size="md">
      {pet && (
        <>
          <Text size="sm" c="dimmed" mb="md">Avisamos antes de cada dose de {pet.name}, para você agendar a aplicação.</Text>
          <Switch label="Receber lembretes" checked={active} onChange={(e) => setActive(e.currentTarget.checked)} mb="md" />
          <Text size="sm" fw={500} mb={4}>Canal</Text>
          <SegmentedControl fullWidth data={['WhatsApp', 'E-mail', 'SMS']} value={channel} onChange={setChannel} disabled={!active} mb="md" />
          <Select label="Avisar com antecedência de" data={[{ value: '3', label: '3 dias' }, { value: '7', label: '7 dias' }, { value: '15', label: '15 dias' }]} value={days} onChange={(v) => v && setDays(v)} disabled={!active} allowDeselect={false} />
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button
              loading={busy}
              onClick={() =>
                submit(async () => {
                  const ok = await act(api.reminders.save({ petId: pet.id, active, channel, daysBefore: Number(days) }), active ? `Lembretes ativados por ${channel}.` : 'Lembretes desligados.');
                  if (ok) onClose();
                })
              }
            >
              {active ? 'Ativar lembrete' : 'Salvar'}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
