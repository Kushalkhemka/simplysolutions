'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItemWithProduct } from '@/types';

interface CartState {
    items: CartItemWithProduct[];
    itemCount: number;
    subtotal: number;
    mrpTotal: number;
    discount: number;
    isLoading: boolean;
    isOpen: boolean;

    // Actions
    setItems: (items: CartItemWithProduct[]) => void;
    addItem: (productId: string, quantity?: number) => Promise<boolean>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    fetchCart: () => Promise<void>;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            itemCount: 0,
            subtotal: 0,
            mrpTotal: 0,
            discount: 0,
            isLoading: false,
            isOpen: false,

            setItems: (items) => {
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
                const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
                const mrpTotal = items.reduce((sum, item) => sum + (item.product?.mrp || 0) * item.quantity, 0);

                set({
                    items,
                    itemCount,
                    subtotal,
                    mrpTotal,
                    discount: mrpTotal - subtotal,
                });
            },

            fetchCart: async () => {
                set({ isLoading: true });
                try {
                    const res = await fetch('/api/cart');
                    const data = await res.json();

                    if (data.success) {
                        get().setItems(data.data.items || []);
                    }
                } catch (error) {
                    console.error('Failed to fetch cart:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            addItem: async (productId, quantity = 1) => {
                set({ isLoading: true });
                try {
                    const res = await fetch('/api/cart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId, quantity }),
                    });

                    if (res.ok) {
                        await get().fetchCart();
                        get().openCart();
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Failed to add to cart:', error);
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },

            updateQuantity: async (itemId, quantity) => {
                try {
                    const res = await fetch(`/api/cart/${itemId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantity }),
                    });

                    if (res.ok) {
                        await get().fetchCart();
                    }
                } catch (error) {
                    console.error('Failed to update cart:', error);
                }
            },

            removeItem: async (itemId) => {
                try {
                    const res = await fetch(`/api/cart/${itemId}`, {
                        method: 'DELETE',
                    });

                    if (res.ok) {
                        await get().fetchCart();
                    }
                } catch (error) {
                    console.error('Failed to remove from cart:', error);
                }
            },

            clearCart: async () => {
                try {
                    const res = await fetch('/api/cart', {
                        method: 'DELETE',
                    });

                    if (res.ok) {
                        set({
                            items: [],
                            itemCount: 0,
                            subtotal: 0,
                            mrpTotal: 0,
                            discount: 0,
                        });
                    }
                } catch (error) {
                    console.error('Failed to clear cart:', error);
                }
            },

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
        }),
        {
            name: 'cart-storage',
            partialize: (state) => ({ itemCount: state.itemCount }),
        }
    )
);
