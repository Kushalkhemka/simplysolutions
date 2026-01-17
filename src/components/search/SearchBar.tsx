'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.length >= 2) {
            setIsLoading(true);
            debounceRef.current = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
                    const data = await res.json();
                    if (data.success) {
                        setSuggestions(data.data || []);
                        setIsOpen(true);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsLoading(false);
                }
            }, 300);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsOpen(false);
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search products..."
                        className="pl-10 pr-10 bg-white text-foreground"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setSuggestions([]); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
                    {isLoading && (
                        <div className="p-4 text-center">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </div>
                    )}

                    {!isLoading && suggestions.length > 0 && (
                        <ul>
                            {suggestions.map((product) => (
                                <li key={product.id}>
                                    <Link
                                        href={`/products/${product.slug}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 p-3 hover:bg-muted"
                                    >
                                        {product.main_image_url && (
                                            <img
                                                src={product.main_image_url}
                                                alt=""
                                                className="w-10 h-10 object-contain bg-white rounded"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                ₹{product.price?.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                            <li className="border-t">
                                <button
                                    onClick={handleSubmit}
                                    className="w-full p-3 text-sm text-primary hover:bg-muted text-left"
                                >
                                    See all results for "{query}"
                                </button>
                            </li>
                        </ul>
                    )}

                    {!isLoading && query.length >= 2 && suggestions.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No products found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
