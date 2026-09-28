import { Activity, ExternalLink, RefreshCw } from "lucide-react";
import { useDispatchMonitor } from "../hooks/useDispatchMonitor";
import type { DispatchAttempt, DispatchMonitor } from "../hooks/useDispatchMonitor";
import { eyebrowClass, pageSectionClass, panelClass } from "../uiClasses";

function dateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString("pt-BR") : "Ainda não registrado";
}

function connectionStatus(monitor: DispatchMonitor): { label: string; tone: string; description: string } {
  const check = monitor.last_check;
  if (!check) {
    return {
      label: "Aguardando n8n",
      tone: "text-amber-700",
      description: "Nenhuma verificação foi registrada desde que o monitoramento foi ativado.",
    };
  }
  const minutesSinceCheck = (Date.parse(monitor.server_time) - Date.parse(check.checked_at)) / 60_000;
  if (minutesSinceCheck > 3) {
    return {
      label: "Sem contato recente",
      tone: "text-red-700",
      description: "Confira se n8n e backend estão ligados e veja a aba Executions no n8n.",
    };
  }
  if (check.status === "failed") {
    return {
      label: "Última tentativa falhou",
      tone: "text-red-700",
      description: "Veja a falha no histórico abaixo e a execução correspondente no n8n.",
    };
  }
  return {
    label: "n8n em contato",
    tone: "text-green-700",
    description: "A verificação automática está chegando ao backend.",
  };
}

function attemptLabel(attempt: DispatchAttempt): string {
  if (attempt.status === "accepted") return "Aceito pela Evolution";
  if (attempt.status === "failed") return "Falhou";
  return "Em andamento ou interrompido";
}

export function Dispatches({ token }: { token: string }) {
  const monitor = useDispatchMonitor(token);
  const data = monitor.data;
  const connection = data ? connectionStatus(data) : null;

  return (
    <section className={pageSectionClass}>
      <header className="mb-9 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={eyebrowClass}>ACOMPANHAMENTO</span>
          <h1 className="my-2 text-[32px] font-bold tracking-tighter">Envios do sistema</h1>
          <p className="text-sm text-slate-500">Acompanhe as verificações do n8n e as tentativas de envio da API.</p>
        </div>
        <button
          type="button"
          onClick={() => monitor.refetch()}
          disabled={monitor.isFetching}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={"h-4 w-4 " + (monitor.isFetching ? "animate-spin" : "")} /> Atualizar
        </button>
      </header>

      {monitor.isError && (
        <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Não foi possível carregar o monitoramento: {monitor.error.message}
        </p>
      )}
      {!data && !monitor.isError && (
        <p role="status" className="text-sm text-slate-500">
          Carregando histórico...
        </p>
      )}

      {data && connection && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <article className={panelClass}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Activity className="h-4 w-4" /> Contato do n8n
              </h2>
              <p className={"mt-3 text-xl font-bold " + connection.tone}>{connection.label}</p>
              <p className="mt-2 text-xs text-slate-500">
                Última verificação: {dateTime(data.last_check?.checked_at ?? null)}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{connection.description}</p>
            </article>
            <article className={panelClass}>
              <h2 className="text-sm font-semibold text-slate-500">Próximo envio previsto</h2>
              <p className="mt-3 text-lg font-bold">{dateTime(data.next_due_at)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Intervalo configurado: {data.interval_minutes} minutos. O n8n verifica a cada minuto.
              </p>
            </article>
            <article className={panelClass}>
              <h2 className="text-sm font-semibold text-slate-500">Último envio aceito</h2>
              <p className="mt-3 text-lg font-bold">{dateTime(data.last_dispatch_at)}</p>
              <p className="mt-2 text-xs text-slate-500">
                Aceito pela Evolution API não confirma a entrega no WhatsApp.
              </p>
            </article>
          </div>

          <article className={panelClass}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Tentativas recentes</h2>
              <a
                className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
                href="http://localhost:5678/workflow/kraSNqp9n4UmIoHj/executions/96"
                target="_blank"
                rel="noreferrer"
              >
                Ver execuções no n8n <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {data.attempts.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma tentativa registrada desde a ativação deste histórico. Envios anteriores aparecem apenas no
                cartão acima.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.attempts.map((attempt) => (
                  <li key={attempt.id} className="grid gap-1 py-4 text-sm md:grid-cols-[180px_110px_1fr] md:gap-4">
                    <time className="text-slate-500" dateTime={attempt.started_at}>
                      {dateTime(attempt.started_at)}
                    </time>
                    <span className="text-slate-600">{attempt.source === "automatic" ? "Automático" : "Manual"}</span>
                    <div>
                      <strong
                        className={
                          attempt.status === "failed"
                            ? "text-red-700"
                            : attempt.status === "accepted"
                              ? "text-green-700"
                              : "text-amber-700"
                        }
                      >
                        {attemptLabel(attempt)}
                      </strong>
                      {attempt.product && <p className="mt-1 text-slate-600">{attempt.product}</p>}
                      {attempt.error && <p className="mt-1 text-red-700">{attempt.error}</p>}
                      {attempt.status === "pending" && (
                        <p className="mt-1 text-slate-500">
                          Se permanecer assim após alguns minutos, o processo pode ter sido interrompido.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
    </section>
  );
}
