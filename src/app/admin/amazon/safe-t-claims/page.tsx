import { Metadata } from 'next';
import SafeTClaimsClient from './SafeTClaimsClient';

export const metadata: Metadata = {
    title: 'Safe-T Claims | Admin',
    description: 'Track and file Amazon Safe-T claims for refunded orders'
};

export default function SafeTClaimsPage() {
    return <SafeTClaimsClient />;
}
