"use client";

import { useState, type ReactNode } from "react";

interface TooltipProps {
  readonly content: string;
  readonly children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label={content}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
        }}
      >
        {children}
      </button>
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 12px",
            background: "rgba(168, 85, 247, 0.95)",
            border: "1px solid rgba(168, 85, 247, 0.5)",
            borderRadius: 6,
            color: "#fff",
            fontSize: 11,
            whiteSpace: "nowrap",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(168, 85, 247, 0.3)",
          }}
        >
          {content}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid rgba(168, 85, 247, 0.95)",
            }}
          />
        </div>
      )}
    </div>
  );
}
