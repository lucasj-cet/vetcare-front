import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { db } from "../api/db";

const KEY = "vetcare.session";

export const ROLES = {
  recepcao: { label: "Recepcionista", home: "/recepcao/cadastros" },
  admin: { label: "Administrador", home: "/admin/cadastros" },
};

const SessionContext = createContext(null);

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && ROLES[s.role] && db.find("users", s.userId) ? s : null;
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
    const user = session ? db.find("users", session.userId) : null;
    return {
      session,
      role: session?.role,
      user,
      login,
      logout,
    };
  }, [session, login, logout]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
