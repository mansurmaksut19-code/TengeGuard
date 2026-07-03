"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, KeyRound, Loader2, ShieldCheck } from "lucide-react";

type SetupStatus = {
  ok: boolean;
  configured: boolean;
  identityConfigured: boolean;
  gmailConfigured: boolean;
  clientId: string;
  appUrl: string;
  redirectUri: string;
  source: "environment" | "setup" | "missing";
};

async function readJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }
  return data as T;
}

function TengeGuardMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="TengeGuard" className="h-full w-full object-cover" src="/tengeguard-mark.jpg" />
  );
}

export default function GoogleSetupApp() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readJson<SetupStatus>("/api/setup/google-oauth")
      .then((nextStatus) => {
        setStatus(nextStatus);
        setClientId(nextStatus.clientId || "");
        setAppUrl(nextStatus.appUrl || window.location.origin);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить setup"));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const nextStatus = await readJson<SetupStatus>("/api/setup/google-oauth", {
        method: "POST",
        body: JSON.stringify({
          clientId,
          clientSecret,
          appUrl
        })
      });
      setStatus(nextStatus);
      setClientSecret("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить Google OAuth");
    } finally {
      setSaving(false);
    }
  }

  const redirectUri = status?.redirectUri || `${(appUrl || "http://localhost:3001").replace(/\/$/, "")}/api/subcut/gmail/callback`;
  const javascriptOrigin = (() => {
    try {
      return new URL(appUrl || "http://localhost:3001").origin;
    } catch {
      return "http://localhost:3001";
    }
  })();

  return (
    <main className="min-h-screen bg-[#060A10] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-emerald-400/30 bg-white shadow-lg shadow-emerald-500/10">
            <TengeGuardMark />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">TengeGuard Founder Setup</p>
            <h1 className="text-2xl font-black text-white">Подключение Google Sign-In и Gmail OAuth</h1>
          </div>
        </div>

        <section className="mt-6 rounded-lg border border-white/10 bg-slate-950/80 p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-1 h-5 w-5 shrink-0 text-cyan-200" />
            <div className="text-sm leading-6 text-slate-300">
              <p>
                Это внутренняя настройка продукта. Обычный пользователь ничего не вводит: он только нажимает Google,
                разрешает Gmail readonly и получает дашборд подписок.
              </p>
              <p className="mt-3 font-bold text-white">Authorized JavaScript origin для Google Sign-In:</p>
              <code className="mt-2 block overflow-x-auto rounded-md border border-emerald-400/20 bg-black/30 p-3 text-emerald-100">
                {javascriptOrigin}
              </code>
              <p className="mt-3 font-bold text-white">Authorized redirect URI для Google Cloud:</p>
              <code className="mt-2 block overflow-x-auto rounded-md border border-cyan-400/20 bg-black/30 p-3 text-cyan-100">
                {redirectUri}
              </code>
            </div>
          </div>
        </section>

        {status?.configured ? (
          <div className="mt-5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Google OAuth подключен. Пользователи могут входить через Google и давать доступ Gmail readonly.
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-100">
            {error}
          </div>
        ) : null}

        <form className="mt-5 space-y-4 rounded-lg border border-white/10 bg-slate-950/80 p-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-black text-slate-200">Google OAuth Client ID</span>
            <input
              className="mt-2 h-12 w-full rounded-md border border-slate-800 bg-black/30 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
              onChange={(event) => setClientId(event.target.value)}
              placeholder="xxxxx.apps.googleusercontent.com"
              required
              value={clientId}
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-200">Google OAuth Client Secret</span>
            <input
              className="mt-2 h-12 w-full rounded-md border border-slate-800 bg-black/30 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder="Введите secret один раз"
              required={!status?.configured}
              type="password"
              value={clientSecret}
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-200">Адрес сайта</span>
            <input
              className="mt-2 h-12 w-full rounded-md border border-slate-800 bg-black/30 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
              onChange={(event) => setAppUrl(event.target.value)}
              required
              value={appUrl}
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="inline-flex items-center gap-3 rounded-md bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/10 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Сохранить и включить Google
            </button>
            <a
              className="inline-flex items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-500/20"
              href="/dashboard"
            >
              Открыть дашборд
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
