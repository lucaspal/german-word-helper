import { normalizeWord, addToHistory, getHistory, MAX_HISTORY, clearHistory } from "./history";

const storage: Record<string, string> = {};

jest.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: async (key: string) => storage[key],
    setItem: async (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: async (key: string) => {
      delete storage[key];
    },
  },
}), { virtual: true });

describe("History module", () => {
  beforeEach(async () => {
    Object.keys(storage).forEach((key) => delete storage[key]);
    await clearHistory();
    jest.clearAllMocks();
  });

  describe("normalizeWord", () => {
    it("trims and normalizes unicode", () => {
      expect(normalizeWord("  Bad  ")).toBe("Bad");
      expect(normalizeWord("bad")).toBe("bad");
    });

    it("removes punctuation", () => {
      expect(normalizeWord("Bad.")).toBe("Bad");
      expect(normalizeWord("Haus!")).toBe("Haus");
      expect(normalizeWord("Mädchen?")).toBe("Mädchen");
    });
  });

  describe("addToHistory / getHistory", () => {
    it("stores words newest-first with deduplication", async () => {
      await addToHistory("Haus");
      await addToHistory("Bad");
      await addToHistory("Haus");

      await expect(getHistory()).resolves.toEqual(["Haus", "Bad"]);
    });

    it("respects MAX_HISTORY limit", async () => {
      for (let i = 0; i < MAX_HISTORY + 5; i++) {
        await addToHistory(`word${i}`);
      }

      const history = await getHistory();
      expect(history).toHaveLength(MAX_HISTORY);
      expect(history[0]).toBe(`word${MAX_HISTORY + 4}`);
    });

    it("handles empty history", async () => {
      await expect(getHistory()).resolves.toEqual([]);
    });

    it("persists across calls through Raycast LocalStorage", async () => {
      await addToHistory("Bad");
      await addToHistory("Haus");

      await expect(getHistory()).resolves.toEqual(["Haus", "Bad"]);
    });
  });
});
