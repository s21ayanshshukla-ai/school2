import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { BookCard } from "@/components/library/BookCard";
import { LiteratureModal } from "@/components/library/LiteratureModal";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { searchBooks, type Book } from "@/lib/openlibrary";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marginalia — Open Library Search & AI Literature Companion" },
      {
        name: "description",
        content:
          "Search millions of books from Open Library and get AI-written themes, character analysis, chapter guides and discussion questions.",
      },
      { property: "og:title", content: "Marginalia — AI Literature Companion" },
      {
        property: "og:description",
        content:
          "Find any book and open an instant study companion: themes, characters, chapter summaries and discussion questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUGGESTIONS = [
  "Pride and Prejudice",
  "One Hundred Years of Solitude",
  "Beloved",
  "The Great Gatsby",
  "Things Fall Apart",
  "Frankenstein",
];

function Index() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Book | null>(null);
  const debounced = useDebouncedValue(query.trim(), 350);
  const active = debounced.length >= 2;

  const results = useQuery({
    queryKey: ["openlibrary-search", debounced],
    queryFn: ({ signal }) => searchBooks(debounced, signal),
    enabled: active,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  const books = active ? (results.data ?? []) : [];
  const searching = active && results.isFetching;

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-6 pt-10 sm:pt-14">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-semibold tracking-tight text-foreground">
            Marginalia<span className="text-primary">.</span>
          </p>
          <p className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">
            Powered by Open Library
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-16 text-center sm:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            A reading room with a well-read companion
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-7xl">
            Find a book. <em className="text-primary">Understand</em> it deeply.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Search any title, then open it for themes, characters, a chapter guide and questions
            worth arguing over.
          </p>

          <div className="mx-auto mt-10 max-w-2xl">
            <label htmlFor="book-search" className="sr-only">
              Search books by title, author or subject
            </label>
            <div className="group relative flex items-center rounded-full border border-input bg-card shadow-book transition-shadow focus-within:border-primary focus-within:shadow-book-lift">
              <Search className="pointer-events-none absolute left-5 h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
              <input
                id="book-search"
                type="search"
                autoComplete="off"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try “Middlemarch” or “Toni Morrison”…"
                className="h-14 w-full rounded-full bg-transparent pl-14 pr-14 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              <div className="absolute right-4 flex items-center">
                {searching ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            {!active && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm text-secondary-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-16" aria-live="polite">
          {active && (
            <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-3">
              <h2 className="font-display text-2xl text-foreground">
                {results.isError
                  ? "Search unavailable"
                  : results.isPending
                    ? "Searching the stacks…"
                    : `${books.length} ${books.length === 1 ? "result" : "results"} for “${debounced}”`}
              </h2>
              {books.length > 0 && (
                <p className="hidden text-sm text-muted-foreground sm:block">
                  Select a book to open its companion
                </p>
              )}
            </div>
          )}

          {results.isError && active && (
            <p className="text-center text-muted-foreground">
              Open Library didn't respond. Check your connection and try again.
            </p>
          )}

          {active && results.isPending && <ResultsSkeleton />}

          {active && !results.isPending && !results.isError && books.length === 0 && (
            <p className="py-10 text-center font-display text-lg italic text-muted-foreground">
              No books found. Try another title or author.
            </p>
          )}

          {books.length > 0 && (
            <div
              className={`grid grid-cols-2 gap-x-6 gap-y-10 transition-opacity sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${
                results.isPlaceholderData ? "opacity-60" : ""
              }`}
            >
              {books.map((book, i) => (
                <BookCard key={book.key} book={book} index={i} onSelect={setSelected} />
              ))}
            </div>
          )}
        </section>
      </main>

      <LiteratureModal book={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] rounded-md skeleton-shimmer" />
          <div className="mt-3 h-4 w-4/5 rounded skeleton-shimmer" />
          <div className="mt-2 h-3 w-3/5 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
