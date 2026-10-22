import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CATEGORIES } from "@/core/categories";
import { cx } from "@/core/cx";
import { FEATURES } from "@/core/registry";
import { matches } from "@/core/search";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeId: string | undefined;
  onSelect: (id: string) => void;
}

export function Sidebar({ activeId, onSelect }: SidebarProps) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim() !== "";

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => {
    const visible = searching ? FEATURES.filter((f) => matches(f.searchText, deferredQuery)) : FEATURES;
    return CATEGORIES.map((category) => ({
      category,
      items: visible.filter((f) => f.category === category.id),
    })).filter((group) => group.items.length > 0);
  }, [deferredQuery, searching]);

  const firstMatch = groups[0]?.items[0];

  const toggle = (categoryId: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(categoryId)) next.add(categoryId);
      return next;
    });

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && firstMatch) {
      onSelect(firstMatch.id);
    } else if (event.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <nav className={styles.sidebar} aria-label="Funcionalidades">
      <input
        ref={inputRef}
        type="search"
        className={styles.search}
        placeholder="Buscar… (Ctrl+K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onSearchKey}
      />
      <div className={styles.list}>
        {groups.length === 0 && <p className={styles.empty}>Sin resultados</p>}
        {groups.map(({ category, items }) => {
          const open = searching || !collapsed.has(category.id);
          return (
            <section key={category.id}>
              <button
                type="button"
                className={styles.groupHeader}
                aria-expanded={open}
                onClick={() => toggle(category.id)}
              >
                <span aria-hidden="true">{open ? "▾" : "▸"}</span>
                {category.label}
                <span className={styles.count}>{items.length}</span>
              </button>
              {open && (
                <ul className={styles.items}>
                  {items.map((feature) => (
                    <li key={feature.id}>
                      <button
                        type="button"
                        className={cx(styles.item, feature.id === activeId && styles.active)}
                        aria-current={feature.id === activeId ? "page" : undefined}
                        title={feature.description}
                        onClick={() => onSelect(feature.id)}
                      >
                        {feature.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </nav>
  );
}
