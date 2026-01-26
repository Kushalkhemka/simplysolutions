'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface SortSelectProps {
    currentSort: string;
}

export function SortSelect({ currentSort }: SortSelectProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSortChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sortBy', value);
        params.set('page', '1'); // Reset to page 1 when sorting changes
        router.push(`/products?${params.toString()}`);
    };

    return (
        <Select defaultValue={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="bestseller">Bestselling</SelectItem>
            </SelectContent>
        </Select>
    );
}
