import "@testing-library/jest-dom";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://konsey_user:konsey_pass@localhost:5433/onkoloji_konsey_test";
}

process.env.NODE_ENV = "test";

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
