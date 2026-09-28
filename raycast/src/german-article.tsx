import { Action, ActionPanel, Clipboard, List, Toast, showToast } from "@raycast/api";
import React, { useEffect, useState } from "react";
import { DictionaryEntry, lookupWord } from "./lib/dictionary";
import { MAX_HISTORY, addToHistory, getHistory } from "./lib/history";

const LOOKUP_DEBOUNCE_MS = 450;

type LookupState = {
  data?: DictionaryEntry;
  error?: Error;
  isLoading: boolean;
};

function useDictionaryLookup(word: string): LookupState {
  const [state, setState] = useState<LookupState>({ isLoading: false });

  useEffect(() => {
    const cleaned = word.trim();
    if (!cleaned) {
      setState({ isLoading: false });
      return;
    }

    const controller = new AbortController();
    setState({ isLoading: true });

    const timeout = setTimeout(() => {
      lookupWord(cleaned, controller.signal)
        .then((data) => setState({ data, isLoading: false }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setState({ error: error instanceof Error ? error : new Error("Lookup failed"), isLoading: false });
        });
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [word]);

  return state;
}

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const { data, error, isLoading } = useDictionaryLookup(searchText);

  useEffect(() => {
    if (!data) return;
    void addToHistory(data.word).then(() => getHistory().then(setHistory));
  }, [data]);

  useEffect(() => {
    if (!showHistory) return;
    void getHistory().then(setHistory);
  }, [showHistory]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowHistory(text.length === 0);
  };

  const handleClipboardLookup = async () => {
    try {
      const text = await Clipboard.readText();
      const cleaned = text?.normalize("NFC").trim().replace(/[„“”‚‘’.,!?;:()[\]{}"«»]/g, "") ?? "";
      if (!cleaned) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Clipboard empty",
          message: "Clipboard is empty or contains no valid word",
        });
        return;
      }
      setSearchText(cleaned);
      setShowHistory(false);
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Clipboard error",
        message: "Failed to read clipboard",
      });
    }
  };

  const handleHistorySelect = (word: string) => {
    setSearchText(word);
    setShowHistory(false);
  };

  const clipboardActions = (
    <ActionPanel>
      <Action title="Use Clipboard" icon="doc.on.clipboard" shortcut={{ modifiers: ["cmd"], key: "v" }} onAction={handleClipboardLookup} />
    </ActionPanel>
  );

  const renderResult = (entry: DictionaryEntry) => (
    <>
      <List.Item
        title={`${entry.article ?? ""} ${entry.word}`.trim()}
        subtitle={`Substantiv · ${entry.gender ?? "Noun"}${entry.translations.length > 0 ? ` — EN: ${entry.translations.slice(0, 3).join(", ")}${entry.translations.length > 3 ? " …" : ""}` : ""}`}
        icon={entry.article === "der" ? "📗" : entry.article === "die" ? "📕" : "📘"}
        actions={
          <ActionPanel>
            {entry.wiktionaryUrl ? <Action.OpenInBrowser url={entry.wiktionaryUrl} title="Open in Wiktionary" /> : null}
          </ActionPanel>
        }
      />
      <List.Section title="DECLENSION">
        {entry.declension.map((row, index) => (
          <List.Item key={index} title={`${row.caseName} ${row.number}`} subtitle={row.form} icon="arrow.right" />
        ))}
      </List.Section>
    </>
  );

  const renderHistory = () => {
    if (history.length === 0) {
      return <List.Item title="No recent words" subtitle="Search for a word to add it here" icon="clock.arrow.circlepath" actions={clipboardActions} />;
    }

    return history.map((word, index) => (
      <List.Item
        key={index}
        title={word}
        subtitle="Recent lookup"
        icon="clock"
        actions={
          <ActionPanel>
            <Action title="Look Up Word" onAction={() => handleHistorySelect(word)} />
            <Action title="Use Clipboard" icon="doc.on.clipboard" shortcut={{ modifiers: ["cmd"], key: "v" }} onAction={handleClipboardLookup} />
          </ActionPanel>
        }
      />
    ));
  };

  return (
    <List onSearchTextChange={handleSearchChange} searchBarPlaceholder="Search German word (or press ⌘V for clipboard)">
      {showHistory && searchText.length === 0 ? (
        <List.Section title={`RECENT (${history.length}/${MAX_HISTORY})`}>{renderHistory()}</List.Section>
      ) : isLoading ? (
        <List.Item title="Looking up…" subtitle="Fetching from Wiktionary" icon="clock" />
      ) : error ? (
        <List.Item title="Error" subtitle={error.message} icon="exclamationmark.triangle" actions={clipboardActions} />
      ) : data ? (
        renderResult(data)
      ) : (
        <List.Item title="Enter a German word" subtitle="Try: Bad, Haus, Mädchen, Apfel" icon="magnifyingglass" actions={clipboardActions} />
      )}
    </List>
  );
}
