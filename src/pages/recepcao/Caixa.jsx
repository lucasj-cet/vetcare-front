import { useState } from 'react';
import { Button, Table, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { api } from '../../api';
import { useApi } from '../../hooks/useApi';
import { brl, relDay, todayISO } from '../../lib/format';
import PaymentModal from '../../components/PaymentModal';
import { Async, Block, DataTable, Kpis, KpisLoading, PageHeader } from '../../components/ui';

export default function Caixa() {
  const [pay, setPay] = useState(null); // { charge? }
  const today = todayISO();
  const paid = useApi(() => api.charges.paidOn(today), [today]);
  const pending = useApi(() => api.charges.pending(), []);

  const received = (paid.data ?? []).reduce((s, c) => s + c.amount, 0);
  const open = (pending.data ?? []).reduce((s, c) => s + c.amount, 0);
  const n = paid.data?.length ?? 0;
  const byMethod = (paid.data ?? []).reduce((m, c) => ({ ...m, [c.method]: (m[c.method] ?? 0) + c.amount }), {});
  const topMethod = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <PageHeader
        title="Caixa"
        finding={paid.data ? `${brl(received)} recebidos hoje em ${n} ${n === 1 ? 'pagamento' : 'pagamentos'}` : 'Caixa do dia'}
      >
        <Button leftSection={<IconPlus size={16} />} onClick={() => setPay({})}>Registrar pagamento</Button>
      </PageHeader>

      <div className="stack">
        {paid.data && pending.data ? (
          <Kpis
            items={[
              { label: 'Recebido hoje', value: brl(received) },
              { label: 'A receber', value: brl(open), hint: `${pending.data.length} ${pending.data.length === 1 ? 'cobrança' : 'cobranças'} em aberto` },
              { label: 'Pagamentos hoje', value: n },
              { label: 'Forma mais usada', value: topMethod ? topMethod[0] : '—', hint: topMethod ? brl(topMethod[1]) : undefined },
            ]}
          />
        ) : (
          <KpisLoading />
        )}

        <div className="grid-even">
          <Block title="A receber" sub="Atendimentos concluídos e cobranças em aberto" flush>
            <Async q={pending}>
              {(rows) => (
                <DataTable
                  rows={rows}
                  empty="Nenhuma cobrança em aberto."
                  columns={[
                    { key: 'd', label: 'Descrição', render: (c) => (<><div className="cell-main">{c.description}</div><div className="cell-sub">{c.tutor?.name ?? 'Sem tutor'} · desde {relDay(c.createdAt)}</div></>) },
                    { key: 'v', label: 'Valor', num: true, render: (c) => brl(c.amount) },
                    { key: 'a', label: '', render: (c) => <Button size="compact-sm" variant="light" onClick={() => setPay({ charge: c })}>Receber</Button> },
                  ]}
                  mobile={{
                    title: (c) => c.description,
                    sub: (c) => `${c.tutor?.name ?? 'Sem tutor'} · desde ${relDay(c.createdAt)}`,
                    side: (c) => (<><span className="tnum">{brl(c.amount)}</span><Button size="compact-xs" variant="light" onClick={() => setPay({ charge: c })}>Receber</Button></>),
                  }}
                  minWidth={420}
                  footer={rows.length ? {
                    cells: (<><Table.Td>Total em aberto</Table.Td><Table.Td className="num">{brl(open)}</Table.Td><Table.Td /></>),
                    mobile: (<><span>Total em aberto</span><span className="tnum">{brl(open)}</span></>),
                  } : undefined}
                />
              )}
            </Async>
          </Block>

          <Block title="Pagamentos de hoje" sub={dayjs().format('DD/MM/YYYY')} flush>
            <Async q={paid}>
              {(rows) => (
                <DataTable
                  rows={rows}
                  empty="Nenhum pagamento registrado hoje."
                  columns={[
                    { key: 'h', label: 'Hora', render: (c) => <span className="tnum">{c.paidAt.slice(11, 16)}</span> },
                    { key: 'd', label: 'Descrição', render: (c) => <span className="cell-main">{c.description}</span> },
                    { key: 'm', label: 'Forma', render: (c) => <span className="muted">{c.method}{c.installments > 1 ? ` ${c.installments}x` : ''}</span> },
                    { key: 'v', label: 'Valor', num: true, render: (c) => brl(c.amount) },
                  ]}
                  mobile={{ title: (c) => c.description, sub: (c) => `${c.paidAt.slice(11, 16)} · ${c.method}`, side: (c) => <span className="tnum">{brl(c.amount)}</span> }}
                  minWidth={460}
                  footer={rows.length ? {
                    cells: (<><Table.Td colSpan={3}>Total do dia</Table.Td><Table.Td className="num">{brl(received)}</Table.Td></>),
                    mobile: (<><span>Total do dia</span><span className="tnum">{brl(received)}</span></>),
                  } : undefined}
                />
              )}
            </Async>
            {Object.keys(byMethod).length > 0 && (
              <div className="block-foot" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', columnGap: 20 }}>
                {Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                  <Text key={m} size="sm"><span className="muted">{m}</span> <span className="tnum">{brl(v)}</span></Text>
                ))}
              </div>
            )}
          </Block>
        </div>
      </div>

      <PaymentModal opened={!!pay} onClose={() => setPay(null)} charge={pay?.charge} />
    </>
  );
}
