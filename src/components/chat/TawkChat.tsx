'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface TawkChatProps {
    propertyId?: string;
    widgetId?: string;
}

declare global {
    interface Window {
        Tawk_API?: any;
        Tawk_LoadStart?: Date;
    }
}

export function TawkChat({
    propertyId = '696bd4b677faec197a81961e',
    widgetId = '1jf6jdqdt'
}: TawkChatProps) {
    useEffect(() => {
        // Initialize Tawk_API
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        // Custom styling and behavior
        window.Tawk_API.onLoad = function () {
            // You can customize the widget here
            // window.Tawk_API.setAttributes({
            //     'name': userName,
            //     'email': userEmail,
            // });
        };
    }, []);

    // Don't render if no property ID is configured
    if (!propertyId || propertyId === 'YOUR_TAWK_PROPERTY_ID') {
        return null;
    }

    return (
        <Script
            id="tawk-script"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
                __html: `
                    var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                    (function(){
                        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                        s1.async=true;
                        s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
                        s1.charset='UTF-8';
                        s1.setAttribute('crossorigin','*');
                        s0.parentNode.insertBefore(s1,s0);
                    })();
                `,
            }}
        />
    );
}

// Alternative: Custom AI Chat Component (if you want to use Gemini)
interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function AIChat() {
    // This is a placeholder for a custom AI chat implementation
    // You would integrate with Gemini API here
    return null;
}
