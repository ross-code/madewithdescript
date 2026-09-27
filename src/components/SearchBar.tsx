import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative w-full md:w-72">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label="Search projects"
        placeholder="Search projects"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-full border border-border bg-card pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
