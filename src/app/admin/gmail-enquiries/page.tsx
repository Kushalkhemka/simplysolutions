import { Suspense } from 'react';
import GmailEnquiriesClient from './GmailEnquiriesClient';

export const dynamic = 'force-dynamic';

export default function GmailEnquiriesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
            <GmailEnquiriesClient />
        </Suspense>
    );
}
