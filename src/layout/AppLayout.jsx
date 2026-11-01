import { ActionIcon, Button, Drawer, Stack, Text } from "@mantine/core";
import { IconLogout, IconMenu2, IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useSession } from "../auth/session";
import { PersonAvatar } from "../components/ui";
import { act } from "../lib/notify";
import { ROLE_LABEL } from "../lib/status";
import { NAV } from "./nav";

export default function AppLayout() {
  const { role, user, logout } = useSession();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
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
    </div>
  );
}
