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
            <li>Inicie o backend e o painel; depois use “Enviar agora” no dashboard para a demonstração.</li>
          </ol>
        </div>
        <WhatsAppQr token={token} />
      </div>
    </section>
  );
}
