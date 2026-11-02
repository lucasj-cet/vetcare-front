import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ApiErrorHandler from "./api/ApiErrorHandler";
import { queryClient } from "./api/queryClient";
import App from "./App";
import { SessionProvider } from "./auth/session";
import { theme } from "./theme";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "dayjs/locale/pt-br";
import "./styles.css";

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
            <QueryClientProvider client={queryClient}>
              <SessionProvider>
                <ApiErrorHandler />
                <App />
              </SessionProvider>
              <ReactQueryDevtools />
            </QueryClientProvider>
          </BrowserRouter>
        </DatesProvider>
      </MantineProvider>
    </React.StrictMode>,
  ),
);
