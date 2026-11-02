import { Center, Loader } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";
import { tokenStore } from "../api/http";
import { authKeys, useMe } from "../api/queries/auth";

export const ROLES = {
  recepcao: { label: "Recepcionista", home: "/recepcao/pacientes" },
  admin: { label: "Administrador", home: "/admin/pacientes" },
};

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const queryClient = useQueryClient();
  const me = useMe();

  const logout = useCallback(() => {
    tokenStore.set(null);
    queryClient.setQueryData(authKeys.me, null);
    queryClient.removeQueries();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: me.data ?? null,
      logout,
    }),
    [me.data, logout],
  );

  if (me.isLoading) {
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
