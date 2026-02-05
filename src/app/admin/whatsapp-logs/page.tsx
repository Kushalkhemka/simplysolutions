import WhatsAppLogsClient from './WhatsAppLogsClient';

export const metadata = {
    title: 'WhatsApp Message Logs | Simply Admin',
    description: 'View all WhatsApp messages sent from the system',
};

export default function WhatsAppLogsPage() {
    return <WhatsAppLogsClient />;
}
