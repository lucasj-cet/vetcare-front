import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Indicator,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconBell,
  IconLogout,
  IconMenu2,
  IconRefresh,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { api } from "../api";
import { useSession } from "../auth/session";
import { useApi } from "../hooks/useApi";
import { act } from "../lib/notify";
import { ROLE_LABEL } from "../lib/status";
import { Empty, PersonAvatar } from "../components/ui";
import { NAV } from "./nav";

export default function AppLayout() {
  const { role, user, viewer, logout } = useSession();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const notes = useApi(
    () => api.notifications.list(viewer),
    [viewer.role, viewer.userId],
  );
  const unread = (notes.data ?? []).filter((n) => !n.read).length;
  const items = NAV[role];

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const resetDemo = async () => {
    if (await act(api.demo.reset(), "Dados de demonstração restaurados."))
      setMenu(false);
  };

  const userRow = (
    <div className="user-row">
      <PersonAvatar name={user.name} size={32} />
      <div className="who">
        <Text size="sm" fw={500}>
          {user.name}
        </Text>
        <Text size="xs" c="dimmed">
          {role === "tutor" ? "Portal do tutor" : ROLE_LABEL[role]}
        </Text>
      </div>
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={signOut}
        aria-label="Sair"
      >
        <IconLogout size={17} />
      </ActionIcon>
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="clinic">
          <img src="/favicon.svg" alt="" />
          <div>
            <div className="clinic-name">VetCare</div>
            <div className="clinic-sub">Clínica veterinária</div>
          </div>
        </div>
        <div className="nav-label">Menu principal</div>
        <nav aria-label="Menu principal">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link">
              <Icon size={16} stroke={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="side-btn"
          onClick={() => setBell(true)}
        >
          <IconBell size={16} stroke={1.8} />
          Avisos
          {unread > 0 && <span className="count">{unread}</span>}
        </button>
        <button type="button" className="side-btn" onClick={resetDemo}>
          <IconRefresh size={16} stroke={1.8} />
          Restaurar demonstração
        </button>
        {userRow}
      </aside>

      <header className="topbar">
        <div className="brand">
          <img src="/favicon.svg" alt="" />
          VetCare
        </div>
        <Indicator
          disabled={!unread}
          label={unread}
          size={16}
          offset={6}
          color="teal"
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => setBell(true)}
            aria-label="Avisos"
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={() => setMenu(true)}
          aria-label="Abrir menu"
        >
          <IconMenu2 size={20} />
        </ActionIcon>
      </header>

      <main className="main">
        <div className="content">
          <Outlet />
        </div>
      </main>

      <nav className="bottomnav" aria-label="Navegação">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} stroke={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Drawer
        opened={menu}
        onClose={() => setMenu(false)}
        title="Menu"
        size="85%"
      >
        <Stack gap="xs">
          {userRow}
          <Button
            variant="default"
            leftSection={<IconRefresh size={16} />}
            onClick={resetDemo}
          >
            Restaurar dados de demonstração
          </Button>
          <Button
            variant="light"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={signOut}
          >
            Sair
          </Button>
        </Stack>
      </Drawer>

      <Modal
        opened={bell}
        onClose={() => setBell(false)}
        title="Avisos"
        size="md"
      >
        {(notes.data ?? []).length === 0 ? (
          <Empty>Nenhum aviso por enquanto.</Empty>
        ) : (
          <Stack gap={0}>
            {notes.data.slice(0, 8).map((n) => (
              <UnstyledButton
                key={n.id}
                onClick={() => {
                  setBell(false);
                  if (n.to) navigate(n.to);
                }}
                py="sm"
                style={{ borderTop: "1px solid var(--vc-line)" }}
              >
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginTop: 7,
                      flexShrink: 0,
                      background: n.read ? "transparent" : "var(--vc-teal)",
                    }}
                  />
                  <div>
                    <Text size="sm" fw={n.read ? 400 : 500}>
                      {n.text}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {dayjs(n.createdAt).format("DD/MM [às] HH:mm")}
                    </Text>
                  </div>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setBell(false)}>
            Fechar
          </Button>
          <Button
            disabled={!unread}
            onClick={() =>
              act(
                api.notifications.markAllRead(viewer),
                "Avisos marcados como lidos.",
              )
            }
          >
            Marcar como lidas
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
