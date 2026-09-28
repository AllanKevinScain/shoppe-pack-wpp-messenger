import { useState } from "react";
import type { FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { useLogin } from "../hooks/useLogin";
import { eyebrowClass, inputClass } from "../uiClasses";

export function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("allankevin@sou.faccat.com.br");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await login.mutateAsync({ email, password });
      onLogin(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <main className="mx-auto grid min-h-screen max-w-262.5 items-center gap-8 px-6 py-12 md:grid-cols-[1.1fr_0.9fr] md:gap-22.5 md:px-12.5">
        <section>
          <span className={eyebrowClass}>SHOPEE / WHATSAPP</span>
          <h1 className="my-3.5 text-[42px] leading-[1.02] font-extrabold tracking-[-0.065em] md:text-[54px]">
            Ofertas que encontram seu melhor canal.
          </h1>
          <p className="max-w-107.5 leading-[1.7] text-slate-500">
            Configure, acompanhe e dispare recomendações de afiliado com critérios claros.
          </p>
          <div className="mt-7.5 flex items-center gap-2.5 text-[13px] text-sky-700">
            <Sparkles className="h-4 w-4 text-sky-500" /> IA opcional, decisão auditável
          </div>
        </section>
        <form
          onSubmit={submit}
          className="grid gap-3.75 rounded-[18px] border border-slate-200 bg-white p-8.5 shadow-[0_20px_50px_#0f172a12]"
        >
          <span className="flex items-center gap-2.25 text-[15px] font-extrabold">
            <span className="grid h-7.75 w-7.75 place-items-center rounded-[9px] bg-sky-400 text-[11px] text-sky-950">
              SP
            </span>
            Pack Messenger
          </span>
          <h2 className="my-2.5 text-2xl font-bold">Acessar painel</h2>
          <label
            className="grid gap-1.75 text-xs font-bold"
            title="E-mail do administrador usado para entrar no painel."
          >
            E-mail
            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label
            className="grid gap-1.75 text-xs font-bold"
            title="Senha do administrador definida na variável ADMIN_PASSWORD."
          >
            Senha
            <input
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            disabled={login.isPending}
            className="flex cursor-pointer justify-between rounded-lg bg-slate-900 p-3 font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
          >
            {login.isPending ? "Entrando..." : "Entrar"} <span>→</span>
          </button>
          <small className="leading-normal text-slate-500">
            Uso local: altere a senha padrão no arquivo <code className="font-mono text-sky-700">.env</code>.
          </small>
        </form>
      </main>
    </div>
  );
}
