import { describe, expect, it } from "vitest";
import { getVerdict, getVerdictFreshness, getVerdictTimestamp, VERDICT_CONTEXT, VERDICT_SNAPSHOT_AT, VERDICT_SYMBOLS } from "../lib/verdict-data";

describe("static verdict fixture", () => {
  it("uses the declared fixture timestamp for every share card", () => {
    for (const symbol of VERDICT_SYMBOLS) {
      const verdict = getVerdict(symbol);
      expect(verdict).toBeDefined();
      expect(getVerdictTimestamp(verdict!).toISOString()).toBe(VERDICT_SNAPSHOT_AT);
      expect(getVerdictFreshness(verdict!)).toBe("fixed fixture snapshot");
    }
  });

  it("states that the share-card inputs are a demo fixture", () => {
    expect(VERDICT_CONTEXT).toMatch(/fixed demo fixture snapshot/i);
    expect(getVerdict("NOTREAL")).toBeUndefined();
  });
});
