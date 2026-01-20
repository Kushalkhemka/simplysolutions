'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types';

interface AuthState {
    user: (Profile & { email?: string }) | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: Profile & { email?: string }) => void;
    clearUser: () => void;
    fetchUser: () => Promise<void>;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: { email: string; password: string; fullName: string; referralCode?: string }) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,

            setUser: (user) => {
                set({ user, isAuthenticated: true });
            },

            clearUser: () => {
                set({ user: null, isAuthenticated: false });
            },

            fetchUser: async () => {
                set({ isLoading: true });
                try {
                    const res = await fetch('/api/auth/me');
                    const data = await res.json();

                    if (data.success && data.data?.user) {
                        set({ user: data.data.user, isAuthenticated: true });
                    } else {
                        set({ user: null, isAuthenticated: false });
                    }
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    set({ user: null, isAuthenticated: false });
                } finally {
                    set({ isLoading: false });
                }
            },

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password }),
                    });

                    const data = await res.json();

                    if (data.success) {
                        await get().fetchUser();
                        return { success: true };
                    }

                    return { success: false, error: data.error || 'Login failed' };
                } catch (error) {
                    console.error('Login error:', error);
                    return { success: false, error: 'An error occurred' };
                } finally {
                    set({ isLoading: false });
                }
            },

            register: async (data) => {
                set({ isLoading: true });
                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });

                    const result = await res.json();

                    if (result.success) {
                        return { success: true };
                    }

                    return { success: false, error: result.error || 'Registration failed' };
                } catch (error) {
                    console.error('Registration error:', error);
                    return { success: false, error: 'An error occurred' };
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    set({ user: null, isAuthenticated: false });
                    window.location.href = '/';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user, // Persist user data for faster hydration
            }),
        }
    )
);
