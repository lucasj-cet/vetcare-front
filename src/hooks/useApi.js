import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(fn, deps = []) {
  const [state, setState] = useState({
    data: undefined,
    loading: true,
    error: null,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState((s) => ({ ...s, loading: true }));
    try {
      const data = await fnRef.current();
      if (alive.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (alive.current) setState((s) => ({ ...s, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: load };
}

// Estado de "salvando" para botões de envio
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn) => {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }, []);
  return [busy, run];
}
