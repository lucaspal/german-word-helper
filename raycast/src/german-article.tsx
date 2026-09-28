import { List, Action, ActionPanel, showToast, Toast, Clipboard } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import React, { useState, useEffect } from "react";
import { lookupWord, type DictionaryEntry } from "./lib/dictionary";
import { getHistory, addToHistory, MAX_HISTORY } from "./lib/history";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data, error, isLoading } = usePromise(lookupWord, [searchText], {
    execute: searchText.length > 0,
  });

  useEffect(() => {
    if (data) {
      addToHistory(data.word);
      setHistory(getHistory());
    }
  }, [data]);

  // Load history on mount and when showHistory changes
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    if (showHistory) {
      setHistory(getHistory());
    }
  }, [showHistory]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text.length === 0) {
      setShowHistory(true);
    } else {
      setShowHistory(false);
    }
  };


  const handleClipboardLookup = async () => {
    try {
      const text = await Clipboard.readText();
      const cleaned = text?.normalize("NFC").trim().replace(/[„“”‚‘’.,!?;:()[\]{}"«»]/g, "") ?? "";
      if (cleaned) {
        setSearchText(cleaned);
        setShowHistory(false);
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Clipboard empty",
          message: "Clipboard is empty or contains no valid word",
        });
      }
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

  const renderResult = (entry: DictionaryEntry) => (
    <>
      <List.Item
        title={`${entry.article ?? ""} ${entry.word}`.trim()}
        subtitle={`Substantiv · ${entry.gender ?? "Noun"}${entry.translations.length > 0 ? ` — EN: ${entry.translations.slice(0, 3).join(", ")}${entry.translations.length > 3 ? " …" : ""}` : ""}`}
        icon={entry.article === "der" ? "📗" : entry.article === "die" ? "📕" : "📘"}
        actions={
          entry.wiktionaryUrl
            ? (
                <ActionPanel>
                  <Action.OpenInBrowser url={entry.wiktionaryUrl} title="Open in Wiktionary" />
                </ActionPanel>
              )
            : undefined
        }
      />
      <List.Section title="DECLENSION">
        {entry.declension.map((row, i) => (
          <List.Item key={i} title={`${row.caseName} ${row.number}`} subtitle={row.form} icon="arrow.right" />
        ))}
      </List.Section>
    </>
  );

  const renderHistory = () => {
    if (history.length === 0) {
      return (
        <List.Item title="No recent words" subtitle="Search for a word to add it here" icon="clock.arrow.circlepath" />
      );
    }

    return history.map((word, i) => (
      <List.Item
        key={i}
        title={word}
        subtitle="Recent lookup"
        icon="clock"
        actions={
          <ActionPanel>
            <Action title="Look Up Word" onAction={() => handleHistorySelect(word)} />
          </ActionPanel>
        }
      />
    ));
  };

  return (
    <List onSearchTextChange={handleSearchChange} searchBarPlaceholder="Search German word (or press ⌘V for clipboard)">
      {showHistory && searchText.length === 0 ? (
        <>
          <List.Section title={`RECENT (${history.length}/${MAX_HISTORY})`}>{renderHistory()}</List.Section>
          <ActionPanel>
            <Action title="Use Clipboard" icon="doc.on.clipboard" shortcut="⌘V" onAction={handleClipboardLookup} />
          </ActionPanel>
        </>
      ) : isLoading ? (
        <List.Item title="Looking up…" subtitle="Fetching from Wiktionary" icon="clock" />
      ) : error ? (
        <List.Item title="Error" subtitle={error instanceof Error ? error.message : "Unknown error"} icon="exclamationmark.triangle" />
      ) : data ? (
        renderResult(data)
      ) : (
        <>
          <List.Item title="Enter a German word" subtitle="Try: Bad, Haus, Mädchen, Apfel" icon="magnifyingglass" />
          <ActionPanel>
            <Action title="Use Clipboard" icon="doc.on.clipboard" shortcut="⌘V" onAction={handleClipboardLookup} />
          </ActionPanel>
        </>
      )}
    </List>
  );
}