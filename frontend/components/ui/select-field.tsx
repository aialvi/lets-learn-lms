"use client"

import * as React from "react"
import { AlertCircle, CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectChevronClass,
  selectItemClass,
  selectTriggerClass,
} from "@/components/ui/select"

export interface SelectOption {
  /** An empty string is allowed and means "no selection" (e.g. "All"). */
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface SelectFieldProps {
  options: SelectOption[]
  /** Visible label. Without one, pass aria-label or wire an external <label htmlFor={id}>. */
  label?: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Submits the value with the surrounding form, and resets with it. */
  name?: string
  required?: boolean
  requiredMessage?: string
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  /** Adds a search box. Defaults to on for lists longer than eight options. */
  searchable?: boolean
  size?: "sm" | "default"
  id?: string
  className?: string
  triggerClassName?: string
  ref?: React.Ref<HTMLButtonElement>
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
}

const SEARCH_THRESHOLD = 8
// Radix Select reserves "" for "show the placeholder", so empty options use a stand-in.
const EMPTY = "__empty__"

/**
 * The app's dropdown: a styled listbox for short lists and a searchable
 * combobox for long ones, with form submission, reset, and required support.
 */
export function SelectField({
  options,
  label,
  value: controlled,
  defaultValue = "",
  onValueChange,
  name,
  required,
  requiredMessage = "Choose an option.",
  placeholder = "Select an option",
  emptyMessage = "Nothing to choose from yet",
  disabled,
  searchable,
  size = "default",
  id,
  className,
  triggerClassName,
  ref,
  onBlur,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalid,
}: SelectFieldProps) {
  const autoId = React.useId()
  const triggerId = id ?? autoId
  const errorId = `${triggerId}-required`
  const [internal, setInternal] = React.useState(defaultValue)
  const [missing, setMissing] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const value = controlled ?? internal

  const change = (next: string) => {
    setInternal(next)
    setMissing(false)
    onValueChange?.(next)
  }

  // React state doesn't follow a native form reset, so mirror it.
  React.useEffect(() => {
    const form = inputRef.current?.form
    if (!form) return
    const onReset = () => {
      setInternal(defaultValue)
      setMissing(false)
    }
    form.addEventListener("reset", onReset)
    return () => form.removeEventListener("reset", onReset)
  }, [defaultValue])

  // Keep an unknown stored value visible instead of showing a blank control.
  const items =
    value && !options.some((option) => option.value === value) ? [...options, { value, label: value }] : options
  const search = searchable ?? items.length > SEARCH_THRESHOLD

  const triggerProps = {
    ref,
    id: triggerId,
    onBlur,
    disabled,
    "aria-label": ariaLabel,
    "aria-required": required || undefined,
    "aria-invalid": missing ? true : ariaInvalid,
    "aria-describedby": [describedBy, missing ? errorId : ""].filter(Boolean).join(" ") || undefined,
  }
  const shared = { items, value, change, placeholder, emptyMessage, size, triggerProps, triggerClassName }

  return (
    <div className={cn("relative min-w-0", className)}>
      {label ? (
        <label htmlFor={triggerId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      {search ? <SearchableSelect {...shared} /> : <PlainSelect {...shared} />}
      {name ? (
        <input
          ref={inputRef}
          // Not type="hidden": hidden inputs are skipped by required validation.
          className="pointer-events-none absolute bottom-0 left-0 h-px w-full opacity-0"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          name={name}
          value={value}
          required={required}
          disabled={disabled}
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault()
            setMissing(true)
            const first = event.currentTarget.form?.querySelector("input:invalid, textarea:invalid")
            if (first === event.currentTarget) document.getElementById(triggerId)?.focus()
          }}
        />
      ) : null}
      {missing ? (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
          {requiredMessage}
        </p>
      ) : null}
    </div>
  )
}

interface VariantProps {
  items: SelectOption[]
  value: string
  change: (value: string) => void
  placeholder: string
  emptyMessage: string
  size: "sm" | "default"
  triggerProps: React.ComponentProps<"button">
  triggerClassName?: string
}

function PlainSelect({
  items,
  value,
  change,
  placeholder,
  emptyMessage,
  size,
  triggerProps,
  triggerClassName,
}: VariantProps) {
  const hasEmpty = items.some((option) => option.value === "")
  return (
    <Select
      value={value === "" && hasEmpty ? EMPTY : value}
      // Radix emits "" when its options change underneath it; only user choices count.
      onValueChange={(next) => next && change(next === EMPTY ? "" : next)}
    >
      <SelectTrigger {...(triggerProps as React.ComponentProps<typeof SelectTrigger>)} size={size} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.length === 0 ? (
          <p className="px-2.5 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          items.map((option) => (
            <SelectItem
              key={option.value || EMPTY}
              value={option.value || EMPTY}
              disabled={option.disabled}
              description={option.description}
            >
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

function SearchableSelect({
  items,
  value,
  change,
  placeholder,
  emptyMessage,
  size,
  triggerProps,
  triggerClassName,
}: VariantProps) {
  const listId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selected = items.find((option) => option.value === value)
  const needle = query.trim().toLowerCase()
  const matches = needle
    ? items.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(needle))
    : items
  const optionId = (index: number) => `${listId}-${index}`

  const scrollTo = (index: number) =>
    requestAnimationFrame(() => listRef.current?.children[index]?.scrollIntoView({ block: "nearest" }))

  const move = (index: number) => {
    setActive(index)
    scrollTo(index)
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setQuery("")
      move(Math.max(0, items.findIndex((option) => option.value === value)))
    }
  }

  const choose = (option?: SelectOption) => {
    if (!option || option.disabled) return
    change(option.value)
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    const last = matches.length - 1
    if (event.key === "Enter") {
      event.preventDefault()
      choose(matches[active])
    } else if (event.key === "Tab") {
      event.preventDefault()
      setOpen(false)
    } else if (last >= 0 && event.key === "ArrowDown") {
      event.preventDefault()
      move(active >= last ? 0 : active + 1)
    } else if (last >= 0 && event.key === "ArrowUp") {
      event.preventDefault()
      move(active <= 0 ? last : active - 1)
    }
  }

  return (
    // Modal so the list scrolls and takes focus correctly inside dialogs.
    <Popover open={open} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        <button
          {...triggerProps}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          data-slot="select-trigger"
          data-size={size}
          data-placeholder={selected ? undefined : ""}
          className={cn(selectTriggerClass, triggerClassName)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault()
              onOpenChange(true)
            }
          }}
        >
          <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
          <ChevronDownIcon aria-hidden="true" className={selectChevronClass} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Choose an option"
        className="w-(--radix-popover-trigger-width) min-w-56 max-w-[calc(100vw-1rem)] overflow-hidden"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <input
            role="combobox"
            aria-label="Search options"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={matches.length ? optionId(active) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              move(0)
            }}
            onKeyDown={onKeyDown}
            className="h-10 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none md:text-sm"
          />
        </div>
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Options"
          className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3rem))] overflow-y-auto overscroll-contain p-1"
        >
          {matches.map((option, index) => (
            <div
              key={option.value || EMPTY}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option)}
              className={cn(
                selectItemClass,
                index === active && "bg-accent text-accent-foreground",
                option.value === value && "font-medium",
                option.disabled && "pointer-events-none opacity-50"
              )}
            >
              <span className="min-w-0">
                <span className="block break-words">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{option.description}</span>
                ) : null}
              </span>
              {option.value === value ? (
                <CheckIcon aria-hidden="true" className="absolute right-2.5 size-4 text-primary" />
              ) : null}
            </div>
          ))}
        </div>
        <p role="status" className={matches.length ? "sr-only" : "px-3 pt-2 pb-5 text-center text-sm text-muted-foreground"}>
          {matches.length
            ? `${matches.length} ${matches.length === 1 ? "option" : "options"}`
            : needle
              ? `No matches for “${query.trim()}”`
              : emptyMessage}
        </p>
      </PopoverContent>
    </Popover>
  )
}
