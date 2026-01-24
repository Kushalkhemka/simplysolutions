import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WelcomeOfferProvider } from '@/components/offers/WelcomeOfferProvider';
import { ChatwootWidget } from '@/components/chat/ChatwootWidget';
import { PushPermission } from '@/components/notifications/PushPermission';

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <WelcomeOfferProvider>
                    {children}
                </WelcomeOfferProvider>
            </main>
            <Footer />
            <ChatwootWidget />
            <PushPermission />
        </div>
    );
}

