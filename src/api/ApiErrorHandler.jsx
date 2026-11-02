import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../auth/session";
import { setErrorContext } from "./errorHandler";

export default function ApiErrorHandler() {
  const navigate = useNavigate();
  const { logout } = useSession();

  useEffect(() => {
    setErrorContext({ navigate, logout });
    return () => setErrorContext(null);
  }, [navigate, logout]);

  return null;
}
