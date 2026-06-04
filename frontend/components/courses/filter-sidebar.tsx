"use client";

import { useState } from "react";

interface FilterOptions {
  categories: string[];
  levels: string[];
  priceRange: [number, number];
}

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterOptions) => void;
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    categories: ["Design & Visuals"],
    levels: [],
    priceRange: [0, 500],
  });

  const handleCategoryChange = (category: string) => {
    const updated = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    const newFilters = { ...filters, categories: updated };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleLevelChange = (level: string) => {
    const updated = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];

    const newFilters = { ...filters, levels: updated };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handlePriceChange = (value: number) => {
    const newFilters = { ...filters, priceRange: [0, value] as [number, number] };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const categories = ["Design & Visuals", "Development", "Business Strategy", "Marketing"];
  const levels = ["All Levels", "Beginner", "Advanced"];

  return (
    <aside className="w-full flex-shrink-0 lg:w-72">
      <section className="rounded-lg border bg-card p-5">
        <h3 className="mb-6 flex items-center gap-2 text-sm font-semibold text-foreground">
          Filters
        </h3>
        <div className="space-y-8">
          <div>
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Category
            </span>
            <div className="space-y-3">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="size-4 rounded border-input bg-background accent-primary"
                  />
                  <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Level
            </span>
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    filters.levels.includes(level)
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Price Range
            </span>
            <input
              type="range"
              min="0"
              max="500"
              value={filters.priceRange[1]}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
            <div className="mt-2 flex justify-between text-sm font-medium text-muted-foreground">
              <span>$0</span>
              <span>${filters.priceRange[1]}+</span>
            </div>
          </div>
        </div>
      </section>

    </aside>
  );
}

