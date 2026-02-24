// Gmail API utility library

const DEFAULT_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const DEFAULT_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const DEFAULT_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';
const DEFAULT_USER_EMAIL = process.env.GMAIL_USER_EMAIL || 'codekeys.amazon@gmail.com';

export interface GmailCredentials {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    email: string;
}

function getDefaultCredentials(): GmailCredentials {
    return {
        clientId: DEFAULT_CLIENT_ID,
        clientSecret: DEFAULT_CLIENT_SECRET,
        refreshToken: DEFAULT_REFRESH_TOKEN,
        email: DEFAULT_USER_EMAIL,
    };
}

// ─── Token Management ───────────────────────────────────────────────

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getGmailAccessToken(creds?: GmailCredentials): Promise<string> {
    const credentials = creds || getDefaultCredentials();
    const cacheKey = credentials.email;
    const cached = tokenCache.get(cacheKey);

    // Return cached token if still valid (with 60s buffer)
    if (cached && Date.now() < cached.expiresAt - 60000) {
        return cached.token;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            refresh_token: credentials.refreshToken,
            grant_type: 'refresh_token',
        }),
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(`Gmail token error for ${credentials.email}: ${data.error_description || data.error}`);
    }

    tokenCache.set(cacheKey, {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    });

    return data.access_token;
}

// ─── Email Body Helpers ─────────────────────────────────────────────

function decodeBase64Url(str: string): string {
    if (!str) return '';
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
}

