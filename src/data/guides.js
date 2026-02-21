/**
 * Top-of-funnel guide content.
 * Each guide targets a high-volume, low-competition search that clients
 * make before they're ready to book. They link internally to city pages,
 * service pages, and individual listings.
 *
 * Add new guides here — the dynamic route /guide/[slug].js picks them up.
 */

export const GUIDES = [
  {
    slug: 'what-is-financial-domination',
    title: 'What Is Financial Domination (Findom)?',
    metaTitle: 'What Is Financial Domination (Findom)? | DommeDirectory',
    metaDescription:
      'Financial domination explained: what it is, how it works, and how to find a legitimate findom. Complete guide for newcomers.',
    h1: 'What Is Financial Domination (Findom)?',
    intro:
      'Financial domination — findom — is a power-exchange dynamic where a submissive derives gratification from giving tribute, gifts, or control of finances to a dominant. The dominant receives real financial benefit; the submissive receives the experience of submission.',
    sections: [
      {
        heading: 'How findom works',
        body: `Findom is a form of BDSM that focuses on financial control rather than physical sensation. A findomme (financial dominatrix) holds psychological and economic authority over the submissive, who is sometimes called a "pay pig" or "money slave." The relationship can be purely online or in-person, short-term or ongoing.

Common forms include tribute payments, wishlist purchases, wallet draining sessions, and task-based assignments with financial consequences.`,
      },
      {
        heading: 'Is it real money?',
        body: `Yes. Unlike scripted fantasy, findom involves real financial transactions. Tribute is sent via verified payment methods — cash apps, gift cards, or direct bank transfer. Reputable findommes are clear about rates and expectations upfront.`,
      },
      {
        heading: 'How to find a legitimate findomme',
        body: `Stick to directories that verify their listings. Look for providers with established online presences — real social accounts with history, clear communication, and explicit terms before any money changes hands. Never send unsolicited tribute; legitimate findommes set the terms.`,
      },
      {
        heading: 'Safety and boundaries',
        body: `Only ever spend what you can genuinely afford to lose. Set a firm budget before making contact. Legitimate professionals will respect your limits and stop a session if you signal distress. Any provider pressuring you to exceed your stated budget without prior agreement is a red flag.`,
      },
    ],
    relatedLinks: [
      { label: 'Browse verified findommes in Toronto', href: '/location/toronto' },
      { label: 'Find a dominatrix near you', href: '/guide/how-to-find-a-dominatrix' },
      { label: 'BDSM safety guide', href: '/guide/bdsm-safety' },
    ],
  },

  {
    slug: 'how-to-find-a-dominatrix',
    title: 'How to Find a Dominatrix',
    metaTitle: 'How to Find a Dominatrix Near You | DommeDirectory',
    metaDescription:
      'A practical guide to finding a professional dominatrix: where to look, what to expect, and how to make first contact safely.',
    h1: 'How to Find a Dominatrix',
    intro:
      'Finding a professional dominatrix is straightforward if you know where to look. The key is using reputable directories, being clear about what you want, and following basic safety steps before your first session.',
    sections: [
      {
        heading: 'Where to look',
        body: `The most reliable way to find a professional domme is through a dedicated directory like DommeDirectory. Verified directories screen profiles and give you direct contact links. General classifieds sites have no quality control and are a common source of scams.

Search by city — most professional dommes work in major metropolitan areas. If you're in a smaller city, some dommes travel regularly.`,
      },
      {
        heading: 'What to include in your first message',
        body: `Be specific about what you're looking for. A good first message includes: your experience level (beginner/intermediate/experienced), the type of session you're interested in, your availability, and any hard limits. Do not send explicit messages unprompted — professional dommes expect respectful inquiries.

Most providers have a booking form or preferred contact method on their profile. Follow it.`,
      },
      {
        heading: 'Session rates and deposits',
        body: `Professional dommes charge real rates — expect $150–$400+ per hour depending on the provider and session type. Deposits are standard and protect the provider's time. If a provider doesn't charge a deposit, that's unusual. Always confirm the total session fee before your appointment.`,
      },
      {
        heading: 'In-person vs. online sessions',
        body: `Many providers offer both. Online sessions (video calls, task assignments, tributes) are a lower-barrier way to establish a dynamic before meeting in person. For in-person sessions, established dommes work from a professional space — a dungeon, home studio, or rented venue.`,
      },
    ],
    relatedLinks: [
      { label: 'Browse dominatrices by city', href: '/usa' },
      { label: 'What to expect in your first session', href: '/guide/what-to-expect-first-session' },
      { label: 'BDSM safety basics', href: '/guide/bdsm-safety' },
    ],
  },

  {
    slug: 'bdsm-safety',
    title: 'BDSM Safety: A Practical Guide',
    metaTitle: 'BDSM Safety Guide: SSC, RACK & Safe Practice | DommeDirectory',
    metaDescription:
      'BDSM safety explained: safewords, negotiation, aftercare, and how to verify a professional before your first session.',
    h1: 'BDSM Safety: A Practical Guide',
    intro:
      'Safe BDSM practice comes down to negotiation, consent, and aftercare. Whether you\'re new or experienced, these fundamentals protect everyone involved.',
    sections: [
      {
        heading: 'SSC and RACK',
        body: `The two main frameworks for BDSM ethics are Safe, Sane, and Consensual (SSC) and Risk-Aware Consensual Kink (RACK). SSC emphasises that all activity should be physically safe, mentally sound, and explicitly consented to. RACK acknowledges that some activities carry inherent risk — what matters is that all parties are aware of and accept those risks.

Both frameworks require informed, explicit consent from all participants before any activity begins.`,
      },
      {
        heading: 'Safewords',
        body: `Agree on a safeword before every session. The traffic light system is common: "yellow" means slow down, "red" means stop completely. Providers may also use a tap-out (physical signal) for scenes where verbal communication is restricted.

A professional domme will pause the scene immediately on a safeword and check in. If a provider dismisses the concept of safewords, do not proceed.`,
      },
      {
        heading: 'Negotiation and limits',
        body: `Before your first session, negotiate: what activities are on the table, what is off-limits, what your experience level is, and any relevant physical or mental health factors (medications, injuries, triggers). This conversation is not optional — it's the foundation of a good session.

Limits can be "hard" (absolute no) or "soft" (cautious yes with conditions). Be honest about both.`,
      },
      {
        heading: 'Aftercare',
        body: `Aftercare is the physical and emotional support provided after an intense scene. It can include water, blankets, physical touch, verbal reassurance, or simply quiet time together. Both partners may need it — "top drop" (an emotional low felt by the dominant) is as real as "sub drop."

Discuss aftercare preferences during negotiation, not after the scene ends.`,
      },
      {
        heading: 'Verifying a professional',
        body: `Look for established online presence, clear booking terms, and a professional intake process (questions, limits form, deposit). Be cautious of providers who skip negotiation, pressure you to exceed limits, or operate without any online footprint.

DommeDirectory verifies listing profiles. Verified badges appear on provider pages.`,
      },
    ],
    relatedLinks: [
      { label: 'Find verified providers near you', href: '/usa' },
      { label: 'What to expect in your first session', href: '/guide/what-to-expect-first-session' },
      { label: 'How to find a dominatrix', href: '/guide/how-to-find-a-dominatrix' },
    ],
  },

  {
    slug: 'what-to-expect-first-session',
    title: 'What to Expect in Your First Dominatrix Session',
    metaTitle: 'What to Expect: Your First Dominatrix Session | DommeDirectory',
    metaDescription:
      'First-time session with a professional domme? Here\'s exactly what happens before, during, and after — so you can go in confident.',
    h1: 'What to Expect in Your First Dominatrix Session',
    intro:
      'First sessions are often more straightforward than newcomers expect. Professional dommes run structured sessions — there\'s a clear process before, during, and after. Here\'s what it looks like.',
    sections: [
      {
        heading: 'Before the session: booking and negotiation',
        body: `After you make contact and agree on a date and rate, most professionals send a pre-session questionnaire. This covers your experience level, interests, limits, and any health information relevant to the session (physical injuries, medications, triggers).

Pay the deposit when requested. Show up on time. Cancel with as much notice as possible — most providers have a cancellation policy and will keep the deposit if you cancel late.`,
      },
      {
        heading: 'Arriving at the session',
        body: `Professional dommes work from a designated space: a home dungeon, rented studio, or established dungeon venue. The space will typically include bondage equipment, impact implements, and other tools relevant to the session type.

You'll have a brief verbal check-in before anything starts — a chance to confirm limits, ask questions, and agree on a safeword. Do not skip this conversation even if you're nervous.`,
      },
      {
        heading: 'During the session',
        body: `The domme leads the session within the negotiated boundaries. Your role is to be present, honest, and use the safeword if needed. You will not be expected to improvise or take initiative — that's the dominant's job.

Sessions are usually 1–2 hours. More intense or complex sessions may be shorter. Time flies.`,
      },
      {
        heading: 'After the session: aftercare and payment',
        body: `After the scene ends, there's a cooldown period — aftercare. This might be a few minutes of quiet conversation, water, or physical warmth depending on what you negotiated beforehand. Don't skip out the door immediately.

Pay any remaining balance in full. Leave a review on their profile if they have one — it helps other clients and supports the provider's business.`,
      },
      {
        heading: 'Common first-session mistakes to avoid',
        body: `Don't arrive without having read the provider's terms. Don't skip the pre-session check-in. Don't exceed the agreed session time without asking first. Don't offer more money mid-session to go beyond agreed limits — this is disrespectful and will end the session. Don't ghost after booking.`,
      },
    ],
    relatedLinks: [
      { label: 'Find a professional domme near you', href: '/usa' },
      { label: 'BDSM safety guide', href: '/guide/bdsm-safety' },
      { label: 'How to find a dominatrix', href: '/guide/how-to-find-a-dominatrix' },
    ],
  },
];

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}
