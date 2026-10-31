import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import 'dayjs/locale/pt-br';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './styles.css';
import { theme } from './theme';
import { SessionProvider } from './auth/session';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} forceColorScheme="light">
      <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0 }}>
        <Notifications position="top-right" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SessionProvider>
            <App />
          </SessionProvider>
        </BrowserRouter>
      </DatesProvider>
    </MantineProvider>
  </React.StrictMode>,
);
