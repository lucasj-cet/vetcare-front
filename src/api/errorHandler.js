import { ApiError } from "./errors";

export function handleApiError(error, { navigate, logout }) {
  if (!(error instanceof ApiError)) return;

  if (error.status === 401) {
    if (window.location.pathname === "/login") {
      return;
    }

    logout();
    navigate("/login", { replace: true });
  }
}

let context = null;
export const setErrorContext = (ctx) => {
  context = ctx;
};

export const dispatchApiError = (error) => {
  if (context) handleApiError(error, context);
};