function encodeBase64Url(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

interface GmailPayload {
    body?: { data?: string };
    parts?: GmailPayload[];
    mimeType?: string;
}

export function getEmailBody(payload: GmailPayload): string {
    if (payload.body?.data) {
        return decodeBase64Url(payload.body.data);
    }
    if (payload.parts) {
        // Prefer text/plain
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return decodeBase64Url(part.body.data);
            }
        }
        // Fallback to text/html stripped
        for (const part of payload.parts) {
            if (part.mimeType === 'text/html' && part.body?.data) {
                return decodeBase64Url(part.body.data)
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
        }
        // Recurse into nested parts
        for (const part of payload.parts) {
            if (part.parts) {
                const result = getEmailBody(part);
                if (result) return result;
            }
        }
    }
    return '';
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
    return headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

// ─── Types ──────────────────────────────────────────────────────────

export interface GmailEnquiry {
    id: string;
    threadId: string;
    messageId: string; // RFC Message-ID header
    from: string;
    to: string;
    subject: string;
    date: string;
    snippet: string;
    body: string;
    labels: string[];
    customerName: string;
    orderId: string;
    product: string;
    returnRequested: string;
    reason: string;
    category: 'delivery' | 'refund' | 'product_claim' | 'tech_support' | 'other';
}

export interface GmailThreadMessage {
    id: string;
    threadId: string;
    messageId: string;
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
    isSent: boolean; // true if sent by us
}

// ─── Categorization ─────────────────────────────────────────────────

function categorizeEnquiry(reason: string, subject: string): GmailEnquiry['category'] {
    const text = `${reason} ${subject}`.toLowerCase();

    if (/deliver|package|ship|dispatch|track|when.*get|eta/i.test(text)) {
        return 'delivery';
    }
    if (/refund|cancel|return|money back/i.test(text)) {
        return 'refund';
    }
    if (/fake|pirat|counterfeit|non.?genuine|not genuine|fraud|scam|illegal|suspicious/i.test(text)) {
        return 'product_claim';
    }
    if (/not work|error|block|activat|install|key.*issue|broken|fail/i.test(text)) {
        return 'tech_support';
    }
    return 'other';
}

function extractIssueDetails(body: string) {
    const orderMatch = body.match(/Order number:\s*([\w-]+)/i) || body.match(/Order ID:\s*([\w-]+)/i);
    const productMatch = body.match(/Product:\s*([\w\d]+)/i);
    const returnMatch = body.match(/Return requested:\s*(Yes|No)/i);

    // Extract reason - look between "Reason for contact:" and "Please respond"
    let reason = '';
    const reasonMatch = body.match(/Reason for contact:\s*([\s\S]*?)(?:\n\nPlease respond|Please respond|----------)/i);
    if (reasonMatch) {
        reason = reasonMatch[1].trim();
    }

    // Extract customer name from message header
    const messageMatch = body.match(/Message:.*?-----\s*([\s\S]*?)(?:-----|\n\nPlease)/i);

    return {
        orderId: orderMatch ? orderMatch[1] : '',
        product: productMatch ? productMatch[1] : '',
        returnRequested: returnMatch ? returnMatch[1] : '',
        reason: reason || (messageMatch ? messageMatch[1].trim().substring(0, 500) : ''),
    };
}

// ─── Fetch Order Enquiries ──────────────────────────────────────────

export async function fetchOrderEnquiries(creds?: GmailCredentials): Promise<GmailEnquiry[]> {
    const accessToken = await getGmailAccessToken(creds);
    let allMessages: Array<{ id: string; threadId: string }> = [];
    let pageToken: string | null = null;

    const query = 'subject:"Order enquiry" OR subject:"order delivery" OR subject:"Order inquiry"';

    do {
        const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
        url.searchParams.set('q', query);
        url.searchParams.set('maxResults', '50');
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();

        if (data.messages) {
            allMessages = allMessages.concat(data.messages);
        }
        pageToken = data.nextPageToken || null;
    } while (pageToken);

    // Fetch details for each message
    const enquiries: GmailEnquiry[] = [];

    for (const msg of allMessages) {
        try {
            const msgRes = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const msgData = await msgRes.json();
            if (msgData.error) continue;

            const msgHeaders = msgData.payload?.headers || [];
            const from = getHeader(msgHeaders, 'From');
            const to = getHeader(msgHeaders, 'To');
            const subject = getHeader(msgHeaders, 'Subject');
            const date = getHeader(msgHeaders, 'Date');
            const messageId = getHeader(msgHeaders, 'Message-ID') || getHeader(msgHeaders, 'Message-Id');
            const body = getEmailBody(msgData.payload);
            const details = extractIssueDetails(body);

            // Extract customer name from subject
            const nameMatch = subject.match(/from Amazon customer (.+)$/i);
            const customerName = nameMatch ? nameMatch[1] : from.split('<')[0].trim();

            enquiries.push({
                id: msg.id,
                threadId: msg.threadId,
                messageId,
                from,
                to,
                subject,
                date,
                snippet: msgData.snippet || '',
                body,
                labels: msgData.labelIds || [],
                customerName,
                orderId: details.orderId,
                product: details.product,
                returnRequested: details.returnRequested,
                reason: details.reason,
                category: categorizeEnquiry(details.reason, subject),
            });
        } catch (err) {
            console.error(`Error fetching message ${msg.id}:`, err);
        }
    }

    return enquiries;
}

// ─── Fetch Thread Messages ──────────────────────────────────────────

export async function fetchThreadMessages(threadId: string, creds?: GmailCredentials): Promise<GmailThreadMessage[]> {
    const accessToken = await getGmailAccessToken(creds);
    const userEmail = creds?.email || DEFAULT_USER_EMAIL;

    const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const thread = await res.json();

    if (thread.error) {
        throw new Error(thread.error.message);
    }

    return (thread.messages || []).map((msg: any) => {
        const msgHeaders = msg.payload?.headers || [];
        const from = getHeader(msgHeaders, 'From');
        const isSent = msg.labelIds?.includes('SENT') || from.toLowerCase().includes(userEmail.toLowerCase());

        return {
            id: msg.id,
            threadId: msg.threadId,
            messageId: getHeader(msgHeaders, 'Message-ID') || getHeader(msgHeaders, 'Message-Id'),
            from,
            to: getHeader(msgHeaders, 'To'),
            subject: getHeader(msgHeaders, 'Subject'),
            date: getHeader(msgHeaders, 'Date'),
            body: getEmailBody(msg.payload),
            isSent,
        };
    });
}

// ─── Send Reply ─────────────────────────────────────────────────────

interface SendReplyParams {
    threadId: string;
    inReplyTo: string;
    to: string;
    subject: string;
    body: string;
    creds?: GmailCredentials;
}

export async function sendGmailReply({ threadId, inReplyTo, to, subject, body, creds }: SendReplyParams) {
    const accessToken = await getGmailAccessToken(creds);
    const userEmail = creds?.email || DEFAULT_USER_EMAIL;

    // Build RFC 2822 email
    const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    const emailLines = [
        `From: ${userEmail}`,
        `To: ${to}`,
        `Subject: ${replySubject}`,
        `In-Reply-To: ${inReplyTo}`,
        `References: ${inReplyTo}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        '',
        body,
    ];

    const rawEmail = encodeBase64Url(emailLines.join('\r\n'));

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            raw: rawEmail,
            threadId,
        }),
    });

    const result = await res.json();

    if (result.error) {
        throw new Error(result.error.message);
    }

    return result;
}

// ─── Mark Messages as Read ──────────────────────────────────────────

export async function markMessagesAsRead(messageIds: string[], creds?: GmailCredentials): Promise<number> {
    const accessToken = await getGmailAccessToken(creds);
    let successCount = 0;

    for (const messageId of messageIds) {
        try {
            const res = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        removeLabelIds: ['UNREAD'],
                    }),
                }
            );
            const result = await res.json();
            if (!result.error) successCount++;
        } catch {
            // Continue with next message
        }
    }

    return successCount;
}
