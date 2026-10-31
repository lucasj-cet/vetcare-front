import { useState } from 'react';
import { Button, Group, SegmentedControl, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { api } from '../../api';
import { useApi } from '../../hooks/useApi';
import { fmtDate, relDay, todayISO } from '../../lib/format';
import { VACCINE_STATUS } from '../../lib/status';
import VaccineModal from '../../components/VaccineModal';
import { Async, Block, DataTable, Kpis, KpisLoading, PageHeader, PetAvatar, Pill } from '../../components/ui';

const VIEWS = [
  { value: 'atrasadas', label: 'Atrasadas' },
  { value: 'proximas', label: 'Próximos 30 dias' },
  { value: 'aplicadas', label: 'Aplicadas' },
];

export default function VetVacinas() {
  const [view, setView] = useState('atrasadas');
  const [apply, setApply] = useState(null);
  const q = useApi(() => api.vaccines.list(), []);
  const all = q.data ?? [];
  const today = todayISO();
  const overdue = all.filter((v) => v.state === 'atrasada').sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const soon = all.filter((v) => v.state === 'proxima').sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const applied = all.filter((v) => v.state === 'aplicada').sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  const rows = { atrasadas: overdue, proximas: soon, aplicadas: applied }[view];
  const appliedToday = applied.filter((v) => v.appliedAt === today).length;

  return (
    <>
      <PageHeader
        title="Vacinas"
        finding={q.data ? (overdue.length ? `${overdue.length} ${overdue.length === 1 ? 'dose atrasada' : 'doses atrasadas'}: avise os tutores ou aplique na próxima visita` : 'Nenhuma dose atrasada') : undefined}
      >
        <Button leftSection={<IconPlus size={16} />} onClick={() => setApply({})}>Registrar aplicação</Button>
      </PageHeader>
      <div className="stack">
        {q.data ? (
          <Kpis
            items={[
              { label: 'Atrasadas', value: overdue.length },
              { label: 'Próximos 30 dias', value: soon.length },
              { label: 'Aplicadas hoje', value: appliedToday },
              { label: 'Aplicadas no mês', value: applied.filter((v) => v.appliedAt.slice(0, 7) === today.slice(0, 7)).length },
            ]}
          />
        ) : (
          <KpisLoading />
        )}
        <Block title="Doses" actions={<SegmentedControl size="xs" value={view} onChange={setView} data={VIEWS} />} flush>
          <Async q={q} rows={6}>
            {() => (
              <DataTable
                rows={rows}
                empty={view === 'atrasadas' ? 'Nenhuma dose atrasada.' : view === 'proximas' ? 'Nenhuma dose prevista para os próximos 30 dias.' : 'Nenhuma aplicação registrada.'}
                columns={[
                  { key: 'p', label: 'Paciente', render: (v) => (<Group gap="sm" wrap="nowrap"><PetAvatar pet={v.pet} size={30} /><div><div className="cell-main">{v.pet?.name}</div><div className="cell-sub">{v.tutor?.name} · {v.tutor?.phone}</div></div></Group>) },
                  { key: 'n', label: 'Vacina', render: (v) => v.name },
                  view === 'aplicadas'
                    ? { key: 'd', label: 'Aplicada em', render: (v) => fmtDate(v.appliedAt) }
                    : { key: 'd', label: 'Prevista para', render: (v) => (<><div>{fmtDate(v.dueAt)}</div><div className="cell-sub">{relDay(v.dueAt)}</div></>) },
                  view === 'aplicadas'
                    ? { key: 'l', label: 'Lote · veterinário', render: (v) => <span className="muted">{v.lot} · {v.vet?.name}</span> }
                    : { key: 's', label: 'Situação', render: (v) => <Pill status={v.state} map={VACCINE_STATUS} /> },
                  ...(view !== 'aplicadas' ? [{ key: 'a', label: '', render: (v) => <Button size="compact-sm" variant="light" onClick={() => setApply({ petId: v.petId, name: v.name })}>Aplicar</Button> }] : []),
                ]}
                mobile={{
                  title: (v) => `${v.pet?.name} · ${v.name}`,
                  sub: (v) => (view === 'aplicadas' ? `${fmtDate(v.appliedAt)} · lote ${v.lot}` : `${fmtDate(v.dueAt)} (${relDay(v.dueAt)}) · ${v.tutor?.phone}`),
                  side: (v) => (view === 'aplicadas' ? <Text size="xs" c="dimmed">{v.vet?.name}</Text> : <Button size="compact-xs" variant="light" onClick={() => setApply({ petId: v.petId, name: v.name })}>Aplicar</Button>),
                }}
                minWidth={760}
              />
            )}
          </Async>
        </Block>
      </div>
      <VaccineModal opened={!!apply} onClose={() => setApply(null)} petId={apply?.petId} name={apply?.name} />
    </>
  );
}
