import { normalizeWord, addToHistory, getHistory, MAX_HISTORY, clearHistory } from "./history";

// Mock localStorage for Node.js test environment
const mockStorage: Record<string, string> = {};

Object.defineProperty(global, "localStorage", {
  value: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    },
  },
  writable: true,
});

describe("History module", () => {
  beforeEach(() => {
    clearHistory();
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
    it("stores words newest-first with deduplication", () => {
      addToHistory("Haus");
      addToHistory("Bad");
      addToHistory("Haus"); // duplicate moves to front

      const history = getHistory();
      expect(history).toEqual(["Haus", "Bad"]); // newest first, Haus moved to front
    });

    it("respects MAX_HISTORY limit", () => {
      for (let i = 0; i < MAX_HISTORY + 5; i++) {
        addToHistory(`word${i}`);
      }

      const history = getHistory();
      expect(history.length).toBe(MAX_HISTORY);
      // Should keep newest
      expect(history[0]).toBe(`word${MAX_HISTORY + 4}`);
    });

    it("handles empty history", () => {
      expect(getHistory()).toEqual([]);
    });

    it("persists across calls via localStorage", () => {
      addToHistory("Bad");
      addToHistory("Haus");

      // Simulate fresh load
      const history = getHistory();
      expect(history).toEqual(["Haus", "Bad"]);
    });
  });
});