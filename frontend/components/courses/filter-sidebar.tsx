"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type CourseLength = "short" | "medium" | "long";

export const courseLengths: { value: CourseLength; label: string; hint: string }[] = [
  { value: "short", label: "Short", hint: "Up to 5 lessons" },
  { value: "medium", label: "Medium", hint: "6–12 lessons" },
  { value: "long", label: "In-depth", hint: "13+ lessons" },
];

export function matchesLength(lessons: number, lengths: CourseLength[]) {
  if (lengths.length === 0) return true;
  return lengths.some((l) =>
    l === "short" ? lessons <= 5 : l === "medium" ? lessons >= 6 && lessons <= 12 : lessons >= 13
  );
}

export interface CourseFilters {
  query: string;
  lengths: CourseLength[];
}

interface FilterSidebarProps {
  filters: CourseFilters;
  onChange: (filters: CourseFilters) => void;
  onReset: () => void;
}

export function FilterSidebar({ filters, onChange, onReset }: FilterSidebarProps) {
  const searchId = useId();
  const active = filters.query.trim() !== "" || filters.lengths.length > 0;

  const toggleLength = (value: CourseLength) =>
    onChange({
      ...filters,
      lengths: filters.lengths.includes(value)
        ? filters.lengths.filter((l) => l !== value)
        : [...filters.lengths, value],
    });

  return (
    <aside aria-labelledby={`${searchId}-heading`} className="w-full shrink-0 lg:sticky lg:top-24 lg:w-64 lg:self-start">
      <div className="surface space-y-6 p-5">
        <div className="flex items-center justify-between">
          <h2 id={`${searchId}-heading`} className="text-sm font-semibold text-foreground">
            Filters
          </h2>
          {active ? (
            <Button type="button" variant="ghost" size="sm" onClick={onReset} className="-mr-2 h-7 text-muted-foreground">
              <X aria-hidden="true" />
              Clear
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={searchId}>Search</Label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={searchId}
              type="search"
              placeholder="Title or topic"
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-3 text-sm font-medium text-foreground">Course length</legend>
          {courseLengths.map((length) => (
            <label key={length.value} className="flex cursor-pointer items-start gap-3 rounded-md">
              <input
                type="checkbox"
                checked={filters.lengths.includes(length.value)}
                onChange={() => toggleLength(length.value)}
                className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-input accent-primary"
              />
              <span className="text-sm leading-5">
                <span className="block font-medium text-foreground">{length.label}</span>
                <span className="block text-muted-foreground">{length.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </aside>
  );
}
