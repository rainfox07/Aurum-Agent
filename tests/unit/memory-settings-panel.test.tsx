// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemorySettingsPanel } from "@/components/settings/memory-settings-panel";

describe("MemorySettingsPanel", () => {
  it("renders Chinese memory controls as a frontend-only settings panel", () => {
    render(<MemorySettingsPanel />);

    expect(screen.getByRole("heading", { name: "记忆系统" })).toBeTruthy();
    expect(screen.getByText("基础风格和语气")).toBeTruthy();
    expect(screen.getByText("快速回答")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "自定义指令" })).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("专业"), { target: { value: "自然" } });
    expect(screen.getByDisplayValue("自然")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("写下你希望 Aurum 在回答时考虑的其他偏好。"), {
      target: { value: "回答更短一点。" }
    });
    expect(screen.getByDisplayValue("回答更短一点。")).toBeTruthy();
  });
});
