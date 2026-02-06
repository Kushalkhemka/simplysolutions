import { Metadata } from 'next';
import ListingAlertsClient from './ListingAlertsClient';

export const metadata: Metadata = {
    title: 'Listing Keyword Monitor | Admin',
    description: 'Monitor Amazon product listings for flagged keywords'
};

export default function ListingAlertsPage() {
    return <ListingAlertsClient />;
}
