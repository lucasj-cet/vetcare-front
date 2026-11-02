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
import Sidebar, { useSidebarCollapsed } from "./Sidebar";

export default function AppLayout() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const items = NAV[user.role];
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

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
          {ROLE_LABEL[user.role]}
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
    <div className={`shell${collapsed ? " collapsed" : ""}`}>
      <Sidebar
        items={items}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        onResetDemo={resetDemo}
        footer={userRow}
      />

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
