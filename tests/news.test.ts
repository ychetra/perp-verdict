import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseRssItems, sanitizeNewsItem } from "../lib/news";

describe("news feed boundaries", () => {
  it("extracts only bounded RSS metadata and decodes entities", () => {
    const items = parseRssItems("<rss><item><title><![CDATA[Funding &amp; depth]]></title><link>https://example.com/story</link><pubDate>Mon, 17 Aug 2026 06:00:00 GMT</pubDate><description>ignored body</description></item></rss>");
    expect(items[0]).toEqual({ title: "Funding & depth", url: "https://example.com/story", publishedAt: "Mon, 17 Aug 2026 06:00:00 GMT" });
    expect("description" in items[0]).toBe(false);
  });

  it("rejects unsafe URLs, missing dates, and bounds titles", () => {
    expect(sanitizeNewsItem({ title: "x", url: "javascript:alert(1)", publishedAt: "Mon, 17 Aug 2026 06:00:00 GMT" }, "Test", "crypto", "example.com")).toBeNull();
    expect(sanitizeNewsItem({ title: "x", url: "https://evil.example/story", publishedAt: "Mon, 17 Aug 2026 06:00:00 GMT" }, "Test", "crypto", "www.coindesk.com")).toBeNull();
    expect(sanitizeNewsItem({ title: "x", url: "https://example.com", publishedAt: "not a date" }, "Test", "crypto", "example.com")).toBeNull();
    const item = sanitizeNewsItem({ title: "x".repeat(400), url: "https://example.com", publishedAt: "Mon, 17 Aug 2026 06:00:00 GMT" }, "Test", "ai", "example.com");
    expect(item?.title).toHaveLength(180);
  });
});
