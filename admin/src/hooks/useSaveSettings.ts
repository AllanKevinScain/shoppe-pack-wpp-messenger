import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../api";
import type { Settings } from "../settings";
import { settingsKey } from "./useSettings";

export function useSaveSettings(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) =>
      request<Settings>("/settings", token, { method: "PUT", body: JSON.stringify(settings) }),
    onSuccess: (settings) => queryClient.setQueryData(settingsKey(token), settings),
  });
}
