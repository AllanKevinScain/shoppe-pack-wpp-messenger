import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const backend = join(root, "backend");
const admin = join(root, "admin");
const windows = process.platform === "win32";
const venvPython = join(backend, ".venv", windows ? "Scripts/python.exe" : "bin/python");
const vite = join(admin, "node_modules", "vite", "bin", "vite.js");
const children = [];
let stopping = false;

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} falhou${result.error ? `: ${result.error.message}` : ` (código ${result.status})`}.`);
  }
}

function systemPython() {
  const requestedPython = "C:\\Users\\meuem\\AppData\\Local\\Programs\\Python\\Python312\\python.exe";
  const pyenvRoot = process.env.USERPROFILE
    ? join(process.env.USERPROFILE, ".pyenv", "pyenv-win", "versions")
    : "";
  const bundled = process.env.USERPROFILE
    ? join(process.env.USERPROFILE, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe")
    : "";
  const candidates = [
    ...(process.env.PYTHON_BIN ? [[process.env.PYTHON_BIN, []]] : []),
    ...(windows && existsSync(requestedPython) ? [[requestedPython, []]] : []),
    ...(windows ? ["3.13", "3.12", "3.11"].map((version) => [join(pyenvRoot, version + ".0", "python.exe"), []]) : []),
    ...(windows ? [["py", ["-3"]], ["python", []]] : [["python3", []], ["python", []]]),
    ...(windows && existsSync(bundled) ? [[bundled, []]] : []),
  ];
  for (const [command, args] of candidates) {
    const result = spawnSync(command, [...args, "--version"], { stdio: "ignore" });
    if (result.status === 0) return [command, args];
  }
  throw new Error("Python 3 não encontrado. Instale Python 3 ou defina PYTHON_BIN com o caminho do executável.");
}

function prepare() {
  if (!existsSync(venvPython)) {
    const [command, args] = systemPython();
    console.log("[preparo] Criando ambiente Python em backend/.venv...");
    run(command, [...args, "-m", "venv", ".venv"], backend);
  }
  const probe = spawnSync(venvPython, ["-c", "import fastapi, uvicorn, httpx, dotenv, jwt"], { cwd: backend, stdio: "ignore" });
  if (probe.status !== 0) {
    console.log("[preparo] Instalando dependências Python...");
    run(venvPython, ["-m", "pip", "install", "-r", "requirements.txt"], backend);
  }
  if (!existsSync(vite)) {
    console.log("[preparo] Instalando dependências do painel...");
    if (windows) run("cmd.exe", ["/d", "/s", "/c", "npm ci"], admin);
    else run("npm", ["ci"], admin);
  }
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 1000).unref();
}

function start(label, command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: "inherit", env: process.env });
  children.push(child);
  child.on("error", (error) => {
    console.error(`[${label}] ${error.message}`);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`[${label}] encerrou (${signal ?? code}). Encerrando o outro serviço.`);
      stop(code || 1);
    }
  });
}

try {
  prepare();
  console.log("[backend] http://localhost:8000");
  console.log("[painel]  http://localhost:5173");
  console.log("Pressione Ctrl+C para encerrar os dois serviços.\n");
  start("backend", venvPython, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], backend);
  start("painel", process.execPath, [vite, "--host", "127.0.0.1", "--port", "5173", "--strictPort"], admin);
  process.on("SIGINT", () => stop());
  process.on("SIGTERM", () => stop());
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
