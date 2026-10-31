import { useState } from 'react';
import { ActionIcon, Button, Group, Menu, Modal, Select, SimpleGrid, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDots, IconMailForward, IconPlus, IconUserCheck, IconUserOff, IconUserCog } from '@tabler/icons-react';
import { api } from '../../api';
import { useSession } from '../../auth/session';
import { useApi, useSubmit } from '../../hooks/useApi';
import { act } from '../../lib/notify';
import { fmtDateTime, isEmail, relDay } from '../../lib/format';
import { ROLE_LABEL, USER_STATUS } from '../../lib/status';
import { Async, Block, ConfirmDialog, DataTable, FormActions, Kpis, PageHeader, PersonAvatar, Pill } from '../../components/ui';

const STAFF_ROLES = ['recepcao', 'vet', 'admin'].map((value) => ({ value, label: ROLE_LABEL[value] }));

export default function Usuarios() {
  const { user: me } = useSession();
  const [invite, setInvite] = useState(false);
  const [roleFor, setRoleFor] = useState(null);
  const [deactivate, setDeactivate] = useState(null);
  const [busy, submit] = useSubmit();
  const q = useApi(() => api.staff.list(), []);
  const all = q.data ?? [];
  const n = (s) => all.filter((u) => u.status === s).length;

  const setStatus = (u, status, msg) => submit(async () => { if (await act(api.staff.update(u.id, { status }), msg)) setDeactivate(null); });

  return (
    <>
      <PageHeader title="Usuários" finding={q.data ? `${n('ativo')} pessoas com acesso${n('convite') ? ` · ${n('convite')} convite(s) esperando resposta` : ''}` : undefined}>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setInvite(true)}>Convidar usuário</Button>
      </PageHeader>
      <div className="stack">
        <Kpis
          items={[
            { label: 'Ativos', value: n('ativo') },
            { label: 'Convites pendentes', value: n('convite') },
            { label: 'Desativados', value: n('inativo') },
            { label: 'Veterinários', value: all.filter((u) => u.role === 'vet' && u.status === 'ativo').length },
          ]}
        />
        <Block title="Equipe" sub="Tutores entram pelo portal com o e-mail do cadastro e não aparecem aqui" flush>
          <Async q={q} rows={6}>
            {(rows) => (
              <DataTable
                rows={rows}
                columns={[
                  { key: 'n', label: 'Nome', render: (u) => (<Group gap="sm" wrap="nowrap"><PersonAvatar name={u.name} size={30} color={u.status === 'inativo' ? 'gray' : 'teal'} /><div><div className="cell-main">{u.name}{u.id === me.id ? ' (você)' : ''}</div><div className="cell-sub">{u.email}</div></div></Group>) },
                  { key: 'r', label: 'Perfil', render: (u) => (<><div>{ROLE_LABEL[u.role]}</div>{u.crmv && <div className="cell-sub">{u.crmv}</div>}</>) },
                  { key: 's', label: 'Situação', render: (u) => <Pill status={u.status} map={USER_STATUS} /> },
                  { key: 'l', label: 'Último acesso', render: (u) => (u.status === 'convite' ? <span className="muted">Convite enviado {relDay(u.invitedAt)}</span> : u.lastSeen ? fmtDateTime(u.lastSeen) : <span className="faint">—</span>) },
                  {
                    key: 'a', label: '', width: 48,
                    render: (u) =>
                      u.id !== me.id && (
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label={`Ações para ${u.name}`}><IconDots size={16} /></ActionIcon></Menu.Target>
                          <Menu.Dropdown>
                            {u.status === 'convite' && <Menu.Item leftSection={<IconMailForward size={15} />} onClick={() => act(api.staff.resendInvite(u.id), `Convite reenviado para ${u.email}.`)}>Reenviar convite</Menu.Item>}
                            <Menu.Item leftSection={<IconUserCog size={15} />} onClick={() => setRoleFor(u)}>Alterar perfil</Menu.Item>
                            {u.status === 'inativo' ? (
                              <Menu.Item leftSection={<IconUserCheck size={15} />} onClick={() => setStatus(u, 'ativo', `${u.name} foi reativado.`)}>Reativar acesso</Menu.Item>
                            ) : (
                              <Menu.Item leftSection={<IconUserOff size={15} />} color="red" onClick={() => setDeactivate(u)}>Desativar acesso</Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      ),
                  },
                ]}
                mobile={{ title: (u) => u.name, sub: (u) => `${ROLE_LABEL[u.role]} · ${u.email}`, side: (u) => <Pill status={u.status} map={USER_STATUS} size="sm" /> }}
                minWidth={760}
              />
            )}
          </Async>
        </Block>
      </div>

      <InviteModal opened={invite} onClose={() => setInvite(false)} />
      <RoleModal user={roleFor} onClose={() => setRoleFor(null)} />
      <ConfirmDialog
        opened={!!deactivate}
        onClose={() => setDeactivate(null)}
        title="Desativar acesso"
        confirmLabel="Desativar"
        loading={busy}
        onConfirm={() => setStatus(deactivate, 'inativo', `Acesso de ${deactivate.name} desativado.`)}
      >
        {deactivate?.name} não vai mais conseguir entrar no VetCare. Os registros feitos por essa pessoa continuam no sistema e o acesso pode ser reativado depois.
      </ConfirmDialog>
    </>
  );
}

function InviteModal({ opened, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Convidar usuário" size="lg">
      {opened && <InviteForm onClose={onClose} />}
    </Modal>
  );
}

function InviteForm({ onClose }) {
  const form = useForm({
    initialValues: { name: '', email: '', role: 'recepcao', crmv: '' },
    validate: {
      name: (v) => (v.trim().split(' ').length < 2 ? 'Informe nome e sobrenome' : null),
      email: (v) => (isEmail(v) ? null : 'E-mail inválido'),
      crmv: (v, values) => (values.role === 'vet' && !v.trim() ? 'Veterinários precisam do CRMV' : null),
    },
  });
  const [busy, submit] = useSubmit();
  return (
    <form
      noValidate
      onSubmit={form.onSubmit((v) =>
        submit(async () => {
          const ok = await act(api.staff.invite({ name: v.name.trim(), email: v.email.trim().toLowerCase(), role: v.role, crmv: v.crmv.trim() }), `Convite enviado para ${v.email.trim()}.`);
          if (ok) onClose();
        }),
      )}
    >
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput label="Nome completo" {...form.getInputProps('name')} />
        <TextInput label="E-mail" type="email" {...form.getInputProps('email')} />
        <Select label="Perfil de acesso" data={STAFF_ROLES} allowDeselect={false} {...form.getInputProps('role')} />
        {form.values.role === 'vet' && <TextInput label="CRMV" placeholder="CRMV-SP 00.000" {...form.getInputProps('crmv')} />}
      </SimpleGrid>
      <FormActions onCancel={onClose} loading={busy} submitLabel="Enviar convite" />
    </form>
  );
}

function RoleModal({ user, onClose }) {
  const [role, setRole] = useState(null);
  const [busy, submit] = useSubmit();
  return (
    <Modal opened={!!user} onClose={onClose} title={user ? `Perfil de ${user.name}` : ''} size="sm">
      {user && (
        <>
          <Select label="Perfil de acesso" data={STAFF_ROLES} defaultValue={user.role} onChange={setRole} allowDeselect={false} />
          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button loading={busy} disabled={!role || role === user.role} onClick={() => submit(async () => { if (await act(api.staff.update(user.id, { role }), 'Perfil alterado.')) onClose(); })}>
              Salvar
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
