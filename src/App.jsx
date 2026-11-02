import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ROLES, useSession } from "./auth/session";
import AppLayout from "./layout/AppLayout";
import Usuarios from "./pages/admin/Usuarios";
import AcceptInvite from "./pages/AcceptInvite";
import Login from "./pages/Login";
import Pacientes from "./pages/recepcao/Pacientes";

function RequireAuth() {
  const { user } = useSession();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

// cada perfil só entra nas próprias páginas
function RoleGate({ role }) {
  const { user } = useSession();
  return user.role === role ? (
    <Outlet />
  ) : (
    <Navigate to={ROLES[user.role].home} replace />
  );
}

function Home() {
  const { user } = useSession();
  return <Navigate to={user ? ROLES[user.role].home : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/convite/:token" element={<AcceptInvite />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="recepcao" element={<RoleGate role="RECEP" />}>
            <Route path="pacientes" element={<Pacientes />} />
          </Route>
          <Route path="admin" element={<RoleGate role="ADMIN" />}>
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
