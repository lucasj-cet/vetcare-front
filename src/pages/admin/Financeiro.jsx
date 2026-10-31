import { useState } from 'react';
import { ActionIcon, Button, Group, Modal, NumberInput, SegmentedControl, Select, SimpleGrid, Table, Text, TextInput } from '@mantine/core';
import { DatePickerInput, MonthPickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { api } from '../../api';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../data/seed';
import { useApi, useSubmit } from '../../hooks/useApi';
import { act } from '../../lib/notify';
import { brl, brlShort, fmtDate, toISO } from '../../lib/format';
import { BarList } from '../../components/charts';
import { Async, Block, ConfirmDialog, DataTable, FormActions, Kpis, KpisLoading, PageHeader } from '../../components/ui';

export default function Financeiro() {
  const [month, setMonth] = useState(dayjs().startOf('month').toDate());
  const [kind, setKind] = useState('todas');
  const [add, setAdd] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busy, submit] = useSubmit();
  const key = dayjs(month).format('YYYY-MM');
  const prevKey = dayjs(month).subtract(1, 'month').format('YYYY-MM');
  const q = useApi(() => Promise.all([api.finance.month(key), api.finance.month(prevKey)]), [key]);
  const [d, prev] = q.data ?? [];
  const rows = (d?.rows ?? []).filter((r) => kind === 'todas' || r.kind === kind);
  const label = dayjs(month).format('MMMM [de] YYYY');
  const shownIn = rows.filter((r) => r.kind === 'receita').reduce((s, r) => s + r.amount, 0);
  const shownOut = rows.filter((r) => r.kind === 'despesa').reduce((s, r) => s + r.amount, 0);

  const remove = () => submit(async () => { if (await act(api.finance.remove(toDelete.id), 'Lançamento excluído.')) setToDelete(null); });
  const trend = (cur, before, goodWhenUp = true) => {
    if (!before) return {};
    const diff = Math.round(((cur - before) / before) * 100);
    if (diff === 0) return { hint: 'igual ao mês anterior' };
    return { hint: `${diff > 0 ? '+' : '−'}${Math.abs(diff)}% vs. mês anterior`, trend: (diff > 0) === goodWhenUp ? 'up' : 'down' };
  };

  return (
    <>
      <PageHeader
        title="Financeiro"
        finding={d ? `Saldo de ${brl(d.balance)} em ${label}${dayjs(month).isSame(dayjs(), 'month') ? ' até hoje' : ''}` : undefined}
      >
        <MonthPickerInput value={month} onChange={(v) => v && setMonth(v)} maxDate={new Date()} valueFormat="MMMM YYYY" w={170} aria-label="Mês" />
        <Button leftSection={<IconPlus size={16} />} onClick={() => setAdd(true)}>Nova movimentação</Button>
      </PageHeader>

      <div className="stack">
        {d ? (
          <Kpis
            items={[
              { label: 'Receitas', value: brlShort(d.totalIn), ...trend(d.totalIn, prev.totalIn) },
              { label: 'Despesas', value: brlShort(d.totalOut), ...trend(d.totalOut, prev.totalOut, false) },
              { label: 'Saldo', value: brlShort(d.balance), trend: d.balance >= 0 ? 'up' : 'down', hint: d.totalIn ? `margem de ${Math.round((d.balance / d.totalIn) * 100)}%` : undefined },
            ]}
          />
        ) : (
          <KpisLoading n={3} />
        )}

        <div className="grid-2">
          <Block title="Movimentações" sub={label} actions={<SegmentedControl size="xs" value={kind} onChange={setKind} data={[{ value: 'todas', label: 'Todas' }, { value: 'receita', label: 'Receitas' }, { value: 'despesa', label: 'Despesas' }]} />} flush>
            <Async q={q} rows={8}>
              {() => (
                <DataTable
                  rows={rows}
                  empty="Nenhuma movimentação neste mês."
                  columns={[
                    { key: 'd', label: 'Data', render: (r) => <span className="tnum">{fmtDate(r.date)}</span> },
                    { key: 'x', label: 'Descrição', render: (r) => (<><div className="cell-main">{r.description}</div><div className="cell-sub">{r.category}</div></>) },
                    { key: 'v', label: 'Valor', num: true, render: (r) => <Text size="sm" className="tnum" c={r.kind === 'despesa' ? 'red.8' : undefined}>{r.kind === 'despesa' ? '−' : '+'} {brl(r.amount)}</Text> },
                    { key: 'a', label: '', width: 44, render: (r) => !r.auto && <ActionIcon variant="subtle" color="gray" aria-label="Excluir lançamento" onClick={() => setToDelete(r)}><IconTrash size={15} /></ActionIcon> },
                  ]}
                  mobile={{ title: (r) => r.description, sub: (r) => `${fmtDate(r.date)} · ${r.category}`, side: (r) => <Text size="sm" className="tnum" c={r.kind === 'despesa' ? 'red.8' : undefined}>{r.kind === 'despesa' ? '−' : '+'} {brl(r.amount)}</Text> }}
                  minWidth={520}
                  footer={rows.length ? {
                    cells: (<><Table.Td colSpan={2}>{kind === 'todas' ? 'Saldo do período' : kind === 'receita' ? 'Total de receitas' : 'Total de despesas'}</Table.Td><Table.Td className="num">{brl(kind === 'despesa' ? shownOut : shownIn - shownOut)}</Table.Td><Table.Td /></>),
                    mobile: (<><span>Total</span><span className="tnum">{brl(kind === 'despesa' ? shownOut : shownIn - shownOut)}</span></>),
                  } : undefined}
                />
              )}
            </Async>
          </Block>
          <Block title="Despesas por categoria" sub={label}>
            <Async q={q}>{([cur]) => <BarList items={cur.expenseByCategory} format={brl} />}</Async>
            <Text size="xs" c="dimmed" mt="lg">As receitas do caixa entram aqui sozinhas, somadas por dia. Lance as despesas e outras receitas em Nova movimentação.</Text>
          </Block>
        </div>
      </div>

      <MovementModal opened={add} onClose={() => setAdd(false)} />
      <ConfirmDialog opened={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy} title="Excluir lançamento">
        Excluir “{toDelete?.description}” de {brl(toDelete?.amount)}?
      </ConfirmDialog>
    </>
  );
}

