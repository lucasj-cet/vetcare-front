import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { db } from '../api/db';

const KEY = 'vetcare.session';

export const ROLES = {
  tutor: { label: 'Tutor', home: '/tutor/pets' },
  recepcao: { label: 'Recepcionista', home: '/recepcao/agenda' },
  vet: { label: 'Veterinário', home: '/vet/atendimentos' },
  admin: { label: 'Administrador', home: '/admin/dashboard' },
};

const SessionContext = createContext(null);

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && ROLES[s.role] && db.find('users', s.userId) ? s : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(read);

  const login = useCallback((s) => {
    localStorage.setItem(KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setSession(null);
  }, []);

  const value = useMemo(() => {
    const user = session ? db.find('users', session.userId) : null;
    return {
      session,
      role: session?.role,
      user,
      // quem está vendo: usado para filtrar avisos e dados do tutor
      viewer: session ? { role: session.role, userId: session.userId, tutorId: user?.tutorId } : null,
      login,
      logout,
    };
  }, [session, login, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
