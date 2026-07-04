"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultApiConfig, readApiConfig, saveApiConfig, type StoredApiConfig } from "@/lib/client-store";

export function ApiConfigForm() {
  const [config, setConfig] = useState<StoredApiConfig>(defaultApiConfig);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setConfig(readApiConfig());
  }, []);

  function updateConfig(field: keyof StoredApiConfig, value: string) {
    setConfig((current) => ({
      ...current,
      [field]: value
    }));
    setStatus(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveApiConfig(config);
    setStatus("API config saved.");
  }

  function clearConfig() {
    const next = { ...defaultApiConfig };
    saveApiConfig(next);
    setConfig(next);
    setStatus("API config cleared.");
  }

  return (
    <form className="settings-card" onSubmit={submit}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <KeyRound size={20} aria-hidden="true" />
        <div>
          <h1 className="headline">API 配置</h1>
          <p className="muted label" style={{ margin: "6px 0 0" }}>
            OpenAI-compatible chat completions endpoint.
          </p>
        </div>
      </div>

      <label className="settings-field">
        <span>Base URL</span>
        <input
          className="underline-input"
          value={config.baseUrl}
          onChange={(event) => updateConfig("baseUrl", event.target.value)}
          placeholder="https://api.deepseek.com"
        />
      </label>

      <label className="settings-field">
        <span>Model</span>
        <input
          className="underline-input"
          value={config.model}
          onChange={(event) => updateConfig("model", event.target.value)}
          placeholder="deepseek-chat"
        />
      </label>

      <label className="settings-field">
        <span>API Key</span>
        <input
          className="underline-input"
          type="password"
          value={config.apiKey}
          onChange={(event) => updateConfig("apiKey", event.target.value)}
          placeholder="sk-..."
          autoComplete="off"
        />
      </label>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Button variant="primary">
          <Save size={16} aria-hidden="true" />
          Save
        </Button>
        <Button type="button" onClick={clearConfig}>
          <Trash2 size={16} aria-hidden="true" />
          Clear
        </Button>
        {status ? <span className="meta">{status}</span> : null}
      </div>
    </form>
  );
}