function MovementModal({ opened, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Nova movimentação" size="lg">
      {opened && <MovementForm onClose={onClose} />}
    </Modal>
  );
}

function MovementForm({ onClose }) {
  const form = useForm({
    initialValues: { kind: 'despesa', description: '', category: null, amount: '', date: new Date() },
    validate: {
      description: (v) => (v.trim() ? null : 'Descreva a movimentação'),
      category: (v) => (v ? null : 'Escolha a categoria'),
      amount: (v) => (Number(v) > 0 ? null : 'Informe o valor'),
      date: (v) => (v ? null : 'Informe a data'),
    },
  });
  const [busy, submit] = useSubmit();
  const cats = form.values.kind === 'despesa' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return (
    <form
      noValidate
      onSubmit={form.onSubmit((v) =>
        submit(async () => {
          const ok = await act(api.finance.add({ kind: v.kind, description: v.description.trim(), category: v.category, amount: Number(v.amount), date: toISO(v.date) }), 'Movimentação lançada.');
          if (ok) onClose();
        }),
      )}
    >
      <SegmentedControl
        fullWidth
        mb="md"
        value={form.values.kind}
        onChange={(k) => { form.setFieldValue('kind', k); form.setFieldValue('category', null); }}
        data={[{ value: 'despesa', label: 'Despesa' }, { value: 'receita', label: 'Receita' }]}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput label="Descrição" placeholder={form.values.kind === 'despesa' ? 'Ex.: Fornecedor de medicamentos' : 'Ex.: Banho e tosa (parceiro)'} style={{ gridColumn: '1 / -1' }} {...form.getInputProps('description')} />
        <Select label="Categoria" data={cats} {...form.getInputProps('category')} />
        <NumberInput label="Valor" prefix="R$ " decimalSeparator="," thousandSeparator="." decimalScale={2} min={0} hideControls {...form.getInputProps('amount')} />
        <DatePickerInput label="Data" valueFormat="DD/MM/YYYY" {...form.getInputProps('date')} />
      </SimpleGrid>
      <Group mt="xs" />
      <FormActions onCancel={onClose} loading={busy} submitLabel="Lançar" />
    </form>
  );
}
