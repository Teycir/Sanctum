import { beforeAll, afterAll } from "vitest";

// Global test setup
beforeAll(async () => {
  console.log("🧪 Starting integration tests...");
  console.log(
    "⏳ Initializing IPFS connections (this may take 30-60 seconds)...",
  );
});

afterAll(async () => {
  console.log("✅ Integration tests complete");
});
