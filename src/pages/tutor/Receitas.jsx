import { useState } from 'react';
import { Button, Group, Modal, SegmentedControl, Text } from '@mantine/core';
import { IconPrinter, IconShare } from '@tabler/icons-react';
import { api } from '../../api';
import { useSession } from '../../auth/session';
import { useApi } from '../../hooks/useApi';
import { toast } from '../../lib/notify';
import { fmtDate } from '../../lib/format';
import { escapeHtml, printDocument } from '../../lib/download';
import { PrescriptionView } from '../../components/Prescription';
import { Async, Block, DataTable, PageHeader } from '../../components/ui';

function shareText(d) {
  if (d.kind === 'exame') return `${d.title} de ${d.pet.name} (${fmtDate(d.date)}), ${d.lab}: ${d.summary}`;
  return `${d.title} de ${d.pet.name} (${fmtDate(d.date)}), ${d.vet?.name}:\n${d.items.map((i) => `• ${i.drug}, ${i.dose}, ${i.frequency}, por ${i.duration}`).join('\n')}${d.notes ? `\n${d.notes}` : ''}`;
}

async function share(d) {
  const text = shareText(d);
  try {
    if (navigator.share) {
      await navigator.share({ title: d.title, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.ok('Texto do documento copiado. Cole onde quiser compartilhar.');
  } catch (e) {
    if (e?.name !== 'AbortError') toast.err(null, 'Não foi possível compartilhar daqui. Use “Baixar PDF”.');
  }
}

export default function Receitas() {
  const { user } = useSession();
  const tutor = useApi(() => api.tutors.get(user.tutorId), [user.tutorId]);
  const q = useApi(() => api.documents.forTutor(user.tutorId), [user.tutorId]);
  const [kind, setKind] = useState('todos');
  const [rx, setRx] = useState(null);
  const [exam, setExam] = useState(null);
  const rows = (q.data ?? []).filter((d) => kind === 'todos' || d.kind === kind);

  const open = (d) => (d.kind === 'exame' ? setExam(d) : setRx({ ...d, tutor: tutor.data }));

  return (
    <>
      <PageHeader title="Receitas e exames" finding={q.data ? `${q.data.length} documentos dos seus pets` : undefined} />
      <Block
        title="Documentos"
        actions={<SegmentedControl size="xs" value={kind} onChange={setKind} data={[{ value: 'todos', label: 'Todos' }, { value: 'prescricao', label: 'Prescrições' }, { value: 'exame', label: 'Exames' }]} />}
        flush
      >
        <Async q={q} rows={4}>
          {() => (
            <DataTable
              rows={rows}
              empty="Nenhum documento por aqui ainda."
              onRowClick={open}
              columns={[
                { key: 'd', label: 'Data', render: (d) => <span className="tnum">{fmtDate(d.date)}</span> },
                { key: 't', label: 'Documento', render: (d) => (<><div className="cell-main">{d.title}</div><div className="cell-sub">{d.kind === 'exame' ? d.lab : d.items.map((i) => i.drug).join(', ')}</div></>) },
                { key: 'p', label: 'Pet', render: (d) => d.pet.name },
                { key: 'k', label: 'Tipo', render: (d) => <span className="muted">{d.kind === 'exame' ? 'Exame' : 'Prescrição'}</span> },
                { key: 'a', label: '', render: (d) => <Button size="compact-sm" variant="subtle" leftSection={<IconShare size={14} />} onClick={(e) => { e.stopPropagation(); share(d); }}>Compartilhar</Button> },
              ]}
              mobile={{ title: (d) => d.title, sub: (d) => `${d.pet.name} · ${fmtDate(d.date)}`, side: (d) => <Text size="xs" c="dimmed">{d.kind === 'exame' ? 'Exame' : 'Prescrição'}</Text> }}
              minWidth={720}
            />
          )}
        </Async>
      </Block>

      <PrescriptionView rx={rx} onClose={() => setRx(null)} />
      <Modal opened={!!exam} onClose={() => setExam(null)} title="Visualizar documento" size="lg">
        {exam && (
          <>
            <div className="doc">
              <h3>{exam.title}</h3>
              <Text size="sm" c="dimmed">{exam.pet.name} · {fmtDate(exam.date)} · {exam.lab}</Text>
              <Text size="sm" mt="md">{exam.summary}</Text>
            </div>
            <Group justify="flex-end" mt="lg">
              <Button variant="default" leftSection={<IconShare size={16} />} onClick={() => share(exam)}>Compartilhar</Button>
              <Button
                leftSection={<IconPrinter size={16} />}
                onClick={() => {
                  const ok = printDocument(exam.title, `<p><strong>Paciente:</strong> ${escapeHtml(exam.pet.name)}<br><strong>Data:</strong> ${fmtDate(exam.date)}<br><strong>Laboratório:</strong> ${escapeHtml(exam.lab)}</p><h2>Resultado</h2><p>${escapeHtml(exam.summary)}</p>`);
                  if (!ok) toast.err(null, 'O navegador bloqueou a janela de impressão. Libere pop-ups para este site.');
                }}
              >
                Baixar PDF
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </>
  );
}
