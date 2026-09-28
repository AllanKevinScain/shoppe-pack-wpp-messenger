import { LoaderCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import { SettingsForm } from "../components/SettingsForm";
import { useDispatch } from "../hooks/useDispatch";
import { eyebrowClass, pageSectionClass } from "../uiClasses";

const whatsappButtonClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#25d366] px-[17px] py-3 text-[13px] font-bold text-[#073b1c] transition-colors hover:bg-[#1ebe5b] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-green-300 [&_svg]:h-4 [&_svg]:w-4";

export function Dashboard({ token }: { token: string }) {
  const dispatch = useDispatch(token);

  async function sendNow() {
    try {
      const result = await dispatch.mutateAsync();
      toast.success(`${result.message} Produto: ${result.product}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envio não concluído.");
    }
  }

  return (
    <section className={pageSectionClass}>
      <header className="mb-9 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <div>
          <span className={eyebrowClass}>ADMINISTRAÇÃO</span>
          <h1 className="my-2 text-[32px] font-bold tracking-tighter">Central de ofertas</h1>
          <p className="text-sm text-slate-500">Controle o que é enviado e para quem, sem perder a rastreabilidade.</p>
        </div>
        <button
          type="button"
          className={whatsappButtonClass + " disabled:cursor-wait disabled:opacity-70"}
          onClick={sendNow}
          disabled={dispatch.isPending}
          aria-busy={dispatch.isPending}
        >
          {dispatch.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
          {dispatch.isPending ? "Enviando oferta..." : "Enviar agora"}
        </button>
      </header>
      {dispatch.isPending && (
        <p
          className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
          role="status"
          aria-live="polite"
        >
          Selecionando a oferta e aguardando a confirmação do WhatsApp. Não feche esta página.
        </p>
      )}
      <SettingsForm token={token} />
    </section>
  );
}
