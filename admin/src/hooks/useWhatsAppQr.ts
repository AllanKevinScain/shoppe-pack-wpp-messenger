import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { request } from "../api";

type QrData = { image?: string; code?: string };

function qrData(value: unknown): QrData {
  if (!value || typeof value !== "object") return {};
  const data = value as Record<string, unknown>;
  const nested = data.qrcode && typeof data.qrcode === "object" ? (data.qrcode as Record<string, unknown>) : {};
  const base64 = data.base64 ?? nested.base64;
  if (typeof base64 === "string" && base64.trim()) {
    const image = base64.trim();
    if (image.startsWith("data:image/")) return { image };
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(image)) return { image: `data:image/png;base64,${image}` };
  }
  const code = data.code ?? nested.code ?? (typeof data.qrcode === "string" ? data.qrcode : undefined);
  return typeof code === "string" && code.trim() ? { code: code.trim() } : {};
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Cancelado", "AbortError"));
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      },
      { once: true },
    );
  });
}

export function useWhatsAppQr(token: string) {
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const mutation = useMutation({
    mutationFn: async (): Promise<QrData> => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      for (let attempt = 0; attempt < 6; attempt++) {
        const result = qrData(await request<unknown>("/whatsapp/qr", token, { signal: current.signal }));
        if (result.image || result.code) return result;
        if (attempt < 5) await wait(2000, current.signal);
      }
      throw new Error(
        "A Evolution API ainda não gerou um QR Code (retornou apenas o contador). Confira o estado e os logs da instância e tente novamente.",
      );
    },
  });

  return {
    ...mutation,
    refresh: () => {
      mutation.reset();
      return mutation.mutateAsync();
    },
  };
}
