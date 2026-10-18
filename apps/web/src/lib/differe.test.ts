import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { creerDifferes } from "./differe";

describe("creerDifferes (D302)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("exécute à l'échéance, une seule fois", async () => {
    const f = creerDifferes(5000);
    const executer = vi.fn(async () => {});
    f.programmer("r1", executer);
    await vi.advanceTimersByTimeAsync(4999);
    expect(executer).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(executer).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(executer).toHaveBeenCalledOnce();
  });

  it("annuler empêche l'exécution et dit si quelque chose attendait", async () => {
    const f = creerDifferes(5000);
    const executer = vi.fn(async () => {});
    f.programmer("r1", executer);
    expect(f.annuler("r1")).toBe(true);
    expect(f.annuler("r1")).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(executer).not.toHaveBeenCalled();
  });

  it("vider exécute tout de suite ce qui attend, et plus rien ensuite", async () => {
    const f = creerDifferes(5000);
    const a = vi.fn(async () => {});
    const b = vi.fn(async () => {});
    f.programmer("a", a);
    f.programmer("b", b);
    f.vider();
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(5000);
    expect(a).toHaveBeenCalledOnce();
  });

  it("reprogrammer la même clé remplace l'attente", async () => {
    const f = creerDifferes(5000);
    const premier = vi.fn(async () => {});
    const second = vi.fn(async () => {});
    f.programmer("r1", premier);
    f.programmer("r1", second);
    await vi.advanceTimersByTimeAsync(5000);
    expect(premier).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
