"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronsUpDown, Check } from "lucide-react";

function getTimezoneOffset(tz: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch {
    return "";
  }
}

function parseOffsetMinutes(offset: string): number {
  if (offset === "GMT") return 0;
  const match = offset.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] || "0", 10);
  return sign * (hours * 60 + minutes);
}

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const timezones = useMemo(() => {
    const tzNames = Intl.supportedValuesOf("timeZone");
    return tzNames
      .map((tz) => {
        const offset = getTimezoneOffset(tz);
        return {
          value: tz,
          label: tz.replace(/_/g, " "),
          offset,
          offsetMinutes: parseOffsetMinutes(offset),
        };
      })
      .sort((a, b) => {
        if (a.offsetMinutes !== b.offsetMinutes)
          return a.offsetMinutes - b.offsetMinutes;
        return a.label.localeCompare(b.label);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return timezones;
    const s = search.toLowerCase();
    return timezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(s) ||
        tz.value.toLowerCase().includes(s) ||
        tz.offset.toLowerCase().includes(s)
    );
  }, [search, timezones]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSearch("");
    }
  }, [open]);

  const selectedTz = timezones.find((tz) => tz.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="truncate text-left">
          {selectedTz
            ? `(${selectedTz.offset}) ${selectedTz.label}`
            : value || "Select timezone"}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezones..."
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No timezone found
              </p>
            ) : (
              filtered.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => {
                    onChange(tz.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                    tz.value === value ? "bg-accent" : ""
                  }`}
                >
                  {tz.value === value ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="text-muted-foreground shrink-0">
                    {tz.offset}
                  </span>
                  <span className="truncate">{tz.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
