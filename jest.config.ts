import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  maxWorkers: 1,
  setupFiles: ["<rootDir>/jest.setup.env.ts"],
  testEnvironment: "jsdom",
  coverageProvider: "v8",
  transformIgnorePatterns: [
    "/node_modules/(?!(@faker-js/faker)/)",
  ],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

export default createJestConfig(config);
