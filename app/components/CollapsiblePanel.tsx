"use client";

import { useState, ReactNode } from "react";
import "./CollapsiblePanel.css";

interface CollapsiblePanelProps {
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly children: ReactNode;
}

export function CollapsiblePanel({ title, defaultOpen = false, children }: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-panel">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header"
      >
        <span>{title}</span>
        <span className={`collapsible-arrow ${isOpen ? "open" : ""}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
}
