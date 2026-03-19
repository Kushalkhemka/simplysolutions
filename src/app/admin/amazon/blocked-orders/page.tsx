import { Metadata } from 'next';
import BlockedOrdersClient from './BlockedOrdersClient';

export const metadata: Metadata = {
    title: 'Blocked Orders | Admin',
    description: 'View and manage blocked Amazon orders'
};

export default function BlockedOrdersPage() {
    return <BlockedOrdersClient />;
}
