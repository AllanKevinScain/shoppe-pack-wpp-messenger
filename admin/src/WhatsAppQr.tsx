import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { useWhatsAppQr } from "./hooks/useWhatsAppQr";

export function WhatsAppQr({ token }: { token: string }) {
  const qr = useWhatsAppQr(token);

  async function refresh() {
    try {
      await qr.refresh();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "Não foi possível obter o QR Code.");
    }
  }

  return (
    <div className="grid min-w-[200px] content-start gap-[15px]">
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#25d366] px-[17px] py-3 text-[13px] font-bold text-[#073b1c] transition-colors hover:bg-[#1ebe5b] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-green-300 disabled:cursor-wait disabled:opacity-70 [&_svg]:h-4 [&_svg]:w-4"
        onClick={refresh}
        disabled={qr.isPending}
      >
        <QrCode /> {qr.isPending ? "Buscando QR Code..." : "Atualizar QR Code"}
      </button>
      {qr.data?.image && (
        <img
          className="w-[224px] max-w-full rounded-xl bg-white p-2.5"
          src={qr.data.image}
          alt="QR Code de conexão do WhatsApp"
        />
      )}
      {qr.data?.code && (
        <QRCodeSVG
          className="max-w-full rounded-xl bg-white"
          value={qr.data.code}
          size={224}
          marginSize={2}
          title="QR Code de conexão do WhatsApp"
        />
      )}
      {(qr.isPending || qr.isSuccess || qr.isError) && (
        <p className="max-w-[260px] text-sm leading-[1.45] text-slate-300" role="status">
          {qr.isPending
            ? "Aguardando a Evolution API gerar o QR Code..."
            : qr.isError
              ? qr.error.message
              : "Leia este QR Code com o WhatsApp para conectar a instância."}
        </p>
      )}
    </div>
  );
}
