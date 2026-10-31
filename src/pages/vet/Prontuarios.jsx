import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Group, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconChevronLeft, IconPlus, IconSearch } from '@tabler/icons-react';
import { api } from '../../api';
import { useApi } from '../../hooks/useApi';
import { age, fmtDate, todayISO } from '../../lib/format';
import { VACCINE_STATUS } from '../../lib/status';
import { PetHeader, PetHistoryTabs, RecordModal } from '../../components/PetProfile';
import VaccineModal from '../../components/VaccineModal';
import { Async, Block, DataTable, Kpis, PageHeader, PetAvatar, Pill } from '../../components/ui';

export default function Prontuarios() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 200);
  const q = useApi(() => api.pets.list({ search: debounced }), [debounced]);
  const all = useApi(() => api.pets.list(), []);
  const pets = all.data ?? [];
  const today = todayISO();

  return (
    <>
      <PageHeader title="Prontuários" finding="Histórico clínico de cada paciente" />
      <div className="stack">
        <Kpis
          items={[
            { label: 'Pacientes', value: pets.length },
            { label: 'Atendidos hoje', value: pets.filter((p) => p.lastVisit === today).length },
            { label: 'Com alerta clínico', value: pets.filter((p) => p.alerts).length },
            { label: 'Com vacina atrasada', value: pets.filter((p) => p.overdue > 0).length },
          ]}
        />
        <Block
          title="Pacientes"
          actions={<TextInput leftSection={<IconSearch size={15} />} placeholder="Nome, raça ou tutor" value={search} onChange={(e) => setSearch(e.currentTarget.value)} w={{ base: '100%', sm: 280 }} aria-label="Buscar paciente" />}
          flush
        >
          <Async q={q} rows={6}>
            {(rows) => (
              <DataTable
                rows={rows}
                onRowClick={(p) => navigate(`/vet/prontuarios/${p.id}`)}
                empty={`Nenhum paciente encontrado para "${search}".`}
                columns={[
                  { key: 'n', label: 'Paciente', render: (p) => (<Group gap="sm" wrap="nowrap"><PetAvatar pet={p} size={30} /><div><div className="cell-main">{p.name}</div><div className="cell-sub">{p.species} · {p.breed} · {age(p.birth)}</div></div></Group>) },
                  { key: 't', label: 'Tutor', render: (p) => p.tutor?.name },
                  { key: 'l', label: 'Última consulta', render: (p) => (p.lastVisit ? fmtDate(p.lastVisit) : <span className="faint">—</span>) },
                  { key: 'v', label: 'Próxima vacina', render: (p) => (p.nextVaccine ? (<Group gap={6} wrap="nowrap"><span>{p.nextVaccine.name} · {fmtDate(p.nextVaccine.dueAt)}</span>{p.nextVaccine.state === 'atrasada' && <Pill status="atrasada" map={VACCINE_STATUS} size="sm" />}</Group>) : <span className="faint">—</span>) },
                  { key: 'a', label: 'Alertas', render: (p) => (p.alerts ? <Text size="sm" c="red.8">{p.alerts}</Text> : <span className="faint">—</span>) },
                ]}
                mobile={{ title: (p) => `${p.name} · ${p.breed}`, sub: (p) => `${p.tutor?.name} · última consulta ${p.lastVisit ? fmtDate(p.lastVisit) : '—'}`, side: (p) => p.alerts && <Text size="xs" c="red.8">Alerta</Text> }}
                minWidth={860}
              />
            )}
          </Async>
        </Block>
      </div>
    </>
  );
}

export function Prontuario() {
  const { petId } = useParams();
  const q = useApi(() => api.pets.profile(petId), [petId]);
  const [record, setRecord] = useState(false);
  const [vaccine, setVaccine] = useState(null);

  return (
    <>
      <Link to="/vet/prontuarios" className="back-link"><IconChevronLeft size={15} /> Prontuários</Link>
      <PageHeader title={q.data ? `Prontuário de ${q.data.pet.name}` : 'Prontuário'} finding={q.data ? `${q.data.records.length} registros clínicos · paciente desde ${fmtDate(q.data.tutor?.createdAt)}` : undefined}>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setRecord(true)} disabled={!q.data}>Novo registro</Button>
      </PageHeader>
      <Async q={q} rows={8}>
        {(p) => (
          <Block flush>
            <PetHeader profile={p} />
            <PetHistoryTabs profile={p} onApplyVaccine={(v) => setVaccine({ name: v.name })} />
          </Block>
        )}
      </Async>
      <RecordModal opened={record} onClose={() => setRecord(false)} pet={q.data?.pet} />
      <VaccineModal opened={!!vaccine} onClose={() => setVaccine(null)} petId={petId} name={vaccine?.name} />
    </>
  );
}
