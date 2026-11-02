import { Anchor, Button, PasswordInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAcceptInvite } from "../api/queries/users";
import { ROLES } from "../auth/session";
import { isStrongPassword, PASSWORD_RULE } from "../lib/password";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const accept = useAcceptInvite();

  const form = useForm({
    initialValues: { password: "", confirm: "" },
    validate: {
      password: (v) => (isStrongPassword(v) ? null : PASSWORD_RULE),
      confirm: (v, values) =>
        v === values.password ? null : "As senhas não são iguais",
    },
  });

  const onSubmit = form.onSubmit(async ({ password }) => {
    try {
      const user = await accept.mutateAsync({ token, password });
      navigate(ROLES[user.role].home, { replace: true });
    } catch {
      // the global mutation handler already showed the API message
    }
  });

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <img src="/favicon.svg" alt="" />
          <div>
            <Text fw={600} size="lg" lh={1.2}>
              VetCare
            </Text>
            <Text size="sm" c="dimmed">
              Clínica veterinária
            </Text>
          </div>
        </div>
        <div className="login-panel">
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600 }}>
            Defina sua senha
          </h1>
          <Text size="sm" c="dimmed" mb="lg">
            Você foi convidado para o VetCare. Escolha uma senha para entrar.
          </Text>
          <form onSubmit={onSubmit} noValidate>
            <Stack gap="md">
              <PasswordInput
                label="Senha"
                autoComplete="new-password"
                {...form.getInputProps("password")}
              />
              <PasswordInput
                label="Confirmar senha"
                autoComplete="new-password"
                {...form.getInputProps("confirm")}
              />
              <Button type="submit" fullWidth loading={accept.isPending} mt={4}>
                Definir senha e entrar
              </Button>
              <Anchor component={Link} to="/login" size="sm" ta="center">
                Voltar ao login
              </Anchor>
            </Stack>
          </form>
        </div>
      </div>
    </div>
  );
}
