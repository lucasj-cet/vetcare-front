import { ApiError } from "./errors";
import { STATUS } from "./statusCodes";

export function handleApiError(error, { navigate, logout }) {
  if (!(error instanceof ApiError)) return;

  if (error.status === STATUS.UNAUTHORIZED) {
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
