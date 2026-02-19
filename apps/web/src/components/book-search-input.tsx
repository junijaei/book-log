import { useBookSearch } from '@/hooks';
import { messages } from '@/constants/messages';
import { cn } from '@/lib/utils';
import type { AladinBook } from '@/types';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';

interface BookSearchInputProps {
  onSelect: (book: AladinBook) => void;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
}

export function BookSearchInput({
  onSelect,
  autoFocus = false,
  className,
  placeholder = messages.books.placeholders.bookSearch,
}: BookSearchInputProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: books, isFetching, isDebouncing, isError } = useBookSearch(query);

  const hasResults = !!(books && books.length > 0);
  const showDropdown =
    open && query.trim().length >= 2 && (hasResults || isFetching || isDebouncing || isError);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(book: AladinBook) {
    onSelect(book);
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  const isLoading = isFetching || isDebouncing;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          autoComplete="off"
          aria-label={messages.books.search.title}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={messages.common.buttons.cancel}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden"
        >
          {(isFetching || isDebouncing) && !hasResults && (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{messages.common.states.loading}</span>
            </div>
          )}

          {isError && !isLoading && (
            <div className="p-4 text-sm text-destructive text-center">
              {messages.books.errors.searchFailed}
            </div>
          )}

          {!isLoading && !isError && hasResults && (
            <ul className="max-h-72 overflow-y-auto divide-y divide-border">
              {books!.map((book, idx) => (
                <li key={book.isbn13 || idx}>
                  <button
                    type="button"
                    role="option"
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors focus:bg-accent outline-none"
                    onClick={() => handleSelect(book)}
                  >
                    <div className="shrink-0 w-10 h-14 rounded overflow-hidden bg-muted">
                      {book.cover ? (
                        <img
                          src={book.cover}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          {messages.books.details.noCover}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{book.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{book.author}</p>
                      <p className="text-xs text-muted-foreground truncate">{book.publisher}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && !isError && !hasResults && query.trim().length >= 2 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {messages.books.errors.searchNoResults}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
