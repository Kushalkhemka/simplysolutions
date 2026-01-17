'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
    productId: string;
    productName: string;
    stockQuantity: number;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
    showIcon?: boolean;
}

export function AddToCartButton({
    productId,
    productName,
    stockQuantity,
    className,
    size = "lg",
    showIcon = true
}: AddToCartButtonProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { addItem, isLoading } = useCartStore();
    const { isAuthenticated } = useAuthStore();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (stockQuantity === 0) return;

        // Auth check
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        setIsAdding(true);
        try {
            const success = await addItem(productId);
            if (success) {
                toast.success(`Added ${productName} to cart`);
            } else {
                toast.error(`Failed to add ${productName} to cart`);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Something went wrong');
        } finally {
            setIsAdding(false);
        }
    };

    const isOutOfStock = stockQuantity === 0;

    return (
        <Button
            size={size}
            className={cn("gap-2", className)}
            onClick={handleAddToCart}
            disabled={isLoading || isAdding || isOutOfStock}
        >
            {showIcon && <ShoppingCart className="h-5 w-5" />}
            {isOutOfStock ? 'Out of Stock' : (isAdding ? 'Adding...' : 'Add to Cart')}
        </Button>
    );
}
