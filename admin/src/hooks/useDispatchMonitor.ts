import { useQuery } from "@tanstack/react-query";
import { request } from "../api";

export type DispatchAttempt = {
  id: number;
  source: "automatic" | "manual";
  status: "pending" | "accepted" | "failed";
  started_at: string;
  finished_at: string | null;
  stage: string | null;
  product: string | null;
  error: string | null;
};

export type DispatchMonitor = {
  server_time: string;
  next_due_at: string | null;
  last_dispatch_at: string | null;
  interval_minutes: number;
  last_check: { checked_at: string; status: string } | null;
  attempts: DispatchAttempt[];
};

export const dispatchMonitorKey = (token: string) => ["dispatch-monitor", token] as const;

export function useDispatchMonitor(token: string) {
  return useQuery({
    queryKey: dispatchMonitorKey(token),
    queryFn: ({ signal }) => request<DispatchMonitor>("/jobs/monitor", token, { signal }),
    refetchInterval: 15_000,
  });
}
