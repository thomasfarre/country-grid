import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "coverage"
    }
  }
});
