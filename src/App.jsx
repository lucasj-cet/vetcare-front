import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ROLES, useSession } from "./auth/session";
import AppLayout from "./layout/AppLayout";
import Usuarios from "./pages/admin/Usuarios";
import Login from "./pages/Login";
import Cadastros from "./pages/recepcao/Cadastros";

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
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="recepcao" element={<RoleGate role="recepcao" />}>
            <Route path="cadastros" element={<Cadastros />} />
          </Route>
          <Route path="admin" element={<RoleGate role="admin" />}>
            <Route path="cadastros" element={<Cadastros />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
