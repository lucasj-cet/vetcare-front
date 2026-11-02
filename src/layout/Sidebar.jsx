import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const STORAGE_KEY = "vc-sidebar-collapsed";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  return [collapsed, toggle];
}

export default function Sidebar({ items, collapsed, onToggle, footer }) {
  const toggleLabel = collapsed
    ? "Expandir barra lateral"
    : "Recolher barra lateral";

  const toggle = (
    <button
      type="button"
      className="side-btn side-toggle"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={toggleLabel}
      title={toggleLabel}
    >
      {collapsed ? (
        <IconLayoutSidebarLeftExpand size={18} stroke={1.8} />
      ) : (
        <IconLayoutSidebarLeftCollapse size={18} stroke={1.8} />
      )}
    </button>
  );

  return (
    <aside className="sidebar">
      {collapsed && toggle}
      <div className="clinic">
        <img src="/favicon.svg" alt="" />
        <div className="txt">
          <div className="clinic-name">VetCare</div>
          <div className="clinic-sub">Clínica veterinária</div>
        </div>
        {!collapsed && toggle}
      </div>
      <div className="nav-label">Menu principal</div>
      <nav aria-label="Menu principal">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="nav-link"
            title={collapsed ? label : undefined}
          >
            <Icon size={16} stroke={1.8} />
            <span className="txt">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ flex: 1 }} />

      {footer}
    </aside>
  );
}
