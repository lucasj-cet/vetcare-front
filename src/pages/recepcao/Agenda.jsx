import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Button, Drawer, Group, SegmentedControl, Select, Stack, Text, Textarea } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { api, CLOSE, OPEN } from '../../api';
import { useApi, useSubmit } from '../../hooks/useApi';
import { act } from '../../lib/notify';
import { fmtDateTime, fmtLong, fmtDate, toISO, todayISO, toMin, weekStart } from '../../lib/format';
import { APPT_STATUS } from '../../lib/status';
import AppointmentModal from '../../components/AppointmentModal';
import { Async, Block, DataTable, Empty, Facts, Kpis, KpisLoading, PageHeader, PersonAvatar, Pill, usePhone } from '../../components/ui';

const SPAN = CLOSE - OPEN;
const pos = (min) => `${((min - OPEN) / SPAN) * 100}%`;
const tone = (status) => {
  const c = APPT_STATUS[status].color;
  return { background: `var(--mantine-color-${c}-light)`, color: `var(--mantine-color-${c}-light-color)`, borderLeftColor: `var(--mantine-color-${c}-filled)` };
};

export default function Agenda() {
  const [date, setDate] = useState(todayISO());
  const [view, setView] = useState('dia');
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null);
  const phone = usePhone();

  const from = view === 'dia' ? date : weekStart(date).format('YYYY-MM-DD');
  const to = view === 'dia' ? date : weekStart(date).add(5, 'day').format('YYYY-MM-DD');
  const q = useApi(() => api.appointments.range(from, to), [from, to]);
  const requests = useApi(() => api.appointments.requests(), []);
  const vets = useApi(() => api.staff.vets(), []);

  const day = (q.data ?? []).filter((a) => a.date === date);
  const valid = day.filter((a) => a.status !== 'cancelada');
  const count = (s) => day.filter((a) => a.status === s).length;
  const step = view === 'dia' ? 1 : 7;
  const move = (n) => {
    let next = dayjs(date).add(n * step, 'day');
    if (next.day() === 0) next = next.add(n > 0 ? 1 : -1, 'day');
    setDate(next.format('YYYY-MM-DD'));
  };

  const finding = q.data
    ? valid.length
      ? `${capital(fmtLong(date))} · ${valid.length} ${valid.length === 1 ? 'consulta' : 'consultas'}, ${count('aguardando')} aguardando atendimento`
      : `${capital(fmtLong(date))} · nenhuma consulta marcada`
    : capital(fmtLong(date));

  return (
    <>
      <PageHeader title="Agenda" finding={finding}>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setForm({ defaults: { date: date < todayISO() ? todayISO() : date } })}>
          Novo agendamento
        </Button>
      </PageHeader>

      <div className="stack">
        {q.data ? (
          <Kpis
            items={[
              { label: 'Consultas no dia', value: valid.length },
              { label: 'Aguardando', value: count('aguardando'), hint: 'já chegaram na clínica' },
              { label: 'Em atendimento', value: count('em_atendimento') },
              { label: 'Concluídas', value: count('concluida'), hint: count('cancelada') ? `${count('cancelada')} cancelada(s)` : undefined },
            ]}
          />
        ) : (
          <KpisLoading />
        )}

        {(requests.data ?? []).length > 0 && (
          <Block title="Pedidos dos tutores" sub="Feitos pelo portal. Confirme o horário ou recuse." flush>
            <DataTable
              rows={requests.data}
              onRowClick={(a) => setOpenId(a.id)}
              columns={[
                { key: 'pet', label: 'Paciente', render: (a) => (<><div className="cell-main">{a.pet.name}</div><div className="cell-sub">{a.tutor.name} · {a.tutor.phone}</div></>) },
                { key: 'when', label: 'Horário pedido', render: (a) => `${fmtDate(a.date)} às ${a.time}` },
                { key: 'type', label: 'Atendimento', render: (a) => a.type },
                { key: 'vet', label: 'Veterinário', render: (a) => a.vet?.name ?? 'Sem preferência' },
                { key: 'notes', label: 'Motivo', render: (a) => <span className="cell-sub">{a.notes || '—'}</span> },
                { key: 'go', label: '', render: () => <Button size="compact-sm" variant="light">Analisar</Button> },
              ]}
              mobile={{ title: (a) => `${a.pet.name} · ${a.tutor.name}`, sub: (a) => `${fmtDate(a.date)} às ${a.time} · ${a.type}`, side: () => <Pill status="solicitada" map={APPT_STATUS} /> }}
              minWidth={820}
            />
          </Block>
        )}

        <Block
          title={view === 'dia' ? 'Horários por veterinário' : 'Semana'}
          actions={
            <>
              <SegmentedControl size="xs" value={view} onChange={setView} data={[{ value: 'dia', label: 'Dia' }, { value: 'semana', label: 'Semana' }]} />
              <Group gap={4} wrap="nowrap">
                <ActionIcon variant="default" size="lg" onClick={() => move(-1)} aria-label="Anterior"><IconChevronLeft size={16} /></ActionIcon>
                <DatePickerInput
                  value={dayjs(date).toDate()}
                  onChange={(d) => d && setDate(toISO(d))}
                  valueFormat={view === 'dia' ? 'DD/MM/YYYY' : '[Semana de] DD/MM'}
                  excludeDate={(d) => d.getDay() === 0}
                  w={view === 'dia' ? 128 : 168}
                  aria-label="Data"
                />
                <ActionIcon variant="default" size="lg" onClick={() => move(1)} aria-label="Próximo"><IconChevronRight size={16} /></ActionIcon>
              </Group>
              {date !== todayISO() && <Button variant="subtle" size="xs" onClick={() => setDate(todayISO())}>Hoje</Button>}
            </>
          }
          flush
        >
          <Async q={q} rows={5}>
            {(rows) =>
              view === 'semana' ? (
                <WeekGrid from={from} rows={rows} selected={date} onPickDay={(d) => { setDate(d); setView('dia'); }} onOpen={setOpenId} />
              ) : phone ? (
                <DayList rows={day} onOpen={setOpenId} />
              ) : (
                <DayTimeline date={date} rows={day} vets={vets.data ?? []} onOpen={setOpenId} />
              )
            }
          </Async>
        </Block>
      </div>

      <AppointmentDrawer id={openId} onClose={() => setOpenId(null)} onReschedule={(a) => { setOpenId(null); setForm({ appointment: a }); }} />
      <AppointmentModal opened={!!form} onClose={() => setForm(null)} appointment={form?.appointment} defaults={form?.defaults} />
    </>
  );
}

