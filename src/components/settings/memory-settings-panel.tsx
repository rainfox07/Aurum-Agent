"use client";

import React from "react";
import { useState } from "react";
import { Brain, ChevronsUpDown } from "lucide-react";

type SelectSetting = {
  id: "baseTone" | "warmth" | "enthusiasm" | "headers" | "emoji";
  label: string;
  value: string;
  options: string[];
};

const initialSettings: SelectSetting[] = [
  {
    id: "baseTone",
    label: "基础风格和语气",
    value: "专业",
    options: ["专业", "自然", "直接", "温和"]
  },
  {
    id: "warmth",
    label: "亲和度",
    value: "默认",
    options: ["更少", "默认", "更多"]
  },
  {
    id: "enthusiasm",
    label: "热情程度",
    value: "默认",
    options: ["更少", "默认", "更多"]
  },
  {
    id: "headers",
    label: "标题和列表",
    value: "更少",
    options: ["更少", "默认", "更多"]
  },
  {
    id: "emoji",
    label: "表情符号",
    value: "更少",
    options: ["不用", "更少", "默认"]
  }
];

export function MemorySettingsPanel() {
  const [settings, setSettings] = useState(initialSettings);
  const [fastAnswers, setFastAnswers] = useState(true);
  const [customInstruction, setCustomInstruction] = useState("");
  const baseTone = settings[0];
  const preferenceSettings = settings.slice(1);

  function updateSetting(id: SelectSetting["id"], value: string) {
    setSettings((current) => current.map((setting) => (setting.id === id ? { ...setting, value } : setting)));
  }

  return (
    <section className="memory-settings-panel" aria-label="Memory settings">
      <div className="settings-card memory-hero">
        <div className="memory-hero-title">
          <Brain size={22} aria-hidden="true" />
          <div>
            <h1 className="headline">记忆系统</h1>
            <p className="muted label" style={{ margin: "6px 0 0" }}>
              前端演示：这些偏好暂时只影响界面状态，不会保存或参与模型回答。
            </p>
          </div>
        </div>
      </div>

      <div className="memory-settings-group">
        <MemorySelectRow setting={baseTone} onChange={updateSetting} />
      </div>

      <div className="memory-settings-group">
        {preferenceSettings.map((setting) => (
          <MemorySelectRow key={setting.id} setting={setting} onChange={updateSetting} />
        ))}
      </div>

      <div className="memory-settings-group">
        <label className="memory-setting-row">
          <span>快速回答</span>
          <span className="memory-toggle">
            <input type="checkbox" checked={fastAnswers} onChange={(event) => setFastAnswers(event.target.checked)} />
            <span aria-hidden="true" />
          </span>
        </label>
      </div>

      <p className="memory-help-text">
        Aurum 有时可以使用通用知识给出更快、更深入的回答。这些回答暂时不会使用你的记忆，也不会写入记忆。
      </p>

      <div className="memory-custom-section">
        <h2>自定义指令</h2>
        <textarea
          value={customInstruction}
          onChange={(event) => setCustomInstruction(event.target.value)}
          placeholder="写下你希望 Aurum 在回答时考虑的其他偏好。"
          rows={4}
        />
      </div>
    </section>
  );
}

function MemorySelectRow({
  setting,
  onChange
}: {
  setting: SelectSetting;
  onChange: (id: SelectSetting["id"], value: string) => void;
}) {
  return (
    <label className="memory-setting-row">
      <span>{setting.label}</span>
      <span className="memory-select-wrap">
        <select value={setting.value} onChange={(event) => onChange(setting.id, event.target.value)}>
          {setting.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronsUpDown size={18} aria-hidden="true" />
      </span>
    </label>
  );
}
