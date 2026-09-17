import { describe, it, expect, beforeEach } from "vitest";
import { useAdminThemeStore } from "../src/store/useAdminThemeStore";

describe("useAdminThemeStore", () => {
  beforeEach(() => {
    useAdminThemeStore.setState({ theme: "dark" });
  });

  it("inicia con modo oscuro por defecto", () => {
    const state = useAdminThemeStore.getState();
    expect(state.theme).toBe("dark");
  });

  it("permite alternar entre modo oscuro y claro", () => {
    const { toggleTheme } = useAdminThemeStore.getState();
    
    toggleTheme();
    expect(useAdminThemeStore.getState().theme).toBe("light");

    toggleTheme();
    expect(useAdminThemeStore.getState().theme).toBe("dark");
  });

  it("permite establecer un tema explícito", () => {
    const { setTheme } = useAdminThemeStore.getState();

    setTheme("light");
    expect(useAdminThemeStore.getState().theme).toBe("light");

    setTheme("dark");
    expect(useAdminThemeStore.getState().theme).toBe("dark");
  });
});
