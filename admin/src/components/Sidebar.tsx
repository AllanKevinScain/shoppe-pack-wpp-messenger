import { LogOut, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { NavLink } from "react-router";

const links = [
  { to: "/", label: "Configurações", icon: Settings2 },
  { to: "/seguranca", label: "Segurança", icon: ShieldCheck },
  { to: "/guia", label: "Guia", icon: Sparkles },
] as const;

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  function navigation(mobile: boolean) {
    return links.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        end
        className={({ isActive }) =>
          (mobile
            ? "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs "
            : "flex items-center gap-3 rounded-[9px] px-3.25 py-3 text-sm ") +
          (isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white")
        }
      >
        <Icon className="h-4 w-4" /> {label}
      </NavLink>
    ));
  }

  return (
    <>
      <aside className="hidden w-61.5 shrink-0 flex-col gap-12.5 bg-slate-900 px-4.5 py-7.5 text-slate-300 md:flex">
        <span className="flex items-center gap-2.25 text-[15px] font-extrabold text-white">
          <span className="grid h-7.75 w-7.75 place-items-center rounded-[9px] bg-sky-400 text-[11px] text-sky-950">
            SP
          </span>
          Pack Messenger
        </span>
        <nav className="grid gap-1.75" aria-label="Navegação principal">
          {navigation(false)}
        </nav>
        <button
          type="button"
          className="mt-auto flex cursor-pointer items-center gap-2.5 p-2.5 text-slate-400 hover:text-white"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <header className="bg-slate-900 p-4 text-slate-300 md:hidden">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-extrabold text-white">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-400 text-[11px] text-sky-950">SP</span>
            Pack Messenger
          </span>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 text-sm text-slate-300"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
        <nav className="mt-4 grid grid-cols-3 gap-1" aria-label="Navegação principal">
          {navigation(true)}
        </nav>
      </header>
    </>
  );
}
