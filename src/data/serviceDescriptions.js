/**
 * SEO content for each of the 15 services.
 * Used on service pages (empty-state rich content), the /services index,
 * city+service pages, and for FAQ structured data.
 *
 * Keys match the slug produced by slugifyService().
 */

const SERVICE_DESCRIPTIONS = {
  bondage: {
    shortDescription:
      'Bondage involves restraining a partner using rope, cuffs, tape, or other materials as part of consensual power exchange.',
    longDescription:
      'Bondage is one of the foundational practices in BDSM, centering on physical restraint as a means of surrendering or asserting control. A dominant partner uses rope, leather cuffs, chains, straps, or other tools to restrict the submissive\'s movement — partially or fully.\n\nThe appeal of bondage is both psychological and sensory. For the person being bound, there is the experience of vulnerability and trust; for the person binding, there is the responsibility of care and control. Bondage can be purely aesthetic (decorative rope work like Shibari), functional (restricting movement for other activities), or a standalone practice.\n\nProfessional dommes who specialize in bondage have training in safe restraint techniques, nerve-safe tie placement, and monitoring circulation. Sessions can range from light wrist restraints to full-body suspension, depending on experience level and negotiation.',
    whatToExpect:
      'A professional bondage session typically begins with a conversation about your experience, interests, and hard limits. The domme will explain the type of restraint she plans to use and check for any physical conditions (joint issues, circulation problems, claustrophobia) that affect positioning.\n\nDuring the session, you\'ll be guided into positions and restrained incrementally. The domme monitors your circulation, sensation, and emotional state throughout. Sessions usually last 1-2 hours and include aftercare — being untied carefully and having time to decompress.',
    faq: [
      {
        question: 'Is bondage safe?',
        answer:
          'When practiced by a trained professional, yes. Safe bondage requires knowledge of anatomy, nerve pathways, and circulation monitoring. Professional dommes are trained in quick-release techniques and check in throughout the session.',
      },
      {
        question: 'Do I need experience before booking a bondage session?',
        answer:
          'No. Many clients are beginners. A professional domme will tailor the session to your experience level, starting with lighter restraints and building from there based on your comfort.',
      },
      {
        question: 'What is the difference between bondage and Shibari?',
        answer:
          'Shibari (also called Kinbaku) is a specific Japanese rope bondage art that emphasizes aesthetic patterns and tension. Bondage is the broader category that includes all forms of restraint — rope, cuffs, straps, tape, and more.',
      },
    ],
    whatToLookFor: [
      'Documented training in rope safety or restraint techniques',
      'Clear communication about limits and safety protocols before the session',
      'Quick-release tools (safety shears) readily available during sessions',
      'Experience appropriate to the type of bondage you want (rope, leather, suspension)',
    ],
    relatedServices: ['discipline', 'domination', 'sadism'],
  },

  discipline: {
    shortDescription:
      'Discipline in BDSM involves structured rules, punishments, and behavioral correction within a consensual dominant-submissive dynamic.',
    longDescription:
      'Discipline is the practice of establishing rules and consequences within a power-exchange relationship. The dominant sets expectations for behavior, protocol, or tasks, and administers corrections when those expectations are not met. It is one of the core pillars of BDSM — the "D" in the acronym.\n\nDiscipline can be physical (corporal punishment, forced positions, endurance tasks) or psychological (verbal correction, written assignments, privilege removal). The structure appeals to submissives who thrive under clear expectations and defined consequences.\n\nProfessional dommes who specialize in discipline create tailored rule sets and punishment protocols for each client. The emphasis is on consistency, fairness, and the psychological dynamic — discipline is about the structure of authority, not arbitrary cruelty.',
    whatToExpect:
      'In a discipline-focused session, your domme will typically establish rules or protocols at the outset — these might involve forms of address, physical positions, or behavioral expectations. Infractions lead to predetermined consequences.\n\nSessions may combine verbal correction with physical punishment (such as spanking or corner time). The tone is authoritative and structured. Aftercare includes discussing what happened, reaffirming the dynamic, and ensuring emotional stability.',
    faq: [
      {
        question: 'What is the difference between discipline and punishment?',
        answer:
          'Discipline is the overarching system of rules and structure. Punishment is one tool within that system — the consequence administered when a rule is broken. Discipline can also include positive reinforcement for good behavior.',
      },
      {
        question: 'Is discipline always physical?',
        answer:
          'No. Discipline can be entirely psychological — writing assignments, loss of privileges, verbal correction, or behavioral protocols. Physical punishment is one option, not a requirement.',
      },
      {
        question: 'Can I set limits on what punishments are used?',
        answer:
          'Absolutely. All punishment methods are negotiated in advance. You have the right to exclude any activity from your sessions, and a professional domme will respect those boundaries completely.',
      },
    ],
    whatToLookFor: [
      'A clear intake process where rules and consequences are discussed before sessions begin',
      'Consistency in applying the agreed-upon structure',
      'Willingness to adapt the dynamic as you grow in the relationship',
      'Strong emphasis on aftercare following correction scenes',
    ],
    relatedServices: ['domination', 'humiliation', 'spanking'],
  },

  domination: {
    shortDescription:
      'Domination is the practice of exercising authority and control over a consenting submissive partner within negotiated boundaries.',
    longDescription:
      'Domination is the central practice in the BDSM dynamic — the exercise of consensual authority over another person. A professional dominatrix (domme) takes control of a session, directing the submissive\'s actions, behavior, and sometimes thoughts through verbal commands, physical positioning, and psychological techniques.\n\nDomination encompasses a broad spectrum: from light, playful control to strict, protocol-heavy dynamics. It can incorporate elements of other practices — bondage, discipline, humiliation, service — or stand alone as a purely psychological power exchange.\n\nProfessional dommes are skilled at reading their clients, calibrating intensity, and creating immersive experiences that balance authority with safety. The relationship is always grounded in negotiation, consent, and mutual respect.',
    whatToExpect:
      'A domination session is led entirely by the domme. After an initial negotiation (which may happen before or at the start of the session), you surrender control within the agreed boundaries. The domme directs the scene — what you do, when, and how.\n\nSessions vary widely depending on the domme\'s style and your interests. Some are quiet and intense; others are theatrical and commanding. Expect clear instructions, firm boundaries, and a controlled environment. Aftercare follows every session.',
    faq: [
      {
        question: 'What does a professional domination session involve?',
        answer:
          'It depends entirely on negotiation. Sessions can include verbal commands, physical positioning, roleplay scenarios, bondage, impact play, or psychological control. The domme tailors the experience to your discussed interests and limits.',
      },
      {
        question: 'Is domination the same as abuse?',
        answer:
          'No. Professional domination is consensual, negotiated, and bounded by agreed-upon limits. Either party can stop the session at any time using a safeword. Abuse lacks consent and boundaries — domination requires both.',
      },
      {
        question: 'Do I need to be submissive in daily life to enjoy domination?',
        answer:
          'Not at all. Many clients who seek domination sessions hold positions of authority in their daily lives. The appeal is often the contrast — the relief of surrendering control in a safe, structured environment.',
      },
    ],
    whatToLookFor: [
      'Clear communication style and willingness to discuss your interests before booking',
      'Verified profile with established online presence',
      'Defined session structure including negotiation and aftercare',
      'Respect for your limits and safeword at all times',
    ],
    relatedServices: ['submission', 'discipline', 'bondage'],
  },

  submission: {
    shortDescription:
      'Submission is the consensual act of yielding control to a dominant partner, embracing vulnerability and obedience within negotiated boundaries.',
    longDescription:
      'Submission is the counterpart to domination — the willing surrender of control within a structured, consensual dynamic. While it may seem passive, submission requires active participation: trust, communication, and the courage to be vulnerable.\n\nSubmissive experiences range from physical service (following orders, performing tasks) to psychological surrender (relinquishing decision-making, accepting correction). Many submissives describe the experience as meditative or deeply relaxing — a release from the constant demands of autonomy.\n\nProfessional dommes who guide submission-focused sessions create safe containers for clients to explore obedience, service, and vulnerability. The domme holds the structure; the submissive inhabits it.',
    whatToExpect:
      'A submission-focused session centers on your experience of yielding. The domme creates a framework — tasks, protocols, or scenarios — that allows you to practice surrendering control in a safe environment.\n\nSessions might involve service tasks, following verbal commands, adopting specific postures, or more complex dynamics depending on your experience. The pace is usually calibrated to your comfort, starting lighter and deepening as trust builds. Aftercare focuses on emotional processing.',
    faq: [
      {
        question: 'Is submission a sign of weakness?',
        answer:
          'No. Consensual submission requires significant self-awareness, courage, and trust. Choosing to be vulnerable within negotiated boundaries is an act of strength, not weakness.',
      },
      {
        question: 'Can I explore submission without a long-term commitment?',
        answer:
          'Yes. Single sessions with a professional domme are a common way to explore submissive dynamics without ongoing commitment. Many people start with one session to see how it feels.',
      },
      {
        question: 'What if I feel uncomfortable during a submission session?',
        answer:
          'Use your safeword. Any professional domme will stop immediately and check in. Your comfort and consent are the foundation of the experience — you are never trapped.',
      },
    ],
    whatToLookFor: [
      'A domme who prioritizes negotiation and understands your experience level',
      'Patience with beginners and willingness to go at your pace',
      'Clear aftercare practices for emotional processing',
      'Positive reviews from other clients who explored submission',
    ],
    relatedServices: ['domination', 'discipline', 'humiliation'],
  },

  sadism: {
    shortDescription:
      'Sadism in BDSM involves deriving satisfaction from consensually administering pain or intense sensation to a willing partner.',
    longDescription:
      'In the BDSM context, sadism is the consensual practice of inflicting controlled pain or intense sensation on a willing partner. The "S" in BDSM, it is practiced within strict boundaries of negotiation and consent — distinguishing it completely from non-consensual harm.\n\nSadistic play covers a spectrum: from light stinging sensations and sensation play (wartenberg wheels, pinching) to heavier impact, CBT, or edge play. The sadist derives satisfaction from the control, the response, and the trust involved. The masochist or bottom receives the sensation within their negotiated comfort zone.\n\nProfessional dommes skilled in sadistic play are experts in anatomy, pain thresholds, and reading their clients\' responses. They calibrate intensity precisely and maintain full awareness of safety throughout.',
    whatToExpect:
      'A sadism-focused session begins with thorough negotiation about pain tolerance, specific activities, and hard limits. The domme will typically start at lower intensity and build gradually, checking in as she increases.\n\nActivities might include impact play, pinching, scratching, wax play, or other forms of controlled pain. The experience is highly individual — some clients want to test their endurance, others seek the neurochemical rush of endorphins. Aftercare is particularly important after intense sensation play.',
    faq: [
      {
        question: 'Is sadism in BDSM the same as wanting to hurt people?',
        answer:
          'No. BDSM sadism is practiced only with enthusiastic consent from all parties. It requires deep empathy, technical skill, and constant attention to the partner\'s wellbeing. It is entirely distinct from non-consensual violence.',
      },
      {
        question: 'How do I know my limits with pain play?',
        answer:
          'Start slowly with a professional. A skilled domme will build intensity gradually and teach you to recognize and communicate your thresholds. You don\'t need to know your limits in advance — discovery is part of the process.',
      },
      {
        question: 'What safety measures are used in sadism sessions?',
        answer:
          'Safewords, gradual escalation, constant check-ins, anatomical knowledge (avoiding nerves, organs, and joints), first-aid preparedness, and comprehensive aftercare. Professional dommes train extensively in safe pain-play techniques.',
      },
    ],
    whatToLookFor: [
      'Extensive experience with the specific types of sensation play you are interested in',
      'Thorough pre-session negotiation including discussion of pain tolerance and medical history',
      'First aid supplies and safety equipment immediately available',
      'Strong aftercare practice including physical and emotional check-ins',
    ],
    relatedServices: ['masochism', 'spanking', 'cbt'],
  },

  masochism: {
    shortDescription:
      'Masochism is the consensual enjoyment of receiving pain or intense sensation from a trusted dominant partner.',
    longDescription:
      'Masochism in BDSM is the counterpart to sadism — the consensual desire to receive controlled pain or intense sensation as part of a negotiated dynamic. Far from self-destructive, BDSM masochism is a structured practice that many people find deeply fulfilling, stress-relieving, and even meditative.\n\nThe neurochemistry behind masochism is well-documented: controlled pain triggers endorphin release, creating a natural high sometimes called "sub space." This altered state is part of the appeal for many masochists. Others are drawn to the vulnerability, the trust exchange, or the intensity of the experience.\n\nProfessional dommes provide a safe, controlled environment for exploring masochistic desires. They manage intensity, monitor your state, and ensure the experience stays within your boundaries.',
    whatToExpect:
      'A masochism-oriented session starts with discussing what types of sensation you enjoy or want to explore, your experience level, and any areas of your body that are off-limits. The domme controls the intensity and pace.\n\nYou might experience impact play, sensation tools, restriction, or other forms of controlled discomfort. Communication is ongoing — you\'re expected to use your safeword if needed. Aftercare is essential and may include physical comfort, hydration, and emotional check-in.',
    faq: [
      {
        question: 'Why do people enjoy masochism?',
        answer:
          'Reasons vary: the endorphin rush, the intensity of the experience, the deep trust required, stress relief, or the meditative quality of surrendering to sensation. There is no single explanation — it is a personal preference.',
      },
      {
        question: 'Is masochism psychologically unhealthy?',
        answer:
          'No. Consensual masochism practiced within boundaries is recognized by psychological professionals as a normal variation of human sexuality. It becomes concerning only when it is non-consensual or causes distress outside the practice.',
      },
      {
        question: 'Can I try masochism if I have a low pain tolerance?',
        answer:
          'Yes. Pain tolerance is a spectrum, and professional dommes are skilled at calibrating intensity. You can explore at your own pace — even very light sensation play counts.',
      },
    ],
    whatToLookFor: [
      'A domme who communicates clearly about intensity levels and escalation',
      'Willingness to start light and build gradually based on your responses',
      'Knowledge of aftercare for sub drop and physical recovery',
      'Experience with the specific types of sensation you want to explore',
    ],
    relatedServices: ['sadism', 'spanking', 'bondage'],
  },

  roleplay: {
    shortDescription:
      'BDSM roleplay involves acting out negotiated scenarios and power dynamics — from domestic discipline to interrogation scenes.',
    longDescription:
      'Roleplay in BDSM is the practice of inhabiting characters, scenarios, or dynamics that intensify the power exchange. It can range from light (boss/employee, teacher/student) to elaborate (interrogation scenes, abduction fantasies, period-specific settings) depending on the participants\' interests.\n\nRoleplay allows clients to explore fantasies in a safe, controlled environment with a skilled partner. Professional dommes who specialize in roleplay are essentially performers and directors — they build immersive scenes, maintain character, and manage the dynamic while staying attuned to safety.\n\nThe psychological depth of roleplay makes it one of the most versatile BDSM practices. It can incorporate elements of domination, humiliation, discipline, or any other interest within the framework of the scenario.',
    whatToExpect:
      'Roleplay sessions require more pre-session discussion than most other activities. You\'ll collaborate with the domme on the scenario — characters, setting, tone, and boundaries. Some dommes offer pre-written scenarios; others build custom ones with you.\n\nDuring the session, you\'ll inhabit your role within the agreed scenario. The domme directs the scene and maintains the narrative. Safewords still apply — stepping out of character to signal discomfort is always permitted. Aftercare includes de-roling: transitioning back to yourselves and processing the experience.',
    faq: [
      {
        question: 'What kinds of roleplay scenarios are common?',
        answer:
          'Common scenarios include authority dynamics (teacher/student, boss/employee, captor/prisoner), domestic discipline, medical play, pet play, and interrogation scenes. Custom scenarios built around specific fantasies are also popular.',
      },
      {
        question: 'Do I need acting experience for BDSM roleplay?',
        answer:
          'No. The domme leads the scene and guides you through it. Your role is to be present and responsive. Many clients find that immersion happens naturally once the scene begins.',
      },
      {
        question: 'Can roleplay be combined with other BDSM activities?',
        answer:
          'Yes, and it often is. Roleplay provides the narrative framework — bondage, discipline, impact play, or other activities happen within the story. The scenario adds psychological depth to the physical experience.',
      },
    ],
    whatToLookFor: [
      'Creativity and willingness to collaborate on custom scenarios',
      'Strong communication skills and ability to maintain character while monitoring safety',
      'Experience with the type of scenario you\'re interested in',
      'Clear boundaries about what is and isn\'t part of the roleplay',
    ],
    relatedServices: ['domination', 'humiliation', 'fetish'],
  },

  fetish: {
    shortDescription:
      'Fetish services cater to specific objects, materials, body parts, or scenarios that hold particular erotic significance for the client.',
    longDescription:
      'A fetish is a strong, persistent attraction to a specific object, material, body part, or situation. In the context of professional domination, fetish services cater to these specific interests — whether that\'s leather, latex, boots, stockings, uniforms, or countless other objects of desire.\n\nFetishes are among the most personal aspects of sexuality, and professional dommes who specialize in fetish work approach them with skill and non-judgment. The session is built around the specific fetish — the domme incorporates the relevant objects, materials, or scenarios into the dynamic.\n\nFetish sessions can be purely worship-based (admiring, touching, or serving the fetish object) or combined with other BDSM elements like domination, humiliation, or bondage.',
    whatToExpect:
      'Be specific about your fetish when booking. The more clearly you communicate what interests you, the better the domme can prepare. Many dommes maintain extensive wardrobes and equipment specifically for fetish sessions.\n\nThe session itself centers on your fetish within a controlled BDSM dynamic. Depending on the nature of the fetish, it might involve worship, sensory immersion, service, or more complex scenarios. The domme manages the scene to maximize the experience while maintaining boundaries.',
    faq: [
      {
        question: 'Is having a fetish normal?',
        answer:
          'Yes. Fetishes are a common and well-documented aspect of human sexuality. They become a concern only if they cause personal distress or involve non-consenting parties — neither of which applies in a professional setting.',
      },
      {
        question: 'Will the domme judge me for my fetish?',
        answer:
          'Professional dommes work with a wide range of fetishes regularly. Non-judgment is a professional standard. If a domme doesn\'t cater to a specific interest, she\'ll tell you directly — there\'s no shame involved.',
      },
      {
        question: 'What if my fetish is unusual or niche?',
        answer:
          'Many dommes specialize in niche fetishes. Be upfront about what you\'re looking for when inquiring. If a particular domme doesn\'t offer what you need, she may be able to refer you to someone who does.',
      },
    ],
    whatToLookFor: [
      'A domme who explicitly lists your fetish interest in her services or experience',
      'Non-judgmental intake process where you can describe your interests openly',
      'Appropriate equipment, wardrobe, or materials for your specific fetish',
      'Willingness to discuss the details of what makes the fetish work for you',
    ],
    relatedServices: ['foot-worship', 'roleplay', 'domination'],
  },

  cbt: {
    shortDescription:
      'CBT (cock and ball torture) involves consensual pain, pressure, or restriction applied to the male genitals within negotiated boundaries.',
    longDescription:
      'CBT — cock and ball torture — is a specific BDSM practice involving the application of pain, pressure, stretching, or restriction to the male genitals. Despite the extreme-sounding name, CBT exists on a wide spectrum from mild to intense, and professional sessions are carefully controlled.\n\nCBT can involve impact (slapping, flicking), compression (squeezing, binding), stretching (weights, pulling), temperature play (ice, wax), or device-based restriction (chastity, ball crushers). The practice requires specific anatomical knowledge and careful technique.\n\nProfessional dommes who offer CBT are trained in genital anatomy, safe pressure points, and monitoring for signs of distress. Sessions are built around your specific interests and tolerance level.',
    whatToExpect:
      'A CBT session starts with a frank conversation about what types of stimulation you enjoy, your pain tolerance, and any medical conditions affecting the area. The domme will explain what she plans to use and how.\n\nDuring the session, intensity builds gradually. The domme monitors your responses closely and checks in regularly. Communication is especially important in CBT — you\'re expected to report any numbness, sharp pain, or discomfort beyond what was negotiated. Aftercare includes physical inspection and rest.',
    faq: [
      {
        question: 'Is CBT dangerous?',
        answer:
          'When practiced by a knowledgeable professional with proper technique, CBT is managed safely. The key risks — nerve damage, circulation issues — are mitigated through training, gradual escalation, and constant monitoring. Always work with an experienced provider.',
      },
      {
        question: 'What intensity levels are available for CBT?',
        answer:
          'CBT ranges from very light (gentle squeezing, light flicking) to heavy (weights, impact, compression devices). A professional will calibrate to your experience and build from there. You don\'t need to start intense.',
      },
      {
        question: 'Do I need to prepare anything before a CBT session?',
        answer:
          'Good hygiene is expected. Disclose any medical conditions affecting the genitals (hernias, recent surgery, infections). Some providers request you avoid certain activities beforehand — they\'ll tell you during booking.',
      },
    ],
    whatToLookFor: [
      'Specific experience with CBT listed in the provider\'s services',
      'Knowledge of genital anatomy and safe pressure thresholds',
      'A gradual approach to intensity, especially for first-time clients',
      'Willingness to stop immediately if you report unexpected pain or numbness',
    ],
    relatedServices: ['sadism', 'bondage', 'domination'],
  },

  spanking: {
    shortDescription:
      'Spanking is one of the most accessible forms of impact play, involving controlled strikes to the buttocks within a consensual dynamic.',
    longDescription:
      'Spanking is perhaps the most widely recognized form of BDSM impact play. It involves striking the buttocks — with hands, paddles, crops, or other implements — within a consensual, negotiated framework. Its familiarity makes it an accessible entry point for people exploring BDSM.\n\nSpanking can be administered in various contexts: as discipline (punishment for rule infractions), as sensation play (building intensity for the physical experience), or as part of a roleplay scenario. The psychological dimension — the vulnerability of the position, the authority of the person administering — is often as significant as the physical sensation.\n\nProfessional dommes calibrate spanking sessions to the client\'s experience and tolerance. Implements, intensity, positioning, and context are all negotiated in advance.',
    whatToExpect:
      'A spanking session typically starts with discussing your experience, preferred intensity, and any implements you\'re interested in (or want to avoid). The domme will explain her approach and check for relevant physical conditions.\n\nThe session itself involves progressive impact — starting lighter and building based on your responses and the negotiated plan. Positioning varies (over the knee, bent over furniture, standing). The domme reads your responses and adjusts accordingly. Aftercare may include soothing the area and emotional check-in.',
    faq: [
      {
        question: 'Does spanking cause lasting damage?',
        answer:
          'When administered by a professional on appropriate body areas (the buttocks, specifically the lower fleshy portion), spanking does not cause lasting damage. Temporary redness and mild soreness are normal. Professional dommes avoid the tailbone, kidneys, and spine.',
      },
      {
        question: 'What implements are used in professional spanking?',
        answer:
          'Common implements include hands, paddles (leather, wood), crops, floggers, and canes. Each produces a different sensation — thuddy, stingy, or sharp. Your domme will discuss options with you and may demonstrate on a less sensitive area first.',
      },
      {
        question: 'Is spanking appropriate for BDSM beginners?',
        answer:
          'Yes. Spanking is one of the most common entry points into BDSM. It\'s relatively low-risk, easy to calibrate, and most people have some reference point for the sensation. A professional domme can make your first experience comfortable and controlled.',
      },
    ],
    whatToLookFor: [
      'Experience with a range of implements and intensities',
      'Knowledge of safe striking zones and anatomy',
      'Willingness to start at your comfort level and adjust',
      'A defined aftercare approach for post-session physical and emotional care',
    ],
    relatedServices: ['discipline', 'sadism', 'domination'],
  },

  humiliation: {
    shortDescription:
      'Erotic humiliation involves consensual verbal degradation, embarrassment scenarios, or psychological control for mutual gratification.',
    longDescription:
      'Erotic humiliation is a psychological BDSM practice where the dominant uses verbal degradation, embarrassment, or status-play to create a power dynamic. It is entirely consensual and carefully negotiated — the submissive derives gratification from the experience of being humiliated within safe boundaries.\n\nHumiliation can be verbal (name-calling, degrading commands, critical commentary), situational (forced tasks, embarrassing scenarios), or physical (forced positions, clothing requirements). The intensity spectrum runs from mild teasing to heavy degradation, always within what both parties have agreed to.\n\nProfessional dommes who specialize in humiliation are skilled psychologists. They understand the line between exciting humiliation and genuine harm, and they navigate it with precision. The aftercare component is particularly important — returning the client to a positive emotional state after the scene.',
    whatToExpect:
      'Negotiation for humiliation sessions is especially detailed. You\'ll discuss specific words, themes, and scenarios that work for you — and those that don\'t. Triggers, insecurities, and emotional boundaries are mapped clearly before the session begins.\n\nDuring the session, the domme creates the humiliation dynamic through verbal and situational control. She monitors your emotional responses throughout. Aftercare for humiliation sessions is robust — it typically includes verbal affirmation, emotional processing, and reassurance. The domme will ensure you leave in a positive headspace.',
    faq: [
      {
        question: 'Is erotic humiliation psychologically harmful?',
        answer:
          'When practiced consensually with clear boundaries and proper aftercare, no. The key factors are negotiation (knowing what is and isn\'t acceptable), safewords (being able to stop at any time), and aftercare (emotional recovery after the scene).',
      },
      {
        question: 'What if the humiliation triggers something unexpected?',
        answer:
          'Use your safeword immediately. Professional dommes are prepared for this — they will stop, break character, and provide support. Unexpected emotional responses are normal and not a sign of failure.',
      },
      {
        question: 'Can I choose exactly what kind of humiliation is used?',
        answer:
          'Yes. Humiliation is one of the most heavily negotiated BDSM activities. You specify what themes, words, and scenarios are acceptable — and what is off-limits. Nothing happens that wasn\'t agreed upon.',
      },
    ],
    whatToLookFor: [
      'Thorough pre-session negotiation covering specific triggers and boundaries',
      'Strong emotional intelligence and ability to read your responses in real time',
      'Robust aftercare practice with emphasis on emotional recovery',
      'Clear distinction between the scene and real life — professionalism outside the dynamic',
    ],
    relatedServices: ['domination', 'discipline', 'sissy-training'],
  },

  'foot-worship': {
    shortDescription:
      'Foot worship involves the reverent admiration, massage, kissing, or service of a dominant\'s feet within a consensual power dynamic.',
    longDescription:
      'Foot worship is one of the most common fetish practices in BDSM, combining physical admiration with power-exchange dynamics. The submissive attends to the dominant\'s feet — through massage, kissing, licking, or other forms of worship — as an expression of devotion and service.\n\nThe practice taps into multiple psychological currents: the inherent power imbalance (being at someone\'s feet), the intimacy of physical service, and for many, a genuine aesthetic and sensory attraction to feet. Foot worship can be the centerpiece of a session or one element within a broader domination dynamic.\n\nProfessional dommes who offer foot worship maintain meticulous foot care and often have extensive collections of footwear (heels, boots, stockings) that form part of the experience. Sessions may also incorporate trampling, shoe worship, or foot-based humiliation depending on the client\'s interests.',
    whatToExpect:
      'A foot worship session is typically relaxed in pacing compared to other BDSM activities. You\'ll discuss your specific interests — bare feet, stockings, heels, boots, specific activities — and the domme will prepare accordingly.\n\nThe session might involve you kneeling before the domme, removing her shoes, and worshipping her feet through touch, massage, or kissing. The domme maintains the power dynamic throughout — directing you, setting the pace, and controlling the interaction. Some sessions incorporate other elements like verbal humiliation or trampling.',
    faq: [
      {
        question: 'Is foot worship considered a fetish or a kink?',
        answer:
          'Foot attraction is technically a fetish (persistent sexual interest in a specific body part). However, foot worship in BDSM combines the fetish element with power-exchange dynamics, making it both a fetish practice and a BDSM activity.',
      },
      {
        question: 'What if I\'m interested in foot worship but feel embarrassed?',
        answer:
          'Foot fetishes are one of the most common fetishes worldwide. Professional dommes work with foot worship clients regularly and approach it without judgment. There is nothing unusual about the interest.',
      },
      {
        question: 'Does foot worship always involve physical contact?',
        answer:
          'Not necessarily. Some sessions focus on visual worship (admiring feet in specific shoes or positions), verbal worship, or service acts (painting nails, massaging). Physical contact is one option, not a requirement.',
      },
    ],
    whatToLookFor: [
      'A domme who explicitly offers foot worship and is comfortable with the practice',
      'Well-maintained feet and a range of footwear options',
      'Willingness to discuss your specific preferences (bare feet, heels, stockings, etc.)',
      'Ability to maintain the power dynamic throughout the worship experience',
    ],
    relatedServices: ['fetish', 'domination', 'humiliation'],
  },

  pegging: {
    shortDescription:
      'Pegging involves a dominant partner using a strap-on dildo for anal penetration of a male submissive within a consensual dynamic.',
    longDescription:
      'Pegging is the practice of a dominant partner (typically female) penetrating a male submissive anally using a strap-on dildo. In the context of professional domination, pegging combines physical sensation with power-exchange dynamics — the reversal of traditional penetrative roles is a significant part of its psychological appeal.\n\nThe practice requires proper preparation, high-quality equipment, and knowledge of anatomy. Professional dommes who offer pegging use body-safe silicone toys, appropriate lubricant, and understand the importance of gradual progression and communication.\n\nPegging can be the focus of a session or part of a broader domination dynamic. For many clients, the vulnerability of the experience and the trust it requires deepen the power exchange significantly.',
    whatToExpect:
      'Communication before a pegging session is essential. The domme will discuss your experience level, any preparation you should do beforehand, and the specific toys and techniques she\'ll use. Hygiene preparation on your part is expected.\n\nThe session itself involves gradual progression — starting with smaller sizes and building as you\'re comfortable. The domme controls the pace entirely and checks in frequently. Comfort, relaxation, and trust are central. Aftercare includes physical check-in and emotional processing, particularly if pegging is new to you.',
    faq: [
      {
        question: 'Is pegging safe?',
        answer:
          'Yes, when practiced with proper preparation, appropriate equipment (body-safe materials, correct lubricant), and gradual progression. Professional dommes are trained in safe technique and anatomy. Communication during the session is essential.',
      },
      {
        question: 'How should I prepare for a pegging session?',
        answer:
          'Your domme will provide specific guidance. Generally: good hygiene, dietary consideration beforehand, and being relaxed. Don\'t attempt to prepare with equipment you\'re not familiar with — let the professional guide the experience.',
      },
      {
        question: 'Does enjoying pegging say anything about my sexual orientation?',
        answer:
          'No. Anal pleasure is a physiological response (the prostate is a source of pleasure regardless of orientation). Enjoying pegging with a female partner has no bearing on sexual orientation.',
      },
    ],
    whatToLookFor: [
      'Body-safe, high-quality strap-on equipment and appropriate lubricant',
      'Patient approach with clear communication throughout',
      'Experience working with beginners if this is your first time',
      'Strict hygiene standards and professional preparation',
    ],
    relatedServices: ['domination', 'bondage', 'humiliation'],
  },

  'financial-domination': {
    shortDescription:
      'Financial domination (findom) is a power-exchange dynamic where the submissive derives gratification from giving financial tribute to a dominant.',
    longDescription:
      'Financial domination — findom — is a BDSM practice centered on financial control and tribute. The submissive (sometimes called a "pay pig" or "money slave") derives gratification from giving money, gifts, or financial control to a dominant (findomme). The findomme holds economic authority as an expression of power.\n\nFindom can manifest as regular tributes, wishlist purchases, wallet-draining sessions, or ongoing financial control arrangements. The dynamic is real — actual money changes hands. This distinguishes it from roleplay and makes proper boundaries especially important.\n\nProfessional findommes are clear about their expectations, rates, and boundaries. Legitimate practitioners respect the submissive\'s financial limits and will not pressure someone to spend beyond their means. The dynamic should enhance the submissive\'s life, not damage it.',
    whatToExpect:
      'Findom interactions often start online — tribute payments, tasks, or ongoing control dynamics conducted through messaging and payment platforms. Some findommes also offer in-person sessions that combine financial domination with other BDSM practices.\n\nBefore engaging, set a firm personal budget. A legitimate findomme will ask about your financial limits and respect them. Sessions or dynamics involve tributes at agreed-upon levels, tasks with financial consequences, or ongoing arrangements. Never send unsolicited money — legitimate findommes set the terms.',
    faq: [
      {
        question: 'How do I know a findomme is legitimate?',
        answer:
          'Legitimate findommes have established online presences, clear terms, and transparent pricing. They discuss limits before accepting tribute. Red flags include: demanding money before any interaction, pressuring you to exceed stated limits, and no verifiable online history.',
      },
      {
        question: 'How much should I budget for findom?',
        answer:
          'Only what you can genuinely afford to lose without affecting your bills, savings, or quality of life. Set a hard monthly limit before making contact and communicate it clearly. Any findomme who pressures you past this limit is not acting professionally.',
      },
      {
        question: 'Is findom just about money?',
        answer:
          'The money is real, but the dynamic is psychological. The gratification comes from the power exchange — the act of surrendering financial control. For many, it\'s the most tangible form of submission because the consequences are concrete and immediate.',
      },
    ],
    whatToLookFor: [
      'Established online presence with verifiable history',
      'Clear, upfront terms before any money changes hands',
      'Respect for your stated financial limits',
      'No pressure tactics or unsolicited demands for tribute',
    ],
    relatedServices: ['domination', 'humiliation', 'submission'],
  },

  'sissy-training': {
    shortDescription:
      'Sissy training involves guided feminization, gender-role exploration, and obedience training within a consensual domination dynamic.',
    longDescription:
      'Sissy training is a BDSM practice where a dominant guides a male-identified submissive through feminization and gender-role exploration. This can include wearing feminine clothing, adopting feminine mannerisms, makeup application, behavioral training, and roleplay scenarios centered on the "sissy" identity.\n\nThe practice sits at the intersection of domination, humiliation, and gender play. For some clients, it\'s purely a humiliation-based kink; for others, it\'s a genuine exploration of gender expression in a safe, non-judgmental environment. Professional dommes approach sissy training without assumptions about the client\'s underlying motivation.\n\nSissy training sessions can range from light (trying on outfits, learning to walk in heels) to elaborate (full makeovers, behavioral protocols, ongoing training programs). The domme provides instruction, correction, and the authoritative dynamic that frames the experience.',
    whatToExpect:
      'Sissy training sessions are highly personalized. During the intake, you\'ll discuss what aspects of feminization interest you, your experience level, and any hard limits. Some clients want the full experience; others are interested in specific elements.\n\nA session might involve wardrobe selection, makeup, posture and movement coaching, verbal feminization, or scenario-based training. The domme maintains a dominant framework — praise for compliance, correction for mistakes. The tone can be encouraging, strict, or humiliation-based depending on your negotiation. Aftercare includes emotional processing, especially if the session surfaces complex feelings about gender.',
    faq: [
      {
        question: 'Does enjoying sissy training mean I\'m transgender?',
        answer:
          'Not necessarily. Many people who enjoy sissy training identify firmly as cisgender men. It can be a kink, a form of humiliation play, a stress release, or a gender exploration — the meaning is personal. A professional domme won\'t make assumptions about your identity.',
      },
      {
        question: 'What should I bring to a sissy training session?',
        answer:
          'Many dommes provide clothing and supplies. If you have specific items (a favorite outfit, shoes in your size), ask if you should bring them. Otherwise, your domme will have what\'s needed. Come with an open mind and clear communication about boundaries.',
      },
      {
        question: 'Can sissy training be done online?',
        answer:
          'Yes. Many dommes offer online sissy training through video sessions, task assignments, and ongoing programs. Online training is especially popular for clients who want to explore privately before an in-person session.',
      },
    ],
    whatToLookFor: [
      'Non-judgmental approach to your motivations and identity',
      'Range of clothing, shoes, and supplies in various sizes',
      'Experience with both light exploration and more intensive training',
      'Strong aftercare practice, especially for emotional processing',
    ],
    relatedServices: ['humiliation', 'domination', 'roleplay'],
  },
};

export default SERVICE_DESCRIPTIONS;

/**
 * Helper to get description data for a service by slug.
 * Returns null if the slug is not found.
 */
export function getServiceDescription(slug) {
  return SERVICE_DESCRIPTIONS[slug] || null;
}
