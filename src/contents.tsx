import React, { useEffect, useRef, useState } from "react";

// A long page with its contents in a sticky column on the left. Headings marked data-toc (h2,
// and h3 indented under them) are listed, and the one being read is highlighted. The section
// being read goes in the address as #view/section, so a link or a reload lands back on it.

type Entry = { id: string; title: string; level: number };

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[“”"'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// How far below the top of the window a heading counts as the one being read
const READING_LINE = 80;

export function WithContents({ view, children }: { view: string; children: React.ReactNode }) {
  const main = useRef<HTMLElement>(null);
  const aside = useRef<HTMLElement>(null);
  const [entries, set_entries] = useState<Entry[]>([]);
  const [current, set_current] = useState<string>();

  // Collect the headings, give each an id from its text, and go to the section in the address
  useEffect(() => {
    const headings = Array.from(main.current!.querySelectorAll<HTMLElement>("[data-toc]"));
    const seen = new Set<string>();
    set_entries(
      headings.map((h) => {
        let id = slug(h.textContent ?? "");
        while (seen.has(id)) id += "-";
        seen.add(id);
        h.id = id;
        return { id, title: h.textContent ?? "", level: h.tagName === "H3" ? 3 : 2 };
      }),
    );
    const section = decodeURIComponent(window.location.hash.split("/")[1] ?? "");
    if (section) document.getElementById(section)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, []);

  // The current section is the last heading above the reading line
  useEffect(() => {
    if (entries.length === 0) return;
    let frame = 0;
    const on_scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const above = entries.filter(
          (e) => (document.getElementById(e.id)?.getBoundingClientRect().top ?? 0) <= READING_LINE,
        );
        const id = above.at(-1)?.id;
        set_current(id);
        // Leave the address alone once it's moved to another view, or it would be sent back here
        if (window.location.hash.slice(1).split("/")[0] === view) {
          history.replaceState(null, "", `#${view}${id ? `/${id}` : ""}`);
        }
      });
    };
    on_scroll();
    window.addEventListener("scroll", on_scroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", on_scroll);
    };
  }, [entries, view]);

  // Keep the highlighted entry in view in the contents column, without moving the page
  useEffect(() => {
    const list = aside.current;
    const item = list?.querySelector<HTMLElement>(`[data-entry="${current}"]`);
    if (!list || !item) return;
    if (item.offsetTop < list.scrollTop || item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = item.offsetTop - list.clientHeight / 3;
    }
  }, [current]);

  return (
    <div className="flex max-w-7xl mx-auto">
      <aside
        ref={aside}
        className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen overflow-y-auto py-4 pl-4 pr-2 text-sm border-r border-gray-100"
      >
        <nav>
          {entries.map((e) => (
            <a
              key={e.id}
              href={`#${view}/${e.id}`}
              data-entry={e.id}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(e.id)?.scrollIntoView();
              }}
              className={`block py-0.5 pr-1 rounded leading-snug ${e.level === 3 ? "pl-4" : "pl-1"} ${
                e.id === current
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {e.title}
            </a>
          ))}
        </nav>
      </aside>
      <main ref={main} className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
