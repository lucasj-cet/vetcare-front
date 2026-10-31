import { Button, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { api } from '../../api';
import { useApi } from '../../hooks/useApi';
import { brl, brlShort, int } from '../../lib/format';
import { downloadCsv } from '../../lib/download';
import { BarList, ColumnChart } from '../../components/charts';
import { Async, Block, Kpis, KpisLoading, PageHeader } from '../../components/ui';

function delta(cur, prev) {
  if (!prev) return {};
  const d = Math.round(((cur - prev) / prev) * 100);
  if (d === 0) return { hint: 'igual ao mesmo período do mês passado' };
  return { hint: `${d > 0 ? '+' : '−'}${Math.abs(d)}% vs. mesmo período do mês passado`, trend: d > 0 ? 'up' : 'down' };
}

export default function Dashboard() {
  const q = useApi(() => api.dashboard.overview(), []);
  const d = q.data;
  const month = dayjs().format('MMMM [de] YYYY');

  const exportCsv = () => {
    downloadCsv(
      `vetcare-faturamento-${dayjs().format('YYYY-MM')}.csv`,
      ['Data', 'Hora', 'Descrição', 'Forma de pagamento', 'Parcelas', 'Valor (R$)'],
      d.payments
        .slice()
        .sort((a, b) => a.paidAt.localeCompare(b.paidAt))
        .map((c) => [dayjs(c.paidAt).format('DD/MM/YYYY'), c.paidAt.slice(11, 16), c.description, c.method, c.installments, c.amount]),
    );
  };

  const change = d && d.prevRevenue ? (d.revenue - d.prevRevenue) / d.prevRevenue : 0;
  const finding = d
    ? `${brl(d.revenue)} faturados em ${month}, ${Math.abs(Math.round(change * 100))}% ${change >= 0 ? 'acima' : 'abaixo'} do mesmo período do mês passado`
    : undefined;

  return (
    <>
      <PageHeader title="Dashboard" finding={finding}>
        <Button variant="default" leftSection={<IconDownload size={16} />} onClick={exportCsv} disabled={!d}>Exportar relatório</Button>
      </PageHeader>
      <div className="stack">
        {d ? (
          <Kpis
            items={[
              { label: 'Faturamento no mês', value: brlShort(d.revenue), ...delta(d.revenue, d.prevRevenue) },
              { label: 'Atendimentos', value: int(d.visits), ...delta(d.visits, d.prevVisits) },
              { label: 'Ticket médio', value: brl(d.ticket), ...delta(d.ticket, d.prevTicket) },
              { label: 'A receber', value: brl(d.pending), hint: `${d.pendingCount} ${d.pendingCount === 1 ? 'cobrança' : 'cobranças'} em aberto` },
            ]}
          />
        ) : (
          <KpisLoading />
        )}

        <div className="grid-2">
          <Block title="Faturamento semanal" sub="Últimas 8 semanas · a coluna clara é a semana em andamento">
            <Async q={q} rows={6}>{(data) => <ColumnChart data={data.weeks} />}</Async>
          </Block>
          <Block title="Por forma de pagamento" sub={`Recebido em ${month}`}>
            <Async q={q} rows={5}>{(data) => <BarList items={data.methods} format={brl} />}</Async>
          </Block>
        </div>

        <div className="grid-even">
          <Block title="Por veterinário" sub={`Faturamento e atendimentos em ${month}`}>
            <Async q={q}>
              {(data) => (
                <BarList
                  items={data.byVet.map((v) => ({ ...v, share: data.revenue ? v.value / data.revenue : 0 }))}
                  format={(v) => brl(v)}
                />
              )}
            </Async>
            {d && (
              <Text size="sm" c="dimmed" mt="md">
                {d.byVet.map((v) => `${v.label}: ${v.visits} atendimentos`).join(' · ')}
              </Text>
            )}
          </Block>
          <Block title="Atendimentos por tipo" sub={`${d ? int(d.visits) : '—'} concluídos em ${month}`}>
            <Async q={q}>{(data) => <BarList items={data.services} format={(v) => `${v}`} />}</Async>
          </Block>
        </div>
      </div>
    </>
  );
}
