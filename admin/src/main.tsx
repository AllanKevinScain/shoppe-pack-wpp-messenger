import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Guide } from "./pages/Guide";
import { Login } from "./pages/Login";
import { Security } from "./pages/Security";
import "./tailwind.css";

const queryClient = new QueryClient();

export function App() {
  const [token, setToken] = useState(localStorage.getItem("sp-token") ?? "");

  function login(value: string) {
    localStorage.setItem("sp-token", value);
    setToken(value);
  }

  function logout() {
    localStorage.removeItem("sp-token");
    queryClient.clear();
    setToken("");
  }

  if (!token) {
    return (
      <>
        <Toaster position="top-right" />
        <Login onLogin={login} />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 md:flex">
      <Toaster position="top-right" />
      <Sidebar onLogout={logout} />
      <Routes>
        <Route path="/" element={<Dashboard token={token} />} />
        <Route path="/seguranca" element={<Security token={token} />} />
        <Route path="/guia" element={<Guide token={token} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>,
);
