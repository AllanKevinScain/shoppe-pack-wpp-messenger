import { useMutation } from "@tanstack/react-query";
import { request } from "../api";

type Credentials = { email: string; password: string };
type LoginResponse = { token: string };

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      request<LoginResponse>("/auth/login", undefined, { method: "POST", body: JSON.stringify(credentials) }),
  });
}
