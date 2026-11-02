import { Center, Loader } from "@mantine/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api";
import { ApiError } from "../api/errors";
import { STATUS } from "../api/statusCodes";
import { tokenStore } from "../api/http";

export const ROLES = {
  recepcao: { label: "Recepcionista", home: "/recepcao/cadastros" },
  admin: { label: "Administrador", home: "/admin/cadastros" },
};

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    api.auth
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === STATUS.UNAUTHORIZED) tokenStore.set(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(({ token, user }) => {
    tokenStore.set(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      session: user,
      role: user?.role,
      user,
      login,
      logout,
    }),
    [user, login, logout],
  );

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
