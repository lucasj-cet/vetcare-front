import { useState } from 'react';
import { ActionIcon, Button, Group, SegmentedControl, Select, SimpleGrid, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { api, REPORT_NAMES } from '../../api';
import { useSession } from '../../auth/session';
import { useApi, useSubmit } from '../../hooks/useApi';
import { toast } from '../../lib/notify';
import { brl, fmtDate, fmtDateTime, toISO } from '../../lib/format';
import { downloadCsv, printDocument, tableHtml } from '../../lib/download';
import { Async, Block, DataTable, PageHeader } from '../../components/ui';

const PERIODS = {
  mes: () => [dayjs().startOf('month'), dayjs()],
  anterior: () => [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
  '30': () => [dayjs().subtract(29, 'day'), dayjs()],
};

const MONEY_REPORTS = ['financeiro', 'produtividade'];

async function deliver({ type, from, to, format }, data) {
  const fmt = (row) => row.map((c, i) => (typeof c === 'number' && data.numeric.includes(i) && MONEY_REPORTS.includes(type) && !(type === 'produtividade' && i === 1) ? brl(c) : c));
  const title = `${data.name} · ${fmtDate(from)} a ${fmtDate(to)}`;
  if (format === 'CSV') {
    downloadCsv(`vetcare-${type}-${from}-a-${to}.csv`, data.header, data.rows);
  } else if (!printDocument(title, tableHtml(data.header, data.rows.map(fmt), data.numeric))) {
    toast.err(null, 'O navegador bloqueou a janela de impressão. Libere pop-ups para este site.');
  }
}

export default function Relatorios() {
  const { user } = useSession();
  const [type, setType] = useState('financeiro');
  const [period, setPeriod] = useState('mes');
  const [range, setRange] = useState(PERIODS.mes().map((d) => d.toDate()));
  const [format, setFormat] = useState('CSV');
  const [preview, setPreview] = useState(null);
  const [busy, submit] = useSubmit();
  const history = useApi(() => api.reports.list(), []);

  const pickPeriod = (p) => {
    setPeriod(p);
    if (PERIODS[p]) setRange(PERIODS[p]().map((d) => d.toDate()));
  };

  const generate = () =>
    submit(async () => {
      const [a, b] = range;
      if (!a || !b) return toast.err(null, 'Escolha o período completo.');
      const params = { type, from: toISO(a), to: toISO(b), format, by: user.id };
      try {
        const data = await api.reports.generate(params);
        setPreview({ ...params, data });
        await deliver(params, data);
        toast.ok(`${data.name} gerado.`);
      } catch (e) {
        toast.err(e);
      }
    });

  const again = (r) =>
    submit(async () => {
      const data = await api.reports.generate({ ...r, save: false });
      await deliver(r, data);
    });

  return (
    <>
      <PageHeader title="Relatórios" finding="Gere e baixe os relatórios da clínica em planilha (CSV) ou PDF" />
      <div className="stack">
        <Block title="Gerar relatório">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <Select label="Relatório" data={Object.entries(REPORT_NAMES).map(([value, label]) => ({ value, label }))} value={type} onChange={(v) => v && setType(v)} allowDeselect={false} />
            <Select
              label="Período"
              value={period}
              onChange={(v) => v && pickPeriod(v)}
              allowDeselect={false}
              data={[{ value: 'mes', label: 'Este mês' }, { value: 'anterior', label: 'Mês passado' }, { value: '30', label: 'Últimos 30 dias' }, { value: 'custom', label: 'Escolher datas' }]}
            />
            <DatePickerInput type="range" label="Datas" valueFormat="DD/MM/YYYY" value={range} onChange={(v) => { setRange(v); setPeriod('custom'); }} maxDate={new Date()} allowSingleDateInRange />
            <div>
              <Text size="sm" fw={500} mb={4}>Formato</Text>
              <SegmentedControl fullWidth value={format} onChange={setFormat} data={['CSV', 'PDF']} />
            </div>
          </SimpleGrid>
          <Group justify="space-between" mt="lg" wrap="wrap">
            <Text size="sm" c="dimmed">
              {type === 'vacinas' ? 'Lista as doses atrasadas e as dos próximos 30 dias, com o telefone do tutor.' : 'O CSV abre direto no Excel. O PDF abre a janela de impressão.'}
            </Text>
            <Button leftSection={<IconDownload size={16} />} onClick={generate} loading={busy}>Exportar relatório</Button>
          </Group>
        </Block>

        {preview && (
          <Block title={`Prévia · ${preview.data.name}`} sub={`${fmtDate(preview.from)} a ${fmtDate(preview.to)} · ${preview.data.rows.length} linhas`} flush>
            <DataTable
              rows={preview.data.rows.slice(0, 12).map((r, i) => ({ id: i, r }))}
              empty="O relatório saiu vazio para esse período."
              columns={preview.data.header.map((h, i) => ({
                key: String(i),
                label: h,
                num: preview.data.numeric.includes(i),
                render: (row) => {
                  const c = row.r[i];
                  if (typeof c !== 'number') return c;
                  return MONEY_REPORTS.includes(preview.type) && !(preview.type === 'produtividade' && i === 1) ? brl(c) : c;
                },
              }))}
              minWidth={640}
            />
            {preview.data.rows.length > 12 && <div className="block-foot"><Text size="sm" c="dimmed">Mostrando 12 de {preview.data.rows.length} linhas. O arquivo tem todas.</Text></div>}
          </Block>
        )}

        <Block title="Gerados recentemente" flush>
          <Async q={history}>
            {(rows) => (
              <DataTable
                rows={rows}
                empty="Nenhum relatório gerado ainda."
                columns={[
                  { key: 'n', label: 'Relatório', render: (r) => <span className="cell-main">{r.name}</span> },
                  { key: 'p', label: 'Período', render: (r) => `${fmtDate(r.from)} a ${fmtDate(r.to)}` },
                  { key: 'f', label: 'Formato', render: (r) => r.format },
                  { key: 'c', label: 'Gerado em', render: (r) => (<><div>{fmtDateTime(r.createdAt)}</div><div className="cell-sub">{r.author?.name}</div></>) },
                  { key: 'a', label: '', render: (r) => <ActionIcon variant="subtle" color="gray" aria-label="Baixar de novo" onClick={() => again(r)}><IconDownload size={16} /></ActionIcon> },
                ]}
                mobile={{ title: (r) => r.name, sub: (r) => `${fmtDate(r.from)} a ${fmtDate(r.to)} · ${r.format}`, side: (r) => <ActionIcon variant="subtle" color="gray" aria-label="Baixar de novo" onClick={(e) => { e.stopPropagation(); again(r); }}><IconDownload size={16} /></ActionIcon> }}
              />
            )}
          </Async>
        </Block>
      </div>
    </>
  );
}
