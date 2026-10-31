import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Anchor, Button, Group, Modal, PasswordInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { api } from '../api';
import { ROLES, useSession } from '../auth/session';
import { useSubmit } from '../hooks/useApi';
import { act, toast } from '../lib/notify';
import { isEmail } from '../lib/format';

// e-mail de exemplo de cada perfil da demonstração
const DEMO_EMAIL = {
  recepcao: 'ana.costa@vetcare.com.br',
  vet: 'camila.rocha@vetcare.com.br',
  admin: 'renata.freitas@vetcare.com.br',
  tutor: 'marina.ribeiro@email.com',
};

const PROFILES = [
  { value: 'recepcao', label: 'Recepcionista' },
  { value: 'vet', label: 'Veterinário' },
  { value: 'admin', label: 'Administrador' },
  { value: 'tutor', label: 'Tutor' },
];

export default function Login() {
  const { session, login } = useSession();
  const navigate = useNavigate();
  const [forgot, setForgot] = useState(false);
  const [autoEntry] = useState(() => (import.meta.env.DEV ? new URLSearchParams(window.location.search) : null));
  const form = useForm({
    initialValues: { role: 'recepcao', email: DEMO_EMAIL.recepcao, password: '12345678' },
    validate: {
      email: (v) => (isEmail(v) ? null : 'Informe um e-mail válido'),
      password: (v) => (v.length >= 6 ? null : 'A senha tem pelo menos 6 caracteres'),
    },
  });
  const [busy, submit] = useSubmit();

  // só em desenvolvimento: /login?entrar=vet&ir=/vet/prontuarios entra direto (usado nas capturas de tela)
  useEffect(() => {
    const role = autoEntry?.get('entrar');
    if (!ROLES[role]) return;
    api.auth.login({ role, email: DEMO_EMAIL[role], password: '12345678' }).then((s) => {
      login(s);
      navigate(autoEntry.get('ir') || ROLES[role].home, { replace: true });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (session && !autoEntry?.get('entrar')) return <Navigate to={ROLES[session.role].home} replace />;

  const onSubmit = form.onSubmit((v) =>
    submit(async () => {
      try {
        const s = await api.auth.login(v);
        login(s);
        navigate(ROLES[s.role].home, { replace: true });
      } catch (e) {
        toast.err(e);
      }
    }),
  );

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <img src="/favicon.svg" alt="" />
          <div>
            <Text fw={600} size="lg" lh={1.2}>VetCare</Text>
            <Text size="sm" c="dimmed">Clínica veterinária</Text>
          </div>
        </div>
        <div className="login-panel">
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 600 }}>Entrar</h1>
          <Text size="sm" c="dimmed" mb="lg">Acesse com o e-mail cadastrado na clínica.</Text>
          <form onSubmit={onSubmit} noValidate>
            <Stack gap="md">
              <Select
                label="Perfil de demonstração"
                data={PROFILES}
                allowDeselect={false}
                {...form.getInputProps('role')}
                onChange={(role) => {
                  form.setFieldValue('role', role);
                  form.setFieldValue('email', DEMO_EMAIL[role]);
                }}
              />
              <TextInput label="E-mail" type="email" placeholder="voce@email.com" autoComplete="username" {...form.getInputProps('email')} />
              <PasswordInput label="Senha" autoComplete="current-password" {...form.getInputProps('password')} />
              <Button type="submit" fullWidth loading={busy} mt={4}>
                Entrar
              </Button>
              <Anchor component="button" type="button" size="sm" onClick={() => setForgot(true)} ta="center">
                Esqueci minha senha
              </Anchor>
            </Stack>
          </form>
        </div>
        <Text size="xs" c="dimmed" ta="center" mt="md">
          Ambiente de demonstração: os dados ficam guardados só neste navegador.
        </Text>
      </div>
      <ForgotModal opened={forgot} onClose={() => setForgot(false)} email={form.values.email} />
    </div>
  );
}

function ForgotModal({ opened, onClose, email }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Recuperar senha" size="sm">
      {opened && <ForgotForm onClose={onClose} email={email} />}
    </Modal>
  );
}

function ForgotForm({ onClose, email }) {
  const form = useForm({ initialValues: { email }, validate: { email: (v) => (isEmail(v) ? null : 'Informe um e-mail válido') } });
  const [busy, submit] = useSubmit();
  return (
    <form
      noValidate
      onSubmit={form.onSubmit((v) =>
        submit(async () => {
          if (await act(api.auth.recover(v.email), `Enviamos as instruções para ${v.email}.`)) onClose();
        }),
      )}
    >
      <Text size="sm" c="dimmed" mb="md">Vamos mandar um link para você criar uma senha nova.</Text>
      <TextInput label="E-mail" type="email" {...form.getInputProps('email')} />
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button type="submit" loading={busy}>Enviar recuperação</Button>
      </Group>
    </form>
  );
}
