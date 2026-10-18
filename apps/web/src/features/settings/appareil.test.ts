import { describe, expect, it } from "vitest";
import { appareilDe } from "./appareil";

describe("appareilDe", () => {
  it("lit le navigateur et le système", () => {
    expect(appareilDe("Mozilla/5.0 (Windows NT 10.0) Chrome/140 Safari/537").label).toBe(
      "Chrome sur Windows",
    );
    expect(appareilDe("Mozilla/5.0 (Macintosh) Firefox/141").label).toBe("Firefox sur macOS");
    expect(appareilDe("Mozilla/5.0 (Windows NT 10.0) Chrome/140 Edg/140").label).toBe(
      "Edge sur Windows",
    );
  });

  it("reconnaît l'application mobile", () => {
    expect(appareilDe("better-lift/0.4 Expo Android")).toEqual({
      label: "Application mobile (Android)",
      mobile: true,
    });
    expect(appareilDe("okhttp/4.12.0").mobile).toBe(true);
  });

  it("se contente de « Navigateur » sans agent", () => {
    expect(appareilDe(null).label).toBe("Navigateur");
  });
});
