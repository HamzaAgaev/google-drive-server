import { useEffect, useState, type DependencyList } from "react";

export type ApiState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "success"; data: T };

export function useApi<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    load(controller.signal)
      .then((data) => setState({ status: "success", data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: "error", error });
        }
      });
    return () => controller.abort();
  }, deps);

  return state;
}
