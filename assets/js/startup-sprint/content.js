/* YOPPI Startup Sprint: local, versioned content for the Startup City simulator.
   Everything here is a fictional training market: people, towns, numbers and prices
   are made up for learning, and no real sales happen. Money values are whole rupees.
   Loaded as a classic script in the browser (window.YOPPI_SS_CONTENT) and with
   require() in Node tests. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YOPPI_SS_CONTENT = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CONTENT_VERSION = 'content-1.0';
  var LAUNCH_RESERVE = 500; // building must leave this much for promotion and supplies

  /* ------------------------------------------------------------ Startup City */

  // The six landmarks. Build Studio hosts both the Build and the Test stages.
  var LOCATIONS = [
    { id: 'idea-park', name: 'Idea Park', chapter: 'Spot It', verb: 'Find a problem', icon: 'bulb', tone: 'teal', stages: ['discover'] },
    { id: 'people-street', name: 'People Street', chapter: 'Ask People', verb: 'Talk to people', icon: 'chat', tone: 'blue', stages: ['interview'] },
    { id: 'market-centre', name: 'Market Centre', chapter: 'Check the Market', verb: 'Who might buy?', icon: 'store', tone: 'amber', stages: ['market'] },
    { id: 'build-studio', name: 'Build Studio', chapter: 'Build It + Try It Out', verb: 'Build and test', icon: 'blocks', tone: 'violet', stages: ['build', 'test'] },
    { id: 'launch-square', name: 'Launch Square', chapter: 'Open for Business', verb: 'Open your shop', icon: 'megaphone', tone: 'rose', stages: ['launch'] },
    { id: 'founder-hq', name: 'Founder HQ', chapter: 'My Startup Report', verb: 'Your report', icon: 'trophy', tone: 'navy', stages: ['report'] }
  ];

  var GRADES = [
    { id: '6-8', label: 'Class 6–8', title: 'Start Your First Shop', blurb: 'Short, simple steps with friendly hints.', emoji: '🌱' },
    { id: '9-10', label: 'Class 9–10', title: 'Build a Better Business', blurb: 'More customer groups and trade-offs.', emoji: '🚀' },
    { id: '11-12', label: 'Class 11–12', title: 'Grow Your Startup', blurb: 'Deeper numbers: margins, repeat buyers.', emoji: '📈' }
  ];

  // Interview questions. quality: how good the evidence is (past behaviour > money > leading).
  var QUESTION_KINDS = {
    past: { quality: 1, tag: 'Asks what really happened', verdict: 'Great question! Asking about the last time shows what people really do.' },
    money: { quality: 0.75, tag: 'Asks about money', verdict: 'Useful! Now you know what they spend today.' },
    leading: { quality: 0.15, tag: 'Hopes for a yes', verdict: 'People often say yes just to be nice. This answer is weak proof.' }
  };

  var HINTS = [
    'Ask about the last time something happened. It tells you more than "Would you like…?"',
    'Not everyone nearby is your customer. Look for people who need this often.',
    'A feature is only worth it if your customers asked for it.',
    'Watch where testers stop. That is where your product needs work.',
    'A higher price earns more per order, but fewer people may buy.',
    'Pick a promotion that reaches the people you chose to serve.',
    'When something goes wrong, being honest with customers builds trust.',
    'Revenue is money in. Profit is what is left after all costs.'
  ];

  var GLOSSARY = [
    { term: 'Startup', meaning: 'A new, small business that solves a problem for people.' },
    { term: 'Customer', meaning: 'A person who buys from your business.' },
    { term: 'Revenue (sales)', meaning: 'All the money that comes in from orders.' },
    { term: 'Costs', meaning: 'Money you spend to build and run your business.' },
    { term: 'Profit / loss', meaning: 'Sales minus all costs. Below zero is a loss.' },
    { term: 'Market size', meaning: 'How many people might need what you sell.', grades: ['9-10', '11-12'] },
    { term: 'Conversion', meaning: 'Out of the people who saw your shop, how many bought.', grades: ['11-12'] },
    { term: 'Margin', meaning: 'What you keep from one order after paying for it.', grades: ['11-12'] }
  ];

  // Labels that change with the class band.
  var TERMS = {
    '6-8': { market: 'People who might buy', buyers: 'people who bought', revenue: 'Money in (pretend sales)', costs: 'Money out', profit: 'Money made or lost' },
    '9-10': { market: 'Potential buyers', buyers: 'customers', revenue: 'Virtual sales', costs: 'Virtual costs', profit: 'Profit / loss' },
    '11-12': { market: 'Market size (estimate)', buyers: 'customers', revenue: 'Virtual revenue', costs: 'Virtual costs', profit: 'Profit / loss' }
  };

  /* --------------------------------------------- Reason codes → friendly lines
     kind: 'good' (a strength) or 'grow' (an improvement). Higher weight = said first.
     {tokens} are filled in by the engine. */
  var REASONS = {
    GOOD_RESEARCH: { kind: 'good', weight: 6, decision: 'research', text: 'You asked people about what really happened, so your evidence was strong.' },
    WEAK_RESEARCH: { kind: 'grow', weight: 5, decision: 'research', text: 'Next time, ask "Tell me about the last time…". Questions that hope for a yes give weak proof.' },
    TALKED_TO_NON_CUSTOMER: { kind: 'grow', weight: 3, decision: 'research', text: '{name} was friendly but would not buy. Talk to people who actually face the problem.' },
    ESTIMATE_GOOD: { kind: 'good', weight: 4, decision: 'market', text: 'Your estimate of {estimate} people was well supported. Not everyone nearby is a customer.' },
    ESTIMATE_TOO_BIG: { kind: 'grow', weight: 3, decision: 'market', text: 'You guessed everyone in the group would need it. Only about {estimate} really do.' },
    ESTIMATE_TOO_SMALL: { kind: 'grow', weight: 2, decision: 'market', text: 'You thought only a few people needed it. The evidence showed about {estimate}.' },
    SEGMENT_BACKED: { kind: 'good', weight: 4, decision: 'market', text: 'You chose {segment} after hearing from them. Good use of evidence.' },
    FEATURE_FIT_STRONG: { kind: 'good', weight: 8, decision: 'build', text: 'Your features matched what {segment} needed, so more of them bought.' },
    FEATURE_FIT_WEAK: { kind: 'grow', weight: 7, decision: 'build', text: 'Some features did not help {segment}. Build what your customers asked for.' },
    MUST_HAVE_MISSING: { kind: 'grow', weight: 8, decision: 'build', text: '{segment} really needed "{feature}". Without it, many walked away.' },
    TRUST_FEATURE_HELPED: { kind: 'good', weight: 6, decision: 'build', text: '"{feature}" helped people trust your shop.' },
    TRUST_GAP: { kind: 'grow', weight: 7, decision: 'build', text: '{segment} needed to trust you more. Checks, labels or reviews would help.' },
    TEST_FIX_HELPED: { kind: 'good', weight: 7, decision: 'test', text: 'You fixed what testers struggled with before opening. Smart move.' },
    TEST_IGNORED: { kind: 'grow', weight: 5, decision: 'test', text: 'Testers showed a problem you kept. Fixing it first could win more customers.' },
    GOOD_PRICE_FIT: { kind: 'good', weight: 6, decision: 'price', text: 'Your price of ₹{price} suited what {segment} can pay.' },
    HIGH_PRICE_FOR_SEGMENT: { kind: 'grow', weight: 8, decision: 'price', text: '₹{price} was more than {segment} usually pay (about ₹{tolerance}). Fewer people bought.' },
    LOW_PRICE_THIN_MARGIN: { kind: 'grow', weight: 5, decision: 'price', text: 'At ₹{price}, you kept only ₹{margin} per order. A slightly higher price could pay for your costs.' },
    PROMOTION_REACHED_MORE_USERS: { kind: 'good', weight: 6, decision: 'channel', text: '"{channel}" reached the people you chose to serve.' },
    CHANNEL_MISMATCH: { kind: 'grow', weight: 7, decision: 'channel', text: '"{channel}" did not reach many {segment}. Pick a promotion that fits your customers.' },
    CAPACITY_LIMITED_SALES: { kind: 'grow', weight: 4, decision: 'launch', text: 'More people wanted to buy than you could serve in a week. A nice problem to have!' },
    REPEAT_BUYERS_CAME_BACK: { kind: 'good', weight: 5, decision: 'launch', text: '{repeat} happy customers came back and bought again in Week 2.' },
    EVENT_RESPONSE_HELPED: { kind: 'good', weight: 6, decision: 'event', text: 'When "{event}" happened, your response kept customers happy.' },
    EVENT_RESPONSE_COST_MORE: { kind: 'grow', weight: 3, decision: 'event', text: 'Your response to the surprise cost ₹{cost}. Sometimes that is worth it; check if it paid back.' },
    EVENT_HURT: { kind: 'grow', weight: 7, decision: 'event', text: 'Ignoring "{event}" upset customers. Being honest and quick keeps their trust.' },
    MADE_PROFIT: { kind: 'good', weight: 5, decision: 'money', text: 'You earned back all you spent and made ₹{profit} profit.' },
    MADE_LOSS: { kind: 'grow', weight: 2, decision: 'money', text: 'You spent ₹{loss} more than you earned. Most new businesses take time to earn back building costs.' },
    ZERO_SALES: { kind: 'grow', weight: 9, decision: 'money', text: 'Your customers did not buy this time. Check your price, your promotion and who you chose to serve.' },
    FINISHED: { kind: 'good', weight: 1, decision: 'journey', text: 'You finished a whole business journey, from a problem to an open shop.' },
    LISTENED_TO_THREE: { kind: 'good', weight: 1, decision: 'research', text: 'You talked to three different people before building anything.' }
  };

  /* ---------------------------------------------------------------- Scenarios */

  var SCENARIOS = [
    /* ======================================================= PLAYSHARE */
    {
      id: 'playshare',
      title: 'PlayShare',
      emoji: '🏏',
      kind: 'Sports gear sharing',
      problem: 'Sports gear is hard to borrow.',
      story: { who: 'Kabir', role: 'Class 8', initials: 'K', tone: 'teal', line: 'Saturday match tomorrow, and I still don’t have a bat!' },
      helps: 'kids and families who want to play but don’t own the gear',
      questions: { past: 'Tell me about the last time you needed sports gear.', money: 'What do you spend on sports gear now?', leading: 'Wouldn’t a gear-sharing app be amazing?' },
      defaultName: 'PlayShare',
      nameIdeas: ['PlayShare', 'GearUp Gang', 'BatBuddy'],
      town: { name: 'Green Valley', type: 'colony', population: 4000 },
      startingCash: 2500,
      baseUnitCost: 15,
      unitLabel: 'borrow',
      capacity: 45,
      capacityNote: 'You have enough gear for about 45 borrows a week.',
      positionings: [
        { id: 'local', title: 'Low-cost local rentals', emoji: '🏘️', blurb: 'Neighbours lend gear they don’t use, for a small fee.', unitCost: -3, trust: -0.05, segmentFit: { students: 0.03 }, describe: 'helps neighbours lend unused sports gear for a small fee' },
        { id: 'bookahead', title: 'Book-ahead rentals', emoji: '🗓️', blurb: 'Clean, checked gear you reserve for a fixed time.', unitCost: 4, trust: 0.08, segmentFit: { families: 0.03, groups: 0.03 }, describe: 'lets people book clean, checked sports gear for a fixed time' }
      ],
      segments: [
        { id: 'students', name: 'School students', short: 'students', emoji: '🎒', who: 'Kids who want to play after school', population: 900, needRate: 0.3, baseConversion: 0.14, priceTolerance: 40, priceSensitivity: 0.5, trustNeed: 0.3, retention: 0.4, mustHave: null, alternative: 'Borrow from a friend, if they say yes', spend: '₹20–40' },
        { id: 'families', name: 'Parents in the colony', short: 'parents', emoji: '👨‍👩‍👧', who: 'Parents of young players', population: 700, needRate: 0.2, baseConversion: 0.11, priceTolerance: 70, priceSensitivity: 0.3, trustNeed: 0.6, retention: 0.35, mustHave: 'verified', alternative: 'Buy new gear for ₹800 or more', spend: '₹50–80' },
        { id: 'groups', name: 'Weekend sports groups', short: 'sports groups', emoji: '🏸', who: 'Friends who play every weekend', population: 150, needRate: 0.6, baseConversion: 0.1, priceTolerance: 90, priceSensitivity: 0.2, trustNeed: 0.45, retention: 0.55, mustHave: 'reserve', alternative: 'Every player brings their own kit', spend: '₹60–100' }
      ],
      competitor: 'A sports shop 4 km away sells new gear. Nobody nearby rents it out yet.',
      core: { id: 'list', name: 'Gear list', cost: 300, benefit: 'Shows what gear is free to borrow nearby.' },
      features: [
        { id: 'reserve', name: 'Book a slot', icon: '🗓️', cost: 500, benefit: 'Pick a day and time; the gear is kept for you.', fit: { students: 0.05, families: 0.04, groups: 0.08 }, trust: 0.05, usability: 0.1, preview: { action: 'Book for Saturday', detail: '🗓️ Sat, 4–6 pm slot' } },
        { id: 'verified', name: 'Checked owners & clean gear', icon: '✅', cost: 600, benefit: 'Every owner and item is checked before listing.', fit: { students: 0.01, families: 0.05, groups: 0.03 }, trust: 0.35, preview: { badge: '✓ Checked' } },
        { id: 'reviews', name: 'Ratings & reviews', icon: '⭐', cost: 300, benefit: 'Borrowers rate the gear and the owner.', fit: { students: 0.02, families: 0.03, groups: 0.03 }, trust: 0.2, preview: { meta: '★ 4.6 · 12 reviews', review: '“Bat was clean and on time.” – Rohit' } },
        { id: 'payment', name: 'Pay online (UPI)', icon: '📲', cost: 400, benefit: 'Pay when you book. No cash needed.', requires: ['reserve'], fit: { students: 0, families: 0.03, groups: 0.05 }, trust: 0.05, usability: 0.05, preview: { step: 'pay' } },
        { id: 'delivery', name: 'Doorstep delivery', icon: '🛵', cost: 800, benefit: 'A helper drops the gear at your door.', perOrder: 12, capacity: -6, fit: { students: 0.01, families: 0.05, groups: 0.01 }, preview: { detail: '🛵 Delivered to your door' } },
        { id: 'discount', name: 'First-borrow discount', icon: '🏷️', cost: 200, benefit: '20% off the first time someone borrows.', newCustomerDiscount: 0.2, fit: { students: 0.02, families: 0.01, groups: 0 }, preview: { banner: '20% off your first borrow!' } }
      ],
      preview: {
        app: 'Borrow nearby',
        items: [
          { name: 'Cricket bat', emoji: '🏏', sub: 'Owner: Rohit · 300 m away' },
          { name: 'Football', emoji: '⚽', sub: 'Owner: Sana · 450 m away' },
          { name: 'Badminton set', emoji: '🏸', sub: 'Owner: Mr Iyer · 600 m away' }
        ],
        coreAction: 'Message the owner',
        coreActionFeedback: 'Without booking, people must message the owner and wait. Add “Book a slot” to make this one tap.',
        done: 'Booked! Pick up the bat on Saturday at 4 pm.'
      },
      testers: [
        { id: 'kabir', name: 'Kabir', initials: 'K', tone: 'teal', segmentId: 'students', needs: ['reserve'], stopAt: 'action', fix: 'reserve', drop: 'I want it for Saturday, but I can’t book it. I’ll ask my cousin again.', happy: 'I booked a bat for Saturday in two taps!' },
        { id: 'fernandes', name: 'Mrs Fernandes', initials: 'F', tone: 'rose', segmentId: 'families', needs: ['verified', 'reviews'], stopAt: 'view', fix: 'verified', drop: 'How do I know this helmet is clean and safe? I’m not sure.', happy: 'Checked gear with good reviews. I feel safe letting my son use it.' },
        { id: 'imran', name: 'Coach Imran', initials: 'I', tone: 'amber', segmentId: 'groups', needs: ['payment'], stopAt: 'pay', fix: 'payment', drop: 'I need 8 rackets. Collecting cash from everyone is a headache.', happy: 'I booked and paid for 8 rackets at once. Easy!' }
      ],
      fallbackWeakness: { text: 'Testers liked it, but one said the first screen had too many words.', fix: 'simplify' },
      prices: [
        { id: 'low', amount: 25, label: 'Pocket-friendly' },
        { id: 'mid', amount: 45, label: 'Middle' },
        { id: 'high', amount: 80, label: 'Premium' }
      ],
      priceUnit: 'per 2-hour borrow',
      channels: [
        { id: 'friends', name: 'Class groups & friends', icon: '💬', cost: 200, reach: 350, round2: 1.2, match: { students: 0.9, families: 0.25, groups: 0.35 }, blurb: 'Students share it fast. Word spreads in week 2.' },
        { id: 'posters', name: 'Posters at school & the park', icon: '📌', cost: 400, reach: 600, round2: 0.85, match: { students: 0.6, families: 0.45, groups: 0.5 }, blurb: 'Lots of people see it. Fewer notice it the second week.' },
        { id: 'rwa', name: 'Colony notice board & RWA group', icon: '📋', cost: 300, reach: 450, round2: 1, match: { students: 0.2, families: 0.85, groups: 0.6 }, blurb: 'Parents and grown-ups read it closely.' }
      ],
      events: [
        {
          id: 'cracked', title: 'A cricket bat comes back cracked!', text: 'The owner is upset. The borrower says the bat was already old.', icon: '💥',
          responses: [
            { id: 'fix', label: 'Pay to fix it, and add a small deposit rule', cost: 200, conversion: 0.02, experience: 0.15, quality: 'good', note: 'Owners trust you more, and borrowers take better care.' },
            { id: 'split', label: 'Ask both of them to share the cost', cost: 0, conversion: 0, experience: 0, quality: 'ok', note: 'Fair, but nobody feels fully looked after.' },
            { id: 'ignore', label: 'Stay out of it', cost: 0, conversion: -0.04, experience: -0.25, quality: 'poor', note: 'Two owners stop lending. Word gets around.' }
          ]
        },
        {
          id: 'rival', title: 'A sports shop starts renting gear at ₹30!', text: 'Some of your customers are asking why you cost more.', icon: '🏬',
          responses: [
            { id: 'focus', label: 'Show what makes you different: close to home and checked', cost: 150, conversion: 0.02, experience: 0.05, quality: 'good', note: 'People remember why they chose you.' },
            { id: 'match', label: 'Drop your price to ₹30', cost: 0, priceTo: 30, conversion: 0, experience: 0, quality: 'ok', note: 'You keep customers, but earn less per borrow.' },
            { id: 'nothing', label: 'Do nothing', cost: 0, conversion: -0.04, experience: -0.05, quality: 'poor', note: 'Some customers try the shop instead.' }
          ]
        }
      ],
      personas: [
        {
          id: 'riya', name: 'Riya', initials: 'R', tone: 'blue', role: 'Class 7, loves football', segmentId: 'students', researchValue: 1,
          intro: 'I play football every evening, but our ball keeps going flat.',
          answers: {
            past: { text: 'Last week I borrowed a ball from my neighbour. I had to wait two days for him to be home.', chips: ['Borrows often', 'Waits days'], hint: 'reserve' },
            money: { text: 'I get ₹100 a week. I could spend ₹30 or ₹40 to borrow a good ball.', chips: ['Budget ₹40'], budget: 40 },
            leading: { text: 'An app? Sure, that sounds cool!', chips: ['Polite yes'] }
          }
        },
        {
          id: 'mrsfernandes', name: 'Mrs Fernandes', initials: 'F', tone: 'rose', role: 'Parent of a 9-year-old', segmentId: 'families', researchValue: 1,
          intro: 'My son wants to try cricket. I don’t want to buy a full kit yet.',
          answers: {
            past: { text: 'Last month we borrowed a helmet. It smelled bad and the strap was broken. I worried about safety.', chips: ['Worries about safety', 'Wants clean gear'], hint: 'verified' },
            money: { text: 'A new kit costs ₹1,500. I would pay ₹60–70 to borrow a clean, safe one.', chips: ['Budget ₹70'], budget: 70 },
            leading: { text: 'Yes, I suppose that could be nice.', chips: ['Polite yes'] }
          }
        },
        {
          id: 'imran', name: 'Imran', initials: 'I', tone: 'amber', role: 'Runs a weekend badminton group', segmentId: 'groups', researchValue: 1,
          intro: 'Ten of us play every Sunday. Someone always forgets a racket.',
          answers: {
            past: { text: 'Last Sunday three people had no racket. We lost half an hour. I would book a set in advance if I could.', chips: ['Needs it weekly', 'Wants to book ahead'], hint: 'reserve' },
            money: { text: 'We would pay ₹80–100 for a set, if it is ready on time and easy to pay for.', chips: ['Budget ₹90', 'Wants easy payment'], budget: 90, hint: 'payment' },
            leading: { text: 'Maybe. We would have to see.', chips: ['Not sure'] }
          }
        },
        {
          id: 'tanvi', name: 'Tanvi', initials: 'T', tone: 'violet', role: 'Your best friend', segmentId: null, researchValue: 0.2, nonCustomer: true,
          intro: 'I think everything you make is amazing!',
          answers: {
            past: { text: 'Hmm… I don’t really play sports. I can’t remember the last time.', chips: ['Not a player', 'Would not use it'] },
            money: { text: 'I wouldn’t pay for it, but I’d tell everyone it’s great!', chips: ['Would not pay'] },
            leading: { text: 'Yes!! It’s the best idea ever!', chips: ['Very polite yes'] }
          }
        },
        {
          id: 'mrgupta', name: 'Mr Gupta', initials: 'G', tone: 'slate', role: 'Owns a full cricket kit', segmentId: 'families', researchValue: 0.7,
          intro: 'I have a kit from college lying in a cupboard.',
          answers: {
            past: { text: 'A neighbour borrowed my bat once and returned it cracked. I want to know who is borrowing.', chips: ['Owner worries', 'Wants checked borrowers'], hint: 'verified' },
            money: { text: 'I would lend it if I earn ₹20–30 each time and it comes back safe.', chips: ['Owners want ₹20–30'] },
            leading: { text: 'I guess, if it’s safe.', chips: ['Polite yes'] }
          }
        }
      ]
    },

    /* ======================================================= SNACKSTOP */
    {
      id: 'snackstop',
      title: 'SnackStop',
      emoji: '🥪',
      kind: 'Pre-order snacks for break',
      problem: 'Snacks run out at break time.',
      story: { who: 'Meera', role: 'Class 7', initials: 'M', tone: 'amber', line: 'By the time I reach the canteen, the samosas are gone!' },
      helps: 'students and teachers who lose their short break in the canteen queue',
      questions: { past: 'Tell me about your last break. What did you eat?', money: 'How much do you spend on snacks at school?', leading: 'Wouldn’t pre-ordering snacks be so cool?' },
      defaultName: 'SnackStop',
      nameIdeas: ['SnackStop', 'Break Box', 'QuickBite'],
      town: { name: 'Sunrise Public School', type: 'school', population: 1500 },
      startingCash: 2500,
      baseUnitCost: 12,
      unitLabel: 'snack',
      capacity: 80,
      capacityNote: 'Your kitchen partner can pack about 80 snacks a week.',
      positionings: [
        { id: 'healthy', title: 'Healthy snack boxes', emoji: '🥗', blurb: 'Fruit, chana chaat, sprout bhel and sandwiches.', unitCost: 3, trust: 0.08, segmentFit: { juniors: 0.02, teachers: 0.04 }, describe: 'delivers healthy snack boxes that are ready at break' },
        { id: 'quick', title: 'Quick favourites, ready at break', emoji: '🥟', blurb: 'Samosa, vada pav and juice, packed and waiting.', unitCost: 0, trust: 0, segmentFit: { seniors: 0.03, juniors: 0.01 }, describe: 'has favourite snacks packed and waiting at break' }
      ],
      segments: [
        { id: 'juniors', name: 'Class 6–8 students', short: 'younger students', emoji: '🧒', who: 'Younger students with small budgets', population: 650, needRate: 0.35, baseConversion: 0.14, priceTolerance: 30, priceSensitivity: 0.5, trustNeed: 0.45, retention: 0.45, mustHave: 'labels', alternative: 'Wait in the canteen queue', spend: '₹20–30' },
        { id: 'seniors', name: 'Class 9–12 students', short: 'older students', emoji: '🧑‍🎓', who: 'Busy students who hate queues', population: 550, needRate: 0.45, baseConversion: 0.14, priceTolerance: 40, priceSensitivity: 0.55, trustNeed: 0.25, retention: 0.5, mustHave: 'preorder', alternative: 'Skip the snack or bring chips', spend: '₹30–40' },
        { id: 'teachers', name: 'Teachers and staff', short: 'teachers', emoji: '🧑‍🏫', who: 'Teachers stuck in the staff room', population: 120, needRate: 0.55, baseConversion: 0.19, priceTolerance: 55, priceSensitivity: 0.2, trustNeed: 0.4, retention: 0.6, mustHave: 'classroom', alternative: 'Send a helper to the canteen', spend: '₹40–60' }
      ],
      competitor: 'The school canteen sells snacks for ₹15–30, but the queue takes 10 minutes.',
      core: { id: 'menu', name: 'Simple menu page', cost: 300, benefit: 'Shows today’s snacks and prices.' },
      features: [
        { id: 'preorder', name: 'Pre-order before break', icon: '⏰', cost: 500, benefit: 'Order in the morning; it’s ready at break.', fit: { juniors: 0.04, seniors: 0.07, teachers: 0.04 }, usability: 0.1, preview: { action: 'Pre-order for break', detail: '⏰ Ready at 11:00 break' } },
        { id: 'counter', name: 'Skip-the-queue pickup counter', icon: '🏃', cost: 400, benefit: 'A small counter just for pre-orders.', conflicts: ['classroom'], conflictReason: 'You can either have a pickup counter or deliver to classes, not both.', fit: { juniors: 0.03, seniors: 0.05, teachers: 0.01 }, usability: 0.1, preview: { detail: '🏃 Pickup counter, no queue' } },
        { id: 'classroom', name: 'Deliver to the classroom', icon: '🚪', cost: 700, benefit: 'Helpers bring orders to the classroom door.', conflicts: ['counter'], conflictReason: 'You can either deliver to classes or have a pickup counter, not both.', perOrder: 4, capacity: -15, fit: { juniors: 0.02, seniors: 0.02, teachers: 0.08 }, preview: { detail: '🚪 Delivered to your class' } },
        { id: 'labels', name: 'Healthy & allergy labels', icon: '🥗', cost: 300, benefit: 'Shows what’s inside, like nuts or gluten.', trust: 0.3, fit: { juniors: 0.03, seniors: 0.01, teachers: 0.03 }, preview: { badge: '🥜 Allergy info' } },
        { id: 'wallet', name: 'Class wallet (UPI top-up)', icon: '📲', cost: 500, benefit: 'Parents top up once; kids order without cash.', requires: ['preorder'], trust: 0.05, usability: 0.05, fit: { juniors: 0.03, seniors: 0.02, teachers: 0.03 }, preview: { step: 'pay' } },
        { id: 'combo', name: 'Combo deals', icon: '🍱', cost: 200, benefit: 'Snack + drink together, for ₹10 more.', orderValueAdd: 10, perOrder: 6, fit: { juniors: 0.01, seniors: 0.03, teachers: 0 }, preview: { banner: 'Combo: snack + juice, just ₹10 more!' } }
      ],
      preview: {
        app: 'Today’s snacks',
        items: [
          { name: 'Veg sandwich', emoji: '🥪', sub: 'Ready by 11:00' },
          { name: 'Samosa (2 pcs)', emoji: '🥟', sub: 'Ready by 11:00' },
          { name: 'Fruit cup', emoji: '🍉', sub: 'Ready by 11:00' }
        ],
        coreAction: 'Join the queue at break',
        coreActionFeedback: 'Without pre-ordering, students still stand in the queue. Add “Pre-order before break” to fix this.',
        done: 'Order placed! Collect your sandwich at break.'
      },
      testers: [
        { id: 'meera', name: 'Meera', initials: 'M', tone: 'amber', segmentId: 'juniors', needs: ['labels'], stopAt: 'view', fix: 'labels', drop: 'Mum asks if it has peanuts. I can’t tell from here.', happy: 'It says “no peanuts”. Mum will be happy!' },
        { id: 'dev', name: 'Dev', initials: 'D', tone: 'blue', segmentId: 'seniors', needs: ['preorder'], stopAt: 'action', fix: 'preorder', drop: 'I still have to stand in the queue to order? Then what’s new?', happy: 'Ordered in class. Picked it up in 30 seconds!' },
        { id: 'kapoor', name: 'Ms Kapoor', initials: 'K', tone: 'violet', segmentId: 'teachers', needs: ['classroom', 'wallet'], stopAt: 'pay', fix: 'classroom', drop: 'I can’t leave the staff room at break, and I never have change.', happy: 'It came to the staff room, and I didn’t need cash.' }
      ],
      fallbackWeakness: { text: 'Testers liked it, but one said the menu was hard to read quickly.', fix: 'simplify' },
      prices: [
        { id: 'low', amount: 20, label: 'Pocket-friendly' },
        { id: 'mid', amount: 35, label: 'Middle' },
        { id: 'high', amount: 55, label: 'Premium' }
      ],
      priceUnit: 'per snack',
      channels: [
        { id: 'monitors', name: 'Class monitors tell their classes', icon: '🙋', cost: 150, reach: 500, round2: 1.1, match: { juniors: 0.7, seniors: 0.7, teachers: 0.1 }, blurb: 'Cheap and friendly. Reaches students, not staff.' },
        { id: 'posters', name: 'Posters by the canteen', icon: '📌', cost: 250, reach: 700, round2: 0.8, match: { juniors: 0.5, seniors: 0.45, teachers: 0.3 }, blurb: 'Everyone walks past. Not everyone reads it.' },
        { id: 'assembly', name: 'Morning assembly announcement', icon: '📣', cost: 500, reach: 1100, round2: 0.7, match: { juniors: 0.55, seniors: 0.5, teachers: 0.8 }, blurb: 'The whole school hears it once.' }
      ],
      events: [
        {
          id: 'late', title: 'Your supplier is 30 minutes late on Monday!', text: 'Break starts in 5 minutes and the snacks aren’t here.', icon: '⏳',
          responses: [
            { id: 'refund', label: 'Say sorry and refund every order', cost: 200, conversion: 0.01, experience: 0.2, quality: 'good', note: 'Customers are disappointed but trust you more.' },
            { id: 'swap', label: 'Hand out fruit cups instead', cost: 120, conversion: 0, experience: 0.05, quality: 'ok', note: 'Some kids are happy, some wanted their samosa.' },
            { id: 'quiet', label: 'Say nothing and hope nobody minds', cost: 0, conversion: -0.04, experience: -0.3, quality: 'poor', note: 'Hungry customers tell their friends.' }
          ]
        },
        {
          id: 'canteen', title: 'The canteen opens its own fast queue!', text: 'Now the canteen line moves faster too.', icon: '🏪',
          responses: [
            { id: 'focus', label: 'Remind people what’s special: order ahead, ready on time', cost: 100, conversion: 0.02, experience: 0.05, quality: 'good', note: 'Your regulars stay with you.' },
            { id: 'cut', label: 'Cut your price by ₹5', cost: 0, priceDelta: -5, conversion: 0, experience: 0, quality: 'ok', note: 'More people stay, but you earn less per snack.' },
            { id: 'nothing', label: 'Do nothing', cost: 0, conversion: -0.04, experience: -0.05, quality: 'poor', note: 'Some customers drift back to the canteen.' }
          ]
        }
      ],
      personas: [
        {
          id: 'aarav', name: 'Aarav', initials: 'A', tone: 'blue', role: 'Class 10 student', segmentId: 'seniors', researchValue: 1,
          intro: 'Break is 20 minutes. I spend 12 of them in the queue.',
          answers: {
            past: { text: 'Yesterday I waited 10 minutes and the samosas ran out. I bought chips instead. I’d order in the morning if I could.', chips: ['Daily problem', 'Wants to order ahead'], hint: 'preorder' },
            money: { text: 'I spend ₹30–40 at break, most days.', chips: ['Budget ₹40'], budget: 40 },
            leading: { text: 'Yeah, sure, sounds good.', chips: ['Polite yes'] }
          }
        },
        {
          id: 'priya', name: 'Priya', initials: 'P', tone: 'teal', role: 'Class 6 student', segmentId: 'juniors', researchValue: 1,
          intro: 'I have a nut allergy, so I can’t eat everything.',
          answers: {
            past: { text: 'Last Friday I couldn’t tell if the cutlet had peanuts, so I skipped lunch. Mum gets worried.', chips: ['Needs allergy info', 'Parents decide'], hint: 'labels' },
            money: { text: 'Mum gives me ₹25 a day for snacks.', chips: ['Budget ₹25'], budget: 25 },
            leading: { text: 'Okay! I like snacks.', chips: ['Polite yes'] }
          }
        },
        {
          id: 'mrdsouza', name: 'Mr D’Souza', initials: 'D', tone: 'amber', role: 'Maths teacher', segmentId: 'teachers', researchValue: 1,
          intro: 'Break is when I check homework, so I rarely eat.',
          answers: {
            past: { text: 'Today I sent a student to buy my tea and sandwich. He came back after the bell. I’d love it brought to the staff room.', chips: ['Can’t leave room', 'Wants delivery'], hint: 'classroom' },
            money: { text: 'I would happily pay ₹50 for a good sandwich and tea.', chips: ['Budget ₹50'], budget: 50 },
            leading: { text: 'Hmm, could be useful, I suppose.', chips: ['Not sure'] }
          }
        },
        {
          id: 'kiran', name: 'Kiran', initials: 'K', tone: 'violet', role: 'Brings lunch from home', segmentId: null, researchValue: 0.2, nonCustomer: true,
          intro: 'My dadi packs my tiffin every day.',
          answers: {
            past: { text: 'I can’t remember buying from the canteen. I always have my tiffin.', chips: ['Doesn’t buy snacks'] },
            money: { text: 'I don’t spend money at school.', chips: ['Would not pay'] },
            leading: { text: 'Yes! Great idea! Everyone will love it!', chips: ['Very polite yes'] }
          }
        },
        {
          id: 'sneha', name: 'Sneha', initials: 'S', tone: 'rose', role: 'Class 9, very busy', segmentId: 'seniors', researchValue: 0.8,
          intro: 'I have club meetings at break, so I eat on the go.',
          answers: {
            past: { text: 'This week I missed snacks three times. When I do buy, I never have change.', chips: ['Misses snacks', 'No cash on hand'], hint: 'wallet' },
            money: { text: 'I’d pay ₹35, maybe ₹40 for a combo with juice.', chips: ['Budget ₹40', 'Likes combos'], budget: 40, hint: 'combo' },
            leading: { text: 'I mean, yes?', chips: ['Polite yes'] }
          }
        }
      ]
    },

    /* ========================================================= GIFTBOX */
    {
      id: 'giftbox',
      title: 'GiftBox',
      emoji: '🎁',
      kind: 'Thoughtful gifts',
      problem: 'Good gifts are hard to find.',
      story: { who: 'Arjun', role: 'Class 9', initials: 'A', tone: 'rose', line: 'My friend’s birthday is Friday. I have ₹200 and no idea what to buy.' },
      helps: 'people who want a thoughtful gift that fits their budget',
      questions: { past: 'Tell me about the last gift you bought.', money: 'How much do you usually spend on a gift?', leading: 'Wouldn’t a gift shop like mine be great?' },
      defaultName: 'GiftBox',
      nameIdeas: ['GiftBox', 'Little Joys', 'WrapIt'],
      town: { name: 'Lakeview', type: 'town', population: 5000 },
      startingCash: 3000,
      baseUnitCost: 50,
      unitLabel: 'gift',
      capacity: 15,
      capacityNote: 'You and your helpers can make about 15 gifts a week.',
      positionings: [
        { id: 'personal', title: 'Personalised gifts', emoji: '✏️', blurb: 'Mugs, bookmarks and cards with a name or photo.', unitCost: 5, trust: 0, segmentFit: { students: 0.03, classes: 0.02 }, describe: 'makes personalised gifts with a name or photo' },
        { id: 'eco', title: 'Eco-friendly gift boxes', emoji: '🌿', blurb: 'Seed-paper cards, jute bags and small plants.', unitCost: 8, trust: 0.05, segmentFit: { parents: 0.03, classes: 0.02 }, describe: 'makes eco-friendly gift boxes with plants and seed-paper cards' }
      ],
      segments: [
        { id: 'students', name: 'Students buying for friends', short: 'students', emoji: '🎂', who: 'Students with pocket money', population: 800, needRate: 0.25, baseConversion: 0.12, priceTolerance: 180, priceSensitivity: 0.5, trustNeed: 0.3, retention: 0.25, mustHave: 'finder', alternative: 'Chocolates from the corner shop', spend: '₹120–200' },
        { id: 'parents', name: 'Parents buying return gifts', short: 'parents', emoji: '🎈', who: 'Parents planning birthday parties', population: 500, needRate: 0.3, baseConversion: 0.1, priceTolerance: 250, priceSensitivity: 0.3, trustNeed: 0.55, retention: 0.3, mustHave: 'photos', alternative: 'A big shop in the mall, far away', spend: '₹150–300' },
        { id: 'classes', name: 'Class groups (Teachers’ Day, farewells)', short: 'class groups', emoji: '👩‍🏫', who: 'A class collecting money for one gift', population: 60, needRate: 0.7, baseConversion: 0.1, priceTolerance: 500, priceSensitivity: 0.2, trustNeed: 0.5, retention: 0.2, mustHave: 'payment', alternative: 'One person rushes to a shop the night before', spend: '₹400–600' }
      ],
      competitor: 'The mall gift shop has lots of choice, but it is 30 minutes away.',
      core: { id: 'catalogue', name: 'Gift catalogue', cost: 400, benefit: 'Photos and prices of your gifts.' },
      features: [
        { id: 'personalise', name: 'Add a name or photo', icon: '✏️', cost: 600, benefit: 'Print a name or photo on the gift.', perOrder: 15, conflicts: ['express'], conflictReason: 'Name gifts take two days to make, so they can’t be same-day.', fit: { students: 0.06, parents: 0.03, classes: 0.06 }, preview: { detail: '✏️ Add a name: “Happy B’day Ishaan”' } },
        { id: 'finder', name: 'Gift finder by budget', icon: '🔎', cost: 400, benefit: 'Tap your budget and see gifts that fit.', usability: 0.15, fit: { students: 0.05, parents: 0.03, classes: 0.02 }, preview: { banner: 'Gifts under ₹200 →' } },
        { id: 'photos', name: 'Photos of real orders', icon: '📷', cost: 300, benefit: 'See what past customers actually got.', trust: 0.3, fit: { students: 0.02, parents: 0.05, classes: 0.03 }, preview: { meta: '📷 40 real order photos' } },
        { id: 'wrap', name: 'Gift wrap & a handwritten note', icon: '🎀', cost: 200, benefit: 'Arrives wrapped, with a short note.', perOrder: 8, fit: { students: 0.03, parents: 0.02, classes: 0.03 }, preview: { badge: '🎀 Gift wrapped' } },
        { id: 'express', name: 'Same-day delivery', icon: '🚚', cost: 900, benefit: 'Order by noon, delivered by evening.', perOrder: 20, capacity: -6, conflicts: ['personalise'], conflictReason: 'Same-day delivery can’t include name gifts, which take two days.', fit: { students: 0.02, parents: 0.05, classes: 0.03 }, preview: { detail: '🚚 Arrives today' } },
        { id: 'payment', name: 'Pay online (UPI)', icon: '📲', cost: 500, benefit: 'Pay by UPI. Groups can split it.', trust: 0.1, usability: 0.05, fit: { students: 0.01, parents: 0.03, classes: 0.06 }, preview: { step: 'pay' } }
      ],
      preview: {
        app: 'Find a gift',
        items: [
          { name: 'Name bookmark', emoji: '🔖', sub: 'Ready in 2 days' },
          { name: 'Mini plant + card', emoji: '🪴', sub: 'Ready in 2 days' },
          { name: 'Photo mug', emoji: '☕', sub: 'Ready in 2 days' }
        ],
        coreAction: 'Call to order',
        coreActionFeedback: 'People must call you to order, and many won’t. Online payment or a gift finder makes ordering easier.',
        done: 'Order placed! Your gift will be ready in 2 days.'
      },
      testers: [
        { id: 'arjun', name: 'Arjun', initials: 'A', tone: 'rose', segmentId: 'students', needs: ['finder'], stopAt: 'browse', fix: 'finder', drop: 'So many things! Which ones fit my ₹200? I give up.', happy: 'I tapped “under ₹200” and found the perfect one.' },
        { id: 'mrsrao', name: 'Mrs Rao', initials: 'R', tone: 'teal', segmentId: 'parents', needs: ['photos'], stopAt: 'view', fix: 'photos', drop: 'Will it look like the picture? I need 15 of these for a party.', happy: 'Real photos from other parents. I’ll order 15.' },
        { id: 'zoya', name: 'Zoya', initials: 'Z', tone: 'violet', segmentId: 'classes', needs: ['payment'], stopAt: 'pay', fix: 'payment', drop: '35 classmates are sending money. I need one easy way to pay.', happy: 'Everyone paid by UPI. The gift is booked!' }
      ],
      fallbackWeakness: { text: 'Testers liked it, but one said it took too many taps to order.', fix: 'simplify' },
      prices: [
        { id: 'low', amount: 120, label: 'Pocket-friendly', unitCostAdd: 0, note: 'Simple gift' },
        { id: 'mid', amount: 220, label: 'Middle', unitCostAdd: 30, note: 'Nicer materials' },
        { id: 'high', amount: 400, label: 'Premium', unitCostAdd: 110, note: 'Big, premium gift' }
      ],
      priceUnit: 'per gift',
      channels: [
        { id: 'friends', name: 'Instagram & class groups', icon: '💬', cost: 200, reach: 450, round2: 1.2, match: { students: 0.85, parents: 0.1, classes: 0.5 }, blurb: 'Students share pretty photos. Parents rarely see it.' },
        { id: 'stall', name: 'Stall at the school fair', icon: '🎪', cost: 600, reach: 700, round2: 0.6, match: { students: 0.55, parents: 0.6, classes: 0.55 }, blurb: 'People see and touch the gifts. Only one weekend.' },
        { id: 'society', name: 'Society notice & parents’ groups', icon: '📋', cost: 300, reach: 500, round2: 1, match: { students: 0.15, parents: 0.85, classes: 0.3 }, blurb: 'Parents read it when planning parties.' }
      ],
      events: [
        {
          id: 'rush', title: 'Festival week! Everyone wants gifts, and supplies run short.', text: 'If orders come in, you may not finish them all on time.', icon: '🪔',
          responses: [
            { id: 'buy', label: 'Buy extra supplies quickly', cost: 400, capacity: 10, conversion: 0, experience: 0.05, quality: 'good', note: 'You can make more gifts this week.' },
            { id: 'limit', label: 'Take only the orders you can finish', cost: 0, conversion: 0, experience: 0.1, quality: 'ok', note: 'Fewer sales, but every gift is on time.' },
            { id: 'promise', label: 'Say yes to everyone and hope it works', cost: 0, capacity: 6, conversion: 0, experience: -0.35, quality: 'poor', note: 'Some gifts arrive late. Customers are upset.' }
          ]
        },
        {
          id: 'damaged', title: 'A customer posts: “My gift arrived with a broken corner!”', text: 'Other people can see the post.', icon: '📦',
          responses: [
            { id: 'redo', label: 'Say sorry and send a new one free', cost: 150, conversion: 0.01, experience: 0.2, quality: 'good', note: 'People see that you care.' },
            { id: 'coupon', label: 'Offer ₹50 off their next order', cost: 0, conversion: 0, experience: 0.05, quality: 'ok', note: 'Okay, but the customer still has a broken gift.' },
            { id: 'argue', label: 'Reply that it was the courier’s fault', cost: 0, conversion: -0.04, experience: -0.3, quality: 'poor', note: 'Others decide not to risk ordering.' }
          ]
        }
      ],
      personas: [
        {
          id: 'ishaan', name: 'Ishaan', initials: 'I', tone: 'blue', role: 'Class 9 student', segmentId: 'students', researchValue: 1,
          intro: 'There’s a birthday in my class almost every week.',
          answers: {
            past: { text: 'Last week I spent an hour in shops and still bought chocolates. I wanted something with my friend’s name on it.', chips: ['Buys often', 'Wants a personal touch'], hint: 'personalise' },
            money: { text: 'I can spend ₹100–150 on a friend’s gift.', chips: ['Budget ₹150'], budget: 150, hint: 'finder' },
            leading: { text: 'Cool, yeah.', chips: ['Polite yes'] }
          }
        },
        {
          id: 'mrsnair', name: 'Mrs Nair', initials: 'N', tone: 'teal', role: 'Mother planning a party', segmentId: 'parents', researchValue: 1,
          intro: 'My daughter’s party is next month. I need 15 return gifts.',
          answers: {
            past: { text: 'Last year I ordered gifts online and they looked cheaper than the photos. Now I only buy when I see real pictures.', chips: ['Wants real photos', 'Buys in bulk'], hint: 'photos' },
            money: { text: 'About ₹200–250 each is fine for return gifts.', chips: ['Budget ₹250'], budget: 250 },
            leading: { text: 'Maybe, it depends.', chips: ['Not sure'] }
          }
        },
        {
          id: 'zoya', name: 'Zoya', initials: 'Z', tone: 'violet', role: 'Class monitor, Class 12', segmentId: 'classes', researchValue: 1,
          intro: 'I collected money for our teacher’s farewell gift.',
          answers: {
            past: { text: 'Last time, 35 people paid me in coins and notes. I lost track and bought something at 9 pm. Online payment would have saved me.', chips: ['Group buying', 'Needs easy payment'], hint: 'payment' },
            money: { text: 'Our class spends ₹400–600 on one big gift.', chips: ['Budget ₹500'], budget: 500 },
            leading: { text: 'Sure, why not.', chips: ['Polite yes'] }
          }
        },
        {
          id: 'nani', name: 'Nani', initials: 'N', tone: 'amber', role: 'Your grandmother', segmentId: null, researchValue: 0.2, nonCustomer: true,
          intro: 'Beta, I’m proud of anything you do!',
          answers: {
            past: { text: 'I don’t buy gifts from shops. I make sweets for everyone.', chips: ['Makes her own gifts'] },
            money: { text: 'Why would I pay? I’ll just ask you!', chips: ['Would not pay'] },
            leading: { text: 'Of course! It’s wonderful!', chips: ['Very polite yes'] }
          }
        },
        {
          id: 'farhan', name: 'Farhan', initials: 'F', tone: 'rose', role: 'Class 11 student', segmentId: 'students', researchValue: 0.8,
          intro: 'I always remember birthdays at the last minute.',
          answers: {
            past: { text: 'Yesterday I remembered a birthday at night. Nothing could arrive on time, so I just sent a message.', chips: ['Last-minute buyer', 'Wants it fast'], hint: 'express' },
            money: { text: 'I’d pay ₹120 for something that arrives the same day.', chips: ['Budget ₹120'], budget: 120 },
            leading: { text: 'Yes, that’s nice.', chips: ['Polite yes'] }
          }
        }
      ]
    }
  ];

  // Improvement options in the Test Corner (fix/swap options are built from the weakness).
  var REVISIONS = {
    simplify: { id: 'simplify', label: 'Make it simpler', detail: 'Fewer words and one clear button on every screen.', cost: 0, usability: 0.15, icon: '✂️' },
    message: { id: 'message', label: 'Explain it better', detail: 'Add a short line saying who it’s for and why it helps.', cost: 0, usability: 0.05, trust: 0.05, icon: '💡' },
    keep: { id: 'keep', label: 'Keep it as it is', detail: 'Open as planned. You can learn from real customers.', cost: 0, icon: '👍' }
  };

  return {
    CONTENT_VERSION: CONTENT_VERSION,
    LAUNCH_RESERVE: LAUNCH_RESERVE,
    LOCATIONS: LOCATIONS,
    GRADES: GRADES,
    QUESTION_KINDS: QUESTION_KINDS,
    HINTS: HINTS,
    GLOSSARY: GLOSSARY,
    TERMS: TERMS,
    REASONS: REASONS,
    SCENARIOS: SCENARIOS,
    REVISIONS: REVISIONS
  };
});
