'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReferralRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/referrals');
    }, [router]);

    return (
        <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Redirecting...</p>
        </div>
    );
}
