import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useSaveSettings } from "../hooks/useSaveSettings";
import { useSettings } from "../hooks/useSettings";
import type { Settings } from "../settings";
import { eyebrowClass, fieldClass, inputClass, pageSectionClass, panelClass, panelTitleClass } from "../uiClasses";

export function Security({ token }: { token: string }) {
  const settingsQuery = useSettings(token);
  useEffect(() => {
    if (settingsQuery.error) toast.error(settingsQuery.error.message);
  }, [settingsQuery.error]);
  if (!settingsQuery.data) {
    return (
      <section className={pageSectionClass}>
        <p role="status" className="text-sm text-slate-500">
          Carregando configurações...
        </p>
      </section>
    );
  }
  return <SecurityContent token={token} initialSettings={settingsQuery.data} />;
}

function SecurityContent({ token, initialSettings }: { token: string; initialSettings: Settings }) {
  const saveSettings = useSaveSettings(token);
  const [numberText, setNumberText] = useState(initialSettings.authorized_numbers.join(", "));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const authorized_numbers = numberText
        .split(/[\n,]/)
        .map((number) => number.trim())
        .filter(Boolean);
      const updated = await saveSettings.mutateAsync({ ...initialSettings, authorized_numbers });
      setNumberText(updated.authorized_numbers.join(", "));
      toast.success("Números autorizados salvos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar os números.");
    }
  }

  return (
    <section className={pageSectionClass}>
      <header className="mb-9">
        <span className={eyebrowClass}>SEGURANÇA</span>
        <h1 className="my-2 text-[32px] font-bold tracking-tighter">Controle de acesso</h1>
        <p className="text-sm text-slate-500">Gerencie os números permitidos e as orientações de acesso ao painel.</p>
      </header>
      <form className={panelClass} onSubmit={save}>
        <h2 className={panelTitleClass}>
          <ShieldCheck /> Números autorizados
        </h2>
        <p className="text-sm text-slate-500">
          Cadastre os números com código do país e DDD. O envio automático atual continua restrito ao grupo configurado
          no dashboard.
        </p>
        <label
          className={fieldClass}
          title="Números permitidos para automações e comandos futuros, separados por vírgula ou linha."
        >
          Lista de números
          <textarea
            className={inputClass + " min-h-28 resize-y"}
            placeholder="5511999999999, 5511888888888"
            value={numberText}
            onChange={(event) => setNumberText(event.target.value)}
            rows={4}
          />
          <small className="font-normal text-slate-500">Separe os números por vírgula ou por linha.</small>
        </label>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-slate-500" role="status">
            {`${initialSettings.authorized_numbers.length} número(s) salvo(s)`}
          </span>
          <button
            disabled={saveSettings.isPending}
            className="cursor-pointer rounded-lg bg-slate-900 px-4 py-3 text-[13px] font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveSettings.isPending ? "Salvando..." : "Salvar números"}
          </button>
        </div>
      </form>
      <article className={panelClass}>
        <h2 className={panelTitleClass}>
          <ShieldCheck /> Acesso administrativo
        </h2>
        <p className="text-sm leading-relaxed text-slate-500">
          O e-mail e a senha do administrador são definidos no arquivo{" "}
          <code className="font-mono text-sky-700">.env</code> do projeto. Mantenha esse arquivo privado e altere a
          senha padrão antes de disponibilizar o painel em rede.
        </p>
      </article>
    </section>
  );
}
