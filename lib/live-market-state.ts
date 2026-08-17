import type { Venue } from "./types";

type Quote = { rate?: number; markPrice?: number; bid?: number; ask?: number };
type Book = { bids: unknown[]; asks: unknown[] };

/** A venue is live only when one active symbol has both its quote and book. */
export function hasLiveVenuePair(
  symbols: readonly string[],
  quotes: Record<string, Partial<Record<Venue, Quote>>>,
  books: Record<string, Partial<Record<Venue, Book>>>,
  venue: Venue,
) {
  return symbols.some((symbol) => {
    const quote = quotes[symbol]?.[venue];
    const book = books[symbol]?.[venue];
    const quoteReady = quote?.rate !== undefined && quote.markPrice !== undefined && (venue === "Binance" || (quote.bid !== undefined && quote.ask !== undefined));
    return quoteReady && Boolean(book?.bids.length && book.asks.length);
  });
}
