"use client";

import { motion } from "framer-motion";

interface LoadingOverlayProps {
  readonly step: string;
  readonly progress: number;
}

export function LoadingOverlay({ step, progress }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          padding: 32,
          background: "linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(168, 85, 247, 0.1))",
          border: "1px solid rgba(168, 85, 247, 0.4)",
          borderRadius: 16,
          textAlign: "center",
          width: 380,
          boxSizing: "border-box",
          boxShadow: "0 0 40px rgba(168, 85, 247, 0.3)",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#e9d5ff",
            height: 24,
            marginBottom: 20,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
            }}
          >
            {step || "Processing..."}
          </motion.div>
        </div>

        <div
          style={{
            width: "100%",
            height: 6,
            background: "rgba(168, 85, 247, 0.2)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: "10%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #a855f7, #c084fc)",
              boxShadow: "0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.4)",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
