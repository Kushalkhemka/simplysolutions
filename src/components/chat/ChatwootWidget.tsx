'use client';

import Script from 'next/script';

export function ChatwootWidget() {
    return (
        <Script
            id="chatwoot-script"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
                __html: `
                    (function(d,t) {
                        var BASE_URL="https://chatwoot-chatwoot.6m9c4g.easypanel.host";
                        var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
                        g.src=BASE_URL+"/packs/js/sdk.js";
                        g.async = true;
                        s.parentNode.insertBefore(g,s);
                        g.onload=function(){
                            window.chatwootSDK.run({
                                websiteToken: 'FbYpmLfRfnJeWmimQZNeHFHN',
                                baseUrl: BASE_URL
                            })
                        }
                    })(document,"script");
                `,
            }}
        />
    );
}
