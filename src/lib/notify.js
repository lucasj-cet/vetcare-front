import { notifications } from '@mantine/notifications';

export const toast = {
  ok: (message) => notifications.show({ message, color: 'teal', withBorder: true }),
  err: (error, fallback = 'Não foi possível concluir a ação. Tente de novo.') =>
    notifications.show({ message: error?.userMessage || fallback, color: 'red', withBorder: true }),
};

// Executa uma chamada da API mostrando o aviso de sucesso ou o erro. Devolve true se deu certo.
export async function act(promise, okMessage) {
  try {
    await promise;
    if (okMessage) toast.ok(okMessage);
    return true;
  } catch (error) {
    toast.err(error);
    return false;
  }
}
