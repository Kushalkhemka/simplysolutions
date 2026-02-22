'use client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface AdminHeaderProps {
    userEmail: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
    return (
        <header className="h-14 sm:h-16 border-b bg-card flex items-center justify-between px-4 sm:px-6">
            <div className="lg:hidden" />
            <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                <ThemeToggle />
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline truncate max-w-[200px]">{userEmail}</span>
            </div>
        </header>
    );
}