const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function useNow() {
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 60000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// Assinatura da agenda: uma faixa por veterinário, horas na horizontal
function DayTimeline({ date, rows, vets, onOpen }) {
  const now = useNow();
  const scroller = useRef(null);
  const nowMin = now.hour() * 60 + now.minute();
  const showNow = date === todayISO() && nowMin >= OPEN && nowMin <= CLOSE;
  useEffect(() => {
    const el = scroller.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    // começa no primeiro paciente que ainda não foi embora (ou uma hora antes de agora)
    const open = rows.filter((a) => ['agendada', 'aguardando', 'em_atendimento'].includes(a.status)).map((a) => toMin(a.time));
    const first = rows.filter((a) => a.status !== 'cancelada').map((a) => toMin(a.time));
    const anchor = date === todayISO() ? Math.min(nowMin - 60, ...open) - 30 : Math.min(...first, CLOSE) - 30;
    el.scrollLeft = ((anchor - OPEN) / SPAN) * (el.scrollWidth - 196);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps
  const hours = Array.from({ length: (CLOSE - OPEN) / 60 + 1 }, (_, i) => OPEN + i * 60);
  const grid = (
    <>
      {hours.map((m) => <div key={m} className="tl-hour" style={{ left: pos(m) }} />)}
      {hours.slice(0, -1).map((m) => <div key={`h${m}`} className="tl-hour half" style={{ left: pos(m + 30) }} />)}
    </>
  );

  return (
    <>
      <div className="tl-scroll" ref={scroller}>
        <div className="tl">
          <div className="tl-row tl-head">
            <div className="tl-lane"><Text size="xs" c="dimmed">Veterinário</Text></div>
            <div className="tl-track">
              {hours.map((m) => <span key={m} className="tl-hour-label" style={{ left: pos(m) }}>{m / 60}h</span>)}
              {showNow && <div className="tl-now" style={{ left: pos(nowMin) }} data-time={now.format('HH:mm')} />}
            </div>
          </div>
          {vets.map((v) => {
            const mine = rows.filter((a) => a.vetId === v.id);
            const active = mine.filter((a) => a.status !== 'cancelada').length;
            return (
              <div className="tl-row" key={v.id}>
                <div className="tl-lane">
                  <PersonAvatar name={v.name} size={30} />
                  <div style={{ minWidth: 0 }}>
                    <div className="name">{v.name}</div>
                    <div className="cell-sub">{active ? `${active} ${active === 1 ? 'consulta' : 'consultas'}` : 'Agenda livre'}</div>
                  </div>
                </div>
                <div className="tl-track">
                  {grid}
                  {showNow && <div className="tl-now" style={{ left: pos(nowMin) }} />}
                  {mine.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`tl-bar ${a.status === 'cancelada' ? 'is-cancelled' : ''}`}
                      style={{ left: pos(toMin(a.time)), width: `calc(${(a.duration / SPAN) * 100}% - 3px)`, ...tone(a.status) }}
                      onClick={() => onOpen(a.id)}
                      title={`${a.time} · ${a.pet.name} (${a.tutor.name}) · ${a.type} · ${APPT_STATUS[a.status].label}`}
                    >
                      <span className="t">{a.time}</span>
                      <span className="p">{a.pet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="tl-legend">
        {['agendada', 'aguardando', 'em_atendimento', 'concluida', 'cancelada'].map((s) => (
          <span key={s}>
            <i style={{ background: `var(--mantine-color-${APPT_STATUS[s].color}-filled)` }} />
            {APPT_STATUS[s].label}
          </span>
        ))}
      </div>
    </>
  );
}

function DayList({ rows, onOpen }) {
  if (!rows.length) return <Empty>Nenhuma consulta neste dia.</Empty>;
  return (
    <div className="mrows">
      {rows.map((a) => (
        <button key={a.id} type="button" className="mrow" onClick={() => onOpen(a.id)}>
          <div style={{ display: 'flex', gap: 12, minWidth: 0, alignItems: 'center' }}>
            <span className="tnum" style={{ fontWeight: 600, width: 42 }}>{a.time}</span>
            <div className="mrow-main">
              <div className="mrow-title">{a.pet.name} · {a.tutor.name}</div>
              <div className="cell-sub">{a.type} · {a.vet?.name}</div>
            </div>
          </div>
          <span style={{ flexShrink: 0 }}><Pill status={a.status} map={APPT_STATUS} size="sm" /></span>
        </button>
      ))}
    </div>
  );
}

function WeekGrid({ from, rows, selected, onPickDay, onOpen }) {
  const days = Array.from({ length: 6 }, (_, i) => dayjs(from).add(i, 'day'));
  return (
    <div className="week">
      {days.map((d) => {
        const iso = d.format('YYYY-MM-DD');
        const mine = rows.filter((a) => a.date === iso);
        const n = mine.filter((a) => a.status !== 'cancelada').length;
        return (
          <div key={iso} className={`week-day ${iso === selected ? 'is-selected' : ''} ${iso === todayISO() ? 'is-today' : ''}`}>
            <button type="button" className="week-day-head" onClick={() => onPickDay(iso)}>
              <span className="d">{d.format('ddd D/MM')}</span>
              <span className="n">{n ? `${n} ${n === 1 ? 'consulta' : 'consultas'}` : 'livre'}</span>
            </button>
            <div className="week-list">
              {mine.map((a) => (
                <button key={a.id} type="button" className="week-item" style={tone(a.status)} onClick={() => onOpen(a.id)}>
                  <span className="t">{a.time} · {a.vet?.name.replace(/^Dra?\. /, '')}</span>
                  <span className="p">{a.pet.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AppointmentDrawer({ id, onClose, onReschedule }) {
  return (
    <Drawer opened={!!id} onClose={onClose} title="Detalhes da consulta" size="md">
      {id && <AppointmentDetails id={id} onClose={onClose} onReschedule={onReschedule} />}
    </Drawer>
  );
}

function AppointmentDetails({ id, onClose, onReschedule }) {
  const q = useApi(() => api.appointments.get(id), [id]);
  const vets = useApi(() => api.staff.vets(), []);
  const [vetId, setVetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, submit] = useSubmit();
  const a = q.data;

  useEffect(() => {
    if (a) setVetId(a.vetId);
  }, [a?.vetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (promise, msg, close = false) =>
    submit(async () => {
      if ((await act(promise, msg)) && close) onClose();
    });

  const actions = useMemo(() => {
    if (!a) return null;
    if (a.status === 'solicitada')
      return (
        <>
          <Select label="Veterinário" data={(vets.data ?? []).map((v) => ({ value: v.id, label: v.name }))} value={vetId} onChange={setVetId} placeholder="Escolha quem atende" />
          <Group grow>
            <Button variant="default" color="red" onClick={() => setCancelling(true)}>Recusar</Button>
            <Button disabled={!vetId} loading={busy} onClick={() => run(api.appointments.confirmRequest(a.id, vetId), 'Consulta confirmada. O tutor foi avisado.', true)}>Confirmar</Button>
          </Group>
        </>
      );
    if (a.status === 'agendada')
      return (
        <>
          <Button loading={busy} onClick={() => run(api.appointments.setStatus(a.id, 'aguardando'), `Chegada de ${a.pet.name} registrada. O veterinário foi avisado.`)} disabled={a.date !== todayISO()}>
            Registrar chegada
          </Button>
          <Group grow>
            <Button variant="default" onClick={() => onReschedule(a)}>Remarcar</Button>
            <Button variant="default" color="red" onClick={() => setCancelling(true)}>Cancelar consulta</Button>
          </Group>
        </>
      );
    if (a.status === 'aguardando')
      return (
        <>
          <Text size="sm" c="dimmed">{a.pet.name} está na sala de espera. O veterinário inicia o atendimento pela tela dele.</Text>
          <Group grow>
            <Button variant="default" onClick={() => run(api.appointments.setStatus(a.id, 'agendada'), 'Chegada desfeita.')}>Desfazer chegada</Button>
            <Button variant="default" color="red" onClick={() => setCancelling(true)}>Cancelar</Button>
          </Group>
        </>
      );
    if (a.status === 'em_atendimento') return <Text size="sm" c="dimmed">Em atendimento desde {a.startedAt ?? a.time}.</Text>;
    if (a.status === 'concluida') return <Text size="sm" c="dimmed">Atendimento concluído{a.finishedAt ? ` às ${a.finishedAt}` : ''}. A cobrança aparece no caixa.</Text>;
    return <Text size="sm" c="dimmed">Consulta cancelada{a.cancelReason ? `: ${a.cancelReason}` : '.'}</Text>;
  }, [a, vets.data, vetId, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!a) return <Text c="dimmed" size="sm">Carregando…</Text>;
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={600} size="lg">{a.pet.name}</Text>
          <Text size="sm" c="dimmed">{a.pet.species} · {a.pet.breed}</Text>
        </div>
        <Pill status={a.status} map={APPT_STATUS} />
      </Group>
      <div style={{ border: '1px solid var(--vc-line)', borderRadius: 8, overflow: 'hidden' }}>
        <Facts items={[['Data', `${fmtDate(a.date)} às ${a.time}`], ['Atendimento', a.type]]} />
        <Facts items={[['Veterinário', a.vet?.name ?? 'A definir'], ['Duração', `${a.duration} min`]]} />
        <Facts items={[['Tutor', a.tutor.name], ['Telefone', a.tutor.phone]]} />
      </div>
      {a.pet.alerts && <Text size="sm" c="red.8" fw={500}>Alerta clínico: {a.pet.alerts}</Text>}
      {a.notes && (
        <div>
          <Text size="xs" c="dimmed">{a.source === 'tutor' ? 'Motivo informado pelo tutor' : 'Observações'}</Text>
          <Text size="sm">{a.notes}</Text>
        </div>
      )}
      {a.requestedAt && <Text size="xs" c="dimmed">Pedido feito pelo portal em {fmtDateTime(a.requestedAt)}</Text>}
      {cancelling ? (
        <Stack gap="sm">
          <Textarea label={a.status === 'solicitada' ? 'Motivo da recusa' : 'Motivo do cancelamento'} placeholder="Opcional, o tutor recebe junto do aviso" value={reason} onChange={(e) => setReason(e.currentTarget.value)} autosize minRows={2} />
          <Group grow>
            <Button variant="default" onClick={() => setCancelling(false)}>Voltar</Button>
            <Button color="red" loading={busy} onClick={() => run(api.appointments.setStatus(a.id, 'cancelada', reason.trim() || undefined), a.status === 'solicitada' ? 'Pedido recusado.' : 'Consulta cancelada.', true)}>
              {a.status === 'solicitada' ? 'Recusar pedido' : 'Cancelar consulta'}
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="sm">{actions}</Stack>
      )}
    </Stack>
  );
}
