import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global de next/navigation para pruebas unitarias
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "",
  useParams: () => ({}),
  redirect: vi.fn(),
}));
