import { supabase, isSupabaseConfigured } from '../utils/supabase';

const VISITOR_ID_KEY = 'dd_visitor_id';
const SESSION_ID_KEY = 'dd_session_id';

export const LEAD_EVENT_TYPES = {
  LISTING_VIEW: 'listing_view',
  CONTACT_EMAIL_CLICK: 'contact_email_click',
  CONTACT_PHONE_CLICK: 'contact_phone_click',
  CONTACT_WEBSITE_CLICK: 'contact_website_click',
  CONTACT_BOOKING_CLICK: 'contact_booking_click',
  REPORT_SUBMITTED: 'report_submitted',
};

const generateId = (prefix) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const getOrCreateVisitorId = () => {
  if (typeof window === 'undefined') return null;

  let visitorId = window.localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = generateId('v');
    window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
};

const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return null;

  let sessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateId('s');
    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
};

export const getLeadIdentifiers = () => ({
  visitorId: getOrCreateVisitorId(),
  sessionId: getOrCreateSessionId(),
});

const getAuthToken = async () => {
  if (!isSupabaseConfigured) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
};

export const getUtmContext = () => {
  if (typeof window === 'undefined') {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
};

export async function trackLeadEvent({
  listingId,
  eventType,
  cityPage = null,
  metadata = {},
}) {
  if (!listingId || !eventType) return { success: false };

  try {
    const token = await getAuthToken();
    const { visitorId, sessionId } = getLeadIdentifiers();
    const payload = {
      listingId,
      eventType,
      visitorId,
      sessionId,
      cityPage,
      pagePath: typeof window !== 'undefined' ? window.location.pathname : null,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      ...getUtmContext(),
      metadata,
    };

    await fetch('/api/leads/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
