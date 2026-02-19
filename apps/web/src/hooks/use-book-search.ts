import { lookupBook, searchBooks } from '@/api';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useBookSearch(query: string, debounceMs = 500) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const trimmed = debouncedQuery.trim();

  return {
    ...useQuery({
      queryKey: ['bookSearch', trimmed],
      queryFn: () => searchBooks(trimmed),
      enabled: trimmed.length >= 2,
      staleTime: 1000 * 60 * 5,
      placeholderData: previousData => previousData,
    }),
    isDebouncing: query.trim() !== debouncedQuery.trim() && query.trim().length >= 2,
  };
}

export function useBookLookup(isbn13: string | null) {
  return useQuery({
    queryKey: ['bookLookup', isbn13],
    queryFn: () => lookupBook(isbn13!),
    enabled: !!isbn13,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });
}
