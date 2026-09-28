import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../api";
import { dispatchMonitorKey } from "./useDispatchMonitor";
import { settingsKey } from "./useSettings";

type DispatchResponse = { message: string; product: string };

export function useDispatch(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<DispatchResponse>("/jobs/dispatch", token, { method: "POST" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: dispatchMonitorKey(token) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKey(token) }),
  });
}
