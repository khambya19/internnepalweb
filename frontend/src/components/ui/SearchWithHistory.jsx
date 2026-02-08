import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, History } from 'lucide-react';

const MAX_HISTORY = 5;

const getStorageKey = (historyKey) => `search-history:${historyKey}`;

const readHistory = (historyKey) => {
  try {
    const raw = localStorage.getItem(getStorageKey(historyKey));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeHistory = (historyKey, values) => {
  try {
    localStorage.setItem(getStorageKey(historyKey), JSON.stringify(values.slice(0, MAX_HISTORY)));
  } catch {
    // ignore storage errors
  }
};

export const SearchWithHistory = ({
  historyKey,
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
}) => {
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHistory(readHistory(historyKey));
  }, [historyKey]);

  const commitSearch = (raw) => {
    const term = String(raw || '').trim();
    if (!term) return;
    const next = [term, ...history.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, MAX_HISTORY);
    setHistory(next);
    writeHistory(historyKey, next);
  };

  const filteredHistory = useMemo(() => {
    const q = String(value || '').trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => item.toLowerCase().includes(q));
  }, [history, value]);

  const clearSearch = () => {
    onChange('');
    setOpen(false);
  };

  const clearHistory = () => {
    setHistory([]);
    writeHistory(historyKey, []);
  };

  const showDropdown = open && filteredHistory.length > 0;

  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          commitSearch(value);
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitSearch(value);
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white ${inputClassName}`}
      />
      {!!String(value || '').trim() && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-200"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent Searches</p>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredHistory.map((item) => (
              <button
                key={item}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(item);
                  commitSearch(item);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                <History size={14} className="text-gray-400" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchWithHistory;
