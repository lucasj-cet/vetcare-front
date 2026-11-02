import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import "dayjs/locale/pt-br";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./styles.css";
import { theme } from "./theme";
import { SessionProvider } from "./auth/session";
import ApiErrorHandler from "./api/ApiErrorHandler";
import App from "./App";

async function enableMocking() {
  if (!import.meta.env.DEV) return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() =>
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <MantineProvider theme={theme} forceColorScheme="light">
        <DatesProvider settings={{ locale: "pt-br", firstDayOfWeek: 0 }}>
          <Notifications position="top-right" />
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <SessionProvider>
              <ApiErrorHandler />
              <App />
            </SessionProvider>
          </BrowserRouter>
        </DatesProvider>
      </MantineProvider>
    </React.StrictMode>,
  ),
);
