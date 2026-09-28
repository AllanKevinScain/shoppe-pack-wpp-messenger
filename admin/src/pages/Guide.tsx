import { WhatsAppQr } from "../WhatsAppQr";
import { eyebrowClass, pageSectionClass } from "../uiClasses";

export function Guide({ token }: { token: string }) {
  return (
    <section className={pageSectionClass}>
      <header className="mb-9">
        <span className={eyebrowClass}>GUIA DE INÍCIO</span>
        <h1 className="my-2 text-[32px] font-bold tracking-tighter">Conecte antes do primeiro envio</h1>
        <p className="text-sm text-slate-500">Siga estas etapas para preparar a automação e conectar o WhatsApp.</p>
      </header>
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-slate-900 p-7 text-slate-200 md:flex-row">
        <div>
          <ol className="list-decimal space-y-2 pl-5 text-[13px] leading-7 text-slate-300">
            <li>Após os serviços estarem disponíveis.</li>
            <li>
              <a
                className="text-sky-300 underline-offset-2 hover:underline"
                href="http://localhost:8080/manager"
                target="_blank"
                rel="noreferrer"
              >
                Abra a Evolution API
              </a>
              , verifique a instância <code className="font-mono text-sky-300">shopee-messenger</code> e use o QR ao
              lado.
            </li>
            <li>
              Preencha as credenciais da Shopee e, opcionalmente, do Gemini em{" "}
              <code className="font-mono text-sky-300">.env</code>.
            </li>
            <li>Inicie o backend e o painel. O botão “Enviar agora” serve apenas para disparos manuais.</li>
          </ol>
        </div>
        <WhatsAppQr token={token} />
      </div>
      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-lg font-bold">Ative o envio automático no n8n</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600">
          <li>
            Abra{" "}
            <a className="text-sky-700 hover:underline" href="http://localhost:5678" target="_blank" rel="noreferrer">
              o n8n
            </a>{" "}
            e importe <code className="font-mono">n8n/workflows/send-offer-automatically.json</code>.
          </li>
          <li>
            No nó “Enviar se estiver na hora”, configure uma credencial Header Auth: nome{" "}
            <code className="font-mono">X-Dispatch-Token</code>, valor{" "}
            <code className="font-mono">N8N_DISPATCH_TOKEN</code> do arquivo <code className="font-mono">.env</code>.
          </li>
          <li>Salve e publique/ative o workflow uma vez. Mantenha n8n e backend ligados.</li>
          <li>
            Defina o intervalo no dashboard. O n8n verifica a cada minuto e a API envia somente quando o intervalo
            termina.
          </li>
        </ol>
      </article>
    </section>
  );
}
