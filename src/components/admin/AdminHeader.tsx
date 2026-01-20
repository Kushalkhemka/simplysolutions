'use client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface AdminHeaderProps {
    userEmail: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <div className="lg:hidden">
                <h1 className="text-lg font-bold">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4 ml-auto">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground">{userEmail}</span>
            </div>
        </header>
    );
}
