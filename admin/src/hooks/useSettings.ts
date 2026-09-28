import { useQuery } from "@tanstack/react-query";
import { request } from "../api";
import type { Settings } from "../settings";

export const settingsKey = (token: string) => ["settings", token] as const;

export function useSettings(token: string) {
  return useQuery({
    queryKey: settingsKey(token),
    queryFn: ({ signal }) => request<Settings>("/settings", token, { signal }),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}
