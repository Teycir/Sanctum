import { beforeAll, afterAll } from "vitest";
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

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
