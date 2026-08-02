import { ClipboardListIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { findActiveNavItem, isNavItemActive } from "./active";
import { MAIN_NAV, SECONDARY_NAV } from "./nav-items";

describe("isNavItemActive", () => {
  it("should match when the path is the destination itself", () => {
    expect(isNavItemActive("/routines", "/routines")).toBe(true);
  });

  it("should match a child page so that a detail keeps its section lit", () => {
    expect(isNavItemActive("/exercises/abc-123", "/exercises")).toBe(true);
    expect(isNavItemActive("/routines/42/edit", "/routines")).toBe(true);
    expect(isNavItemActive("/settings/preferences", "/settings")).toBe(true);
  });

  /**
   * Le piège du `startsWith` nu : sans le slash de séparation, ces trois
   * chemins allumeraient une section à laquelle ils n'appartiennent pas.
   */
  it.each([
    ["/routines-archive", "/routines"],
    ["/workoutsomething", "/workouts"],
    ["/dashboards", "/dashboard"],
  ])("should not match %s against %s", (pathname, href) => {
    expect(isNavItemActive(pathname, href)).toBe(false);
  });

  it("should not match a sibling section", () => {
    expect(isNavItemActive("/exercises", "/routines")).toBe(false);
  });
});

describe("findActiveNavItem", () => {
  it("should find the section a path belongs to", () => {
    expect(findActiveNavItem("/workouts", MAIN_NAV)?.label).toBe("Historique");
    expect(findActiveNavItem("/exercises/abc-123", MAIN_NAV)?.label).toBe("Exercices");
    expect(findActiveNavItem("/settings/account", SECONDARY_NAV)?.label).toBe("Réglages");
  });

  it("should return undefined when no destination covers the path", () => {
    expect(findActiveNavItem("/", MAIN_NAV)).toBeUndefined();
    expect(findActiveNavItem("/login", MAIN_NAV)).toBeUndefined();
  });

  /**
   * Deux entrées peuvent correspondre si l'une est imbriquée dans l'autre.
   * C'est la plus précise qui décrit l'écran, donc la dernière de la liste.
   */
  it("should prefer the most specific destination when two prefixes match", () => {
    const items = [
      { href: "/routines", label: "Routines", icon: ClipboardListIcon },
      { href: "/routines/new", label: "Nouvelle routine", icon: ClipboardListIcon },
    ];

    expect(findActiveNavItem("/routines/new", items)?.label).toBe("Nouvelle routine");
    expect(findActiveNavItem("/routines", items)?.label).toBe("Routines");
  });
});
