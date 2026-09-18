/** "auto" follows the clock, so the boundaries need pinning down. */
import { describe, expect, it } from "vitest";
import {
  resolveTheme,
  NIGHT_STARTS_HOUR,
  NIGHT_ENDS_HOUR,
} from "../apps/web/src/shared/utils/theme";

const at = (hour: number) => new Date(2026, 8, 19, hour, 30);

describe("resolveTheme", () => {
  it("honours an explicit choice at any hour", () => {
    expect(resolveTheme("light", at(23))).toBe("light");
    expect(resolveTheme("dark", at(9))).toBe("dark");
  });

  it("is light through the day", () => {
    for (const hour of [6, 9, 12, 15, 17]) {
      expect(resolveTheme("auto", at(hour)), `${hour}時`).toBe("light");
    }
  });

  it("is dark in the evening and overnight", () => {
    for (const hour of [18, 21, 0, 3, 5]) {
      expect(resolveTheme("auto", at(hour)), `${hour}時`).toBe("dark");
    }
  });

  it("switches exactly on the boundaries", () => {
    expect(resolveTheme("auto", new Date(2026, 8, 19, NIGHT_ENDS_HOUR, 0))).toBe(
      "light",
    );
    expect(
      resolveTheme("auto", new Date(2026, 8, 19, NIGHT_ENDS_HOUR - 1, 59)),
    ).toBe("dark");
    expect(
      resolveTheme("auto", new Date(2026, 8, 19, NIGHT_STARTS_HOUR, 0)),
    ).toBe("dark");
    expect(
      resolveTheme("auto", new Date(2026, 8, 19, NIGHT_STARTS_HOUR - 1, 59)),
    ).toBe("light");
  });
});
