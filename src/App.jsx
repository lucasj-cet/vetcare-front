import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ROLES, useSession } from './auth/session';
import AppLayout from './layout/AppLayout';
import Login from './pages/Login';
import Agenda from './pages/recepcao/Agenda';
import Cadastros from './pages/recepcao/Cadastros';
import Caixa from './pages/recepcao/Caixa';
import Atendimentos from './pages/vet/Atendimentos';
import Prontuarios, { Prontuario } from './pages/vet/Prontuarios';
import VetVacinas from './pages/vet/Vacinas';
import Prescricoes from './pages/vet/Prescricoes';
import Dashboard from './pages/admin/Dashboard';
import Relatorios from './pages/admin/Relatorios';
import Usuarios from './pages/admin/Usuarios';
import Financeiro from './pages/admin/Financeiro';
import MeusPets from './pages/tutor/MeusPets';
import TutorVacinas from './pages/tutor/Vacinas';
import Consultas from './pages/tutor/Consultas';
import Receitas from './pages/tutor/Receitas';

function RequireAuth() {
  const { session } = useSession();
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

// cada perfil só entra nas próprias páginas
function RoleGate({ role }) {
  const { session } = useSession();
  return session.role === role ? <Outlet /> : <Navigate to={ROLES[session.role].home} replace />;
}

function Home() {
  const { session } = useSession();
  return <Navigate to={session ? ROLES[session.role].home : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="tutor" element={<RoleGate role="tutor" />}>
            <Route path="pets" element={<MeusPets />} />
            <Route path="vacinas" element={<TutorVacinas />} />
            <Route path="consultas" element={<Consultas />} />
            <Route path="receitas" element={<Receitas />} />
          </Route>
          <Route path="recepcao" element={<RoleGate role="recepcao" />}>
            <Route path="agenda" element={<Agenda />} />
            <Route path="cadastros" element={<Cadastros />} />
            <Route path="caixa" element={<Caixa />} />
          </Route>
          <Route path="vet" element={<RoleGate role="vet" />}>
            <Route path="atendimentos" element={<Atendimentos />} />
            <Route path="prontuarios" element={<Prontuarios />} />
            <Route path="prontuarios/:petId" element={<Prontuario />} />
            <Route path="vacinas" element={<VetVacinas />} />
            <Route path="prescricoes" element={<Prescricoes />} />
          </Route>
          <Route path="admin" element={<RoleGate role="admin" />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="financeiro" element={<Financeiro />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
