import { useEffect, useState } from "react";
import { Clock3, Send, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useSaveSettings } from "../hooks/useSaveSettings";
import { useSettings } from "../hooks/useSettings";
import type { Settings, Strategy } from "../settings";
import { fieldClass, inputClass, panelClass, panelTitleClass } from "../uiClasses";

export function SettingsForm({ token }: { token: string }) {
  const settingsQuery = useSettings(token);
  useEffect(() => {
    if (settingsQuery.error) toast.error(settingsQuery.error.message);
  }, [settingsQuery.error]);
  if (!settingsQuery.data) {
    return (
      <p role="status" className="text-sm text-slate-500">
        Carregando configurações...
      </p>
    );
  }
  return <SettingsEditor token={token} initialSettings={settingsQuery.data} />;
}

function SettingsEditor({ token, initialSettings }: { token: string; initialSettings: Settings }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const saveSettings = useSaveSettings(token);
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await saveSettings.mutateAsync(settings);
      setSettings(result);
      toast.success("Configurações salvas. O n8n aplicará o intervalo no próximo ciclo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }
  return (
    <form onSubmit={save}>
      <div className="grid gap-4.5 md:grid-cols-[1.45fr_1fr]">
        <article className={panelClass}>
          <h2 className={panelTitleClass}>
            <Send /> Destino da campanha
          </h2>
          <p className="text-sm text-slate-500">O grupo deve existir na conta WhatsApp conectada.</p>
          <label className={fieldClass} title="Nome exato do grupo do WhatsApp que receberá as ofertas.">
            Nome exato do grupo
            <input
              className={inputClass}
              value={settings.group_name}
              onChange={(e) => setSettings({ ...settings, group_name: e.target.value })}
            />
          </label>
        </article>
        <article className={panelClass + " bg-linear-to-br from-sky-50 to-white"}>
          <h2 className={panelTitleClass}>
            <Clock3 /> Frequência
          </h2>
          <label
            className={fieldClass}
            title="Tempo, em minutos, entre os envios automáticos ao grupo; mínimo de 15 minutos."
          >
            Intervalo entre envios (minutos)
            <input
              className={inputClass}
              type="number"
              min="15"
              value={settings.interval_minutes}
              onChange={(e) => setSettings({ ...settings, interval_minutes: Number(e.target.value) })}
            />
          </label>
          <p className="mt-2.25 text-xs text-slate-500">
            Mínimo de 15 minutos para reduzir risco de mensagens indesejadas.
          </p>
          <p className="mt-6.5 rounded-lg bg-white p-2.5 text-xs text-slate-500">
            Último envio:{" "}
            {initialSettings.last_dispatch_at
              ? new Date(initialSettings.last_dispatch_at).toLocaleString("pt-BR")
              : "ainda não realizado"}
          </p>
        </article>
      </div>
      <article className={panelClass}>
        <h2 className={panelTitleClass}>
          <Sparkles /> Estratégia de seleção
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {(
            [
              [
                "best_potential",
                "Maior potencial",
                "Combina vendas, desconto, comissão e uma faixa de preço mais acessível.",
              ],
              ["lowest_price", "Produto mais barato", "Prioriza o menor preço entre as ofertas elegíveis."],
              ["highest_commission", "Maior comissão", "Prioriza o retorno percentual e absoluto do afiliado."],
            ] as [Strategy, string, string][]
          ).map(([key, title, description]) => (
            <label
              key={key}
              title={description}
              className={
                "grid cursor-pointer gap-1.75 rounded-xl border p-4 " +
                (settings.strategy === key
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-200 bg-white hover:border-sky-300")
              }
            >
              <input
                className="h-4 w-4 accent-sky-500"
                type="radio"
                checked={settings.strategy === key}
                onChange={() => setSettings({ ...settings, strategy: key })}
              />
              <strong className="text-sm">{title}</strong>
              <span className="text-xs leading-normal font-normal text-slate-500">{description}</span>
            </label>
          ))}
        </div>
      </article>
      <button
        disabled={saveSettings.isPending}
        className="inline-flex cursor-pointer items-center gap-2.25 rounded-[9px] bg-slate-900 px-4.25 py-3 text-[13px] font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
      >
        {saveSettings.isPending ? "Salvando..." : "Salvar configurações"} <span>→</span>
      </button>
    </form>
  );
}
