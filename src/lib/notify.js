import { notifications } from "@mantine/notifications";
import { dispatchApiError } from "../api/errorHandler";

export const toast = {
  ok: (message) =>
    notifications.show({ message, color: "teal", withBorder: true }),
  err: (
    error,
    fallback = "Não foi possível concluir a ação. Tente de novo.",
  ) => {
    dispatchApiError(error);
    notifications.show({
      message: error?.userMessage || fallback,
      color: "red",
      withBorder: true,
    });
  },
};

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
