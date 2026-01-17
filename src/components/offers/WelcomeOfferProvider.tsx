'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WelcomeOfferModal } from './WelcomeOfferModal';

interface UserOffer {
    id: string;
    offer_type: 'flash_deal' | 'price_slash' | 'bogo' | 'welcome_back';
    product_id: string | null;
    discount_value: number | null;
    original_price: number | null;
    offer_price: number | null;
    expires_at: string;
    product?: {
        name: string;
        slug: string;
        main_image_url: string | null;
    };
}

interface OfferContextType {
    offers: UserOffer[];
    flashDeal: UserOffer | null;
    priceSlash: UserOffer | null;
    bogo: UserOffer | null;
    refreshOffers: () => Promise<void>;
}

const OfferContext = createContext<OfferContextType>({
    offers: [],
    flashDeal: null,
    priceSlash: null,
    bogo: null,
    refreshOffers: async () => { },
});

export const useOffers = () => useContext(OfferContext);

export function WelcomeOfferProvider({ children }: { children: ReactNode }) {
    const [showModal, setShowModal] = useState(false);
    const [offers, setOffers] = useState<UserOffer[]>([]);
    const [flashDeal, setFlashDeal] = useState<UserOffer | null>(null);
    const [priceSlash, setPriceSlash] = useState<UserOffer | null>(null);
    const [bogo, setBogo] = useState<UserOffer | null>(null);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const refreshOffers = async () => {
        try {
            const res = await fetch('/api/offers');
            const data = await res.json();

            if (data.success) {
                setOffers(data.data.offers || []);
                setFlashDeal(data.data.flashDeal);
                setPriceSlash(data.data.priceSlash);
                setBogo(data.data.bogo);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        }
    };

    // Check for welcome offers on mount
    useEffect(() => {
        const checkWelcomeOffers = async () => {
            // Check if we already showed the modal in this session
            const modalShown = sessionStorage.getItem('welcomeOfferModalShown');
            if (modalShown || hasChecked) return;

            setHasChecked(true);

            try {
                // Trigger offer creation/check
                const res = await fetch('/api/offers', { method: 'POST' });
                const data = await res.json();

                if (data.success && data.data.hasOffers) {
                    setFlashDeal(data.data.flashDeal);
                    setPriceSlash(data.data.priceSlash);
                    setBogo(data.data.bogo);
                    setIsFirstLogin(data.data.isFirstLogin);

                    // Show modal
                    setShowModal(true);
                    sessionStorage.setItem('welcomeOfferModalShown', 'true');

                    // Also refresh offers list
                    await refreshOffers();
                }
            } catch (error) {
                console.error('Error checking welcome offers:', error);
            }
        };

        // Delay a bit to let auth settle
        const timer = setTimeout(checkWelcomeOffers, 1500);
        return () => clearTimeout(timer);
    }, [hasChecked]);

    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
        <OfferContext.Provider value={{ offers, flashDeal, priceSlash, bogo, refreshOffers }}>
            {children}
            <WelcomeOfferModal
                isOpen={showModal}
                onClose={handleCloseModal}
                offers={{ flashDeal, priceSlash, bogo }}
                isFirstLogin={isFirstLogin}
            />
        </OfferContext.Provider>
    );
}
