import { Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api/errors";
import { useLogin } from "../api/queries/auth";
import { STATUS } from "../api/statusCodes";
import { ROLES, useSession } from "../auth/session";
import { isEmail } from "../lib/format";
import { toast } from "../lib/notify";

export default function Login() {
  const { user } = useSession();
  const navigate = useNavigate();

  const form = useForm({
    validate: {
      email: (v) => (isEmail(v) ? null : "Informe um e-mail válido"),
      password: (v) =>
        v.length >= 6 ? null : "A senha tem pelo menos 6 caracteres",
    },
  });

  const loginMutation = useLogin();

  if (user) {
    return <Navigate to={ROLES[user.role].home} replace />;
  }

  const onSubmit = form.onSubmit(async (v) => {
    try {
      const { user } = await loginMutation.mutateAsync(v);
      navigate(ROLES[user.role].home, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === STATUS.UNAUTHORIZED) {
        toast.err(e, "E-mail ou senha incorretos.");
        return;
      }

      toast.err(e);
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
            Entrar
          </h1>
          <Text size="sm" c="dimmed" mb="lg">
            Acesse com o e-mail cadastrado na clínica.
          </Text>
          <form onSubmit={onSubmit} noValidate>
            <Stack gap="md">
              <TextInput
                label="E-mail"
                type="email"
                placeholder="voce@email.com"
                autoComplete="username"
                {...form.getInputProps("email")}
              />
              <PasswordInput
                label="Senha"
                autoComplete="current-password"
                {...form.getInputProps("password")}
              />
              <Button
                type="submit"
                fullWidth
                loading={loginMutation.isPending}
                mt={4}
              >
                Entrar
              </Button>
            </Stack>
          </form>
        </div>
      </div>
    </div>
  );
}
