/* YOPPI Future Skills Lab: course catalogue.
   12 courses x 3 class bands = 36 grade-specific versions. Each version has five learning
   topics on YOPPI and one InScene mission that assesses them.
   Every course is in development: the catalogue is live, the courses are not yet playable.
   image = a file in assets/images/future-skills/ (<image>.webp 1600w, <image>-800.webp 800w). */
(function () {
  // Thumbnail art (shared with InScene). Alt text describes what is in each picture.
  var IMAGES = {
    'the-rs-600-canteen-challenge': 'A student committee compares snack packs and works out a budget at a school canteen table.',
    'the-online-sale-countdown': 'A student pauses to consider a headphone purchase beside a closed coin purse and face-down phone.',
    'the-exam-paper-rumour': 'A student studying at night turns away from a phone buzzing with a rumour.',
    'water-detectives': 'Students and an environmental scientist examine a water sample beside a green school pond.',
    'the-survey-that-lied': 'Students talk with a classmate in a school courtyard, one holding a clipboard.',
    'the-cricket-match-argument': 'A student calmly mediates between two groups of players during a school cricket match.',
    'forward-or-fact-check': 'A student pauses before forwarding an alarming message and checks an official source on a second screen.',
    'the-deepfake-has-40000-views': 'A student supports a worried friend who is looking at something upsetting on a phone.',
    'the-missing-library-book': 'Three students study a hand-drawn library map together in the school library.',
    'the-lemon-and-soap-mystery': 'Students in goggles add indicator drops to beakers and watch the colours change in a school lab.',
    'the-new-student-at-lunch': 'Students sit at tables in a busy school canteen at lunchtime.',
    'thirty-seconds-to-cross': 'A student on a busy street points friends toward the pedestrian crossing instead of crossing between cars.',
    'your-first-independent-month': 'A young person in a small rented room plans a monthly budget with a notebook and phone.',
    'the-rs-50000-virtual-portfolio': 'Students distribute counters across separate trays while discussing how to spread risk.',
    'should-the-school-go-solar': 'A student team measures a school rooftop beside solar panels.',
    'the-college-fest-one-night-left': 'A student team rearranges the programme the night before a school festival.',
    'digital-payment-fraud-report': 'An officer at a help desk reviews suspicious messages on a resident’s phone while taking notes.',
    'the-video-everyone-believes': 'Two students pause to check the source of a viral video on a phone instead of sharing it.',
    'design-the-play-space': 'Students and a designer arrange a miniature layout model in a school courtyard.',
    'you-are-the-product-manager': 'Young colleagues prioritise cards and review a plan with charts around a laptop.',
    'which-data-can-we-trust': 'Two students examine gaps in paper records and question a proposed conclusion.',
    'the-flooded-crossroads': 'Students with umbrellas study a map beside a busy, waterlogged crossroads.',
    'the-group-project-ghost': 'Four students around a table work out a fair plan to finish their project.',
    'the-antibiotic-resistance-puzzle': 'Senior students and a teacher discuss evidence laid out on a table.',
    'the-electricity-bill-that-does-not-add-up': 'A student team reads a meter and studies usage charts to find where costs are going.'
  };

  var AREAS = [
    { id: 'money', name: 'Money Sense', promise: 'Understand money today, and become financially independent tomorrow.' },
    { id: 'thinking', name: 'Smart Thinking', promise: 'Question information, think logically and make better decisions.' },
    { id: 'people', name: 'People Skills', promise: 'Build confidence in communication, collaboration, negotiation and leadership.' },
    { id: 'digital', name: 'Digital Power', promise: 'Live, create and stay safe in the connected world.' },
    { id: 'ai', name: 'AI Skills', promise: 'Understand AI, and use it well.' },
    { id: 'world', name: 'World Ready', promise: 'Understand how businesses, services and everyday systems work outside school.' }
  ];

  var BANDS = [
    { id: '6-8', label: 'Class 6–8' },
    { id: '9-10', label: 'Class 9–10' },
    { id: '11-12', label: 'Class 11–12' }
  ];

  var COURSES = [
    // ------------------------------------------------------------ Money Sense
    {
      id: 'M01', area: 'money', title: 'Money Made Simple',
      tagline: 'Spend, save and plan with the money you have.',
      levels: {
        '6-8': {
          topics: ['Needs versus wants in daily life', 'Pocket money, spending and saving', 'Planning a small budget with limited money', 'Comparing price, quantity and value', 'Handling surprise expenses without panic'],
          mission: 'The School Trip Budget',
          brief: 'You have ₹800 in a virtual wallet for a class day out. Choose travel, food and activities, respond to a surprise expense, and finish without ignoring essential needs.',
          decisions: ['Bus, shared auto or walk part of the way', 'Packed lunch, canteen or café', 'One activity ticket out of three', 'The entry fee goes up by ₹150'],
          skills: ['Prioritisation', 'Budget balance', 'Response to surprises'],
          image: 'the-rs-600-canteen-challenge'
        },
        '9-10': {
          topics: ['Income, expenses and cash flow', 'Fixed, variable and unexpected costs', 'Building a monthly student budget', 'Opportunity cost and delayed purchases', 'Tracking money and adjusting plans'],
          mission: 'A Month on Your Own',
          brief: 'Manage a fictional student’s monthly allowance through changing prices, social invitations and an urgent expense. Your choices affect savings, relationships and obligations.',
          decisions: ['Set the month’s spending plan', 'A friend’s birthday outing invitation', 'Bus fares rise mid-month', 'An urgent ₹1,200 phone repair'],
          skills: ['Cash-flow discipline', 'Trade-off reasoning', 'Plan revision'],
          image: 'your-first-independent-month'
        },
        '11-12': {
          topics: ['Payslips: CTC, deductions and take-home pay', 'Bank accounts, digital payments and records', 'Emergency funds and financial goals', 'Inflation and purchasing power', 'Building a realistic first-job budget'],
          mission: 'Your First Salary',
          brief: 'You have just joined a job in a new city. Read your first payslip, choose between two rentals, decide what to send home and handle an unexpected repair while keeping a workable month-end balance.',
          decisions: ['Work out the real take-home pay', 'Choose between two rentals', 'Decide what to send home each month', 'A bike repair in week three'],
          skills: ['Financial resilience', 'Long-term planning', 'Decision explanation'],
          image: 'the-online-sale-countdown'
        }
      }
    },
    {
      id: 'M02', area: 'money', title: 'Grow Your Money',
      tagline: 'Make money grow safely, and spot promises that are too good to be true.',
      levels: {
        '6-8': {
          topics: ['Why people save for future goals', 'How interest helps savings grow', 'Simple versus compound growth through visuals', 'Risk, reward and keeping money safe', 'Avoiding too-good-to-be-true promises'],
          mission: 'The Savings Challenge',
          brief: 'A fictional student wants to buy a bicycle in a year. Compare safe savings routes, respond to a tempting shortcut and make a plan that reaches the goal realistically.',
          decisions: ['Piggy bank, savings account or recurring deposit', 'A friend’s “double your money” scheme', 'Birthday money arrives', 'Check progress at six months'],
          skills: ['Long-term thinking', 'Risk awareness', 'Choice justification'],
          image: 'the-online-sale-countdown'
        },
        '9-10': {
          topics: ['Saving versus investing', 'Compounding, inflation and the role of time', 'Diversification and uncertainty', 'Recognising promises of guaranteed returns', 'Borrowing, interest and repayment basics'],
          mission: 'The Family Money Choice',
          brief: 'A virtual family has savings, an education goal four years away and three competing financial offers. Compare time horizons, borrowing costs and risks before deciding what to do with the money.',
          decisions: ['Compare a deposit, a market fund and a “guaranteed” scheme', 'Read a loan offer’s total repayment', 'A relative’s sure-shot tip', 'Explain the choice to the family'],
          skills: ['Risk-return understanding', 'Evidence use', 'Cost awareness'],
          image: 'the-rs-50000-virtual-portfolio'
        },
        '11-12': {
          topics: ['Inflation-adjusted returns and financial goals', 'Assets, diversification and investment time horizons', 'Credit scores, loans, EMIs and total repayment cost', 'Insurance as protection, not an investment promise', 'Recognising mis-selling, hidden fees and excessive risk'],
          mission: 'The ₹1 Lakh Decision',
          brief: 'Manage a fictional young adult’s ₹1 lakh across emergency needs, near-term fees, debt and investment options. New market and personal events reveal whether the strategy was balanced.',
          decisions: ['Build the emergency fund first, or not', 'Clear a credit card balance or invest', 'An insurance-plus-investment policy pitch', 'The market falls in month four'],
          skills: ['Portfolio suitability', 'Debt trade-offs', 'Risk control'],
          image: 'the-rs-50000-virtual-portfolio'
        }
      }
    },

    // --------------------------------------------------------- Smart Thinking
    {
      id: 'T01', area: 'thinking', title: 'Spot What’s True',
      tagline: 'Question information before you believe it or share it.',
      levels: {
        '6-8': {
          topics: ['Fact, opinion and guess: what is different?', 'Why rumours spread quickly', 'Clues that a claim may be wrong', 'Checking with more than one reliable source', 'Changing your mind when new facts appear'],
          mission: 'The School Rumour',
          brief: 'A surprising claim spreads through a fictional school. Examine messages and witnesses, decide what to share and decide whether there is enough evidence to conclude.',
          decisions: ['Read the first message closely', 'Question two classmates', 'Forward it, ask about it or wait', 'New evidence changes the story'],
          skills: ['Evidence checking', 'Responsible sharing', 'Willingness to revise'],
          image: 'the-exam-paper-rumour'
        },
        '9-10': {
          topics: ['Source credibility and conflicts of interest', 'Correlation versus cause', 'Misleading graphs and missing context', 'Confirmation bias in everyday choices', 'A simple step-by-step fact-checking method'],
          mission: 'The Viral Claim Desk',
          brief: 'You are on a student fact-checking team investigating a viral claim about exam performance. Different charts and sources arrive; choose what can be published and what must remain uncertain.',
          decisions: ['Trace the claim to its source', 'Read a chart with a cut-off axis', 'Separate correlation from cause', 'Publish, hold or label as unverified'],
          skills: ['Source evaluation', 'Data interpretation', 'Uncertainty handling'],
          image: 'forward-or-fact-check'
        },
        '11-12': {
          topics: ['Claims, assumptions and strength of evidence', 'Sampling, selection bias and base rates', 'Reading statistics beyond headlines', 'Causal reasoning and alternative explanations', 'Arguing fairly while updating conclusions'],
          mission: 'The Boardroom Brief',
          brief: 'A fictional organisation must decide whether to launch a student service based on a persuasive but incomplete report. Interrogate the data, challenge weak conclusions and recommend an evidence-based decision.',
          decisions: ['Check who the survey actually asked', 'Find the missing base rate', 'Offer an alternative explanation', 'Recommend launch, pilot or pause'],
          skills: ['Critical analysis', 'Counterarguments', 'Decision calibration'],
          image: 'which-data-can-we-trust'
        }
      }
    },
    {
      id: 'T02', area: 'thinking', title: 'Solve the Real Problem',
      tagline: 'Find the real cause before choosing a fix.',
      levels: {
        '6-8': {
          topics: ['The difference between a problem and a symptom', 'Asking useful why-questions', 'Understanding who is affected', 'Generating several possible solutions', 'Testing a small improvement and learning from it'],
          mission: 'The Missing Water Mystery',
          brief: 'A fictional school is wasting water every day. Interview characters, inspect clues and select a fix before deciding how to tell if the change worked.',
          decisions: ['Interview the caretaker, cook and students', 'Inspect taps, tanks and pipes', 'Pick a fix from three options', 'Decide how to check it worked'],
          skills: ['Root-cause thinking', 'Stakeholder awareness', 'Solution testing'],
          image: 'water-detectives'
        },
        '9-10': {
          topics: ['Defining a clear problem statement', 'Root causes versus visible symptoms', 'Using simple data and patterns', 'Comparing solutions by impact and effort', 'Testing assumptions before scaling a solution'],
          mission: 'Fix the Lunch Queue',
          brief: 'A school canteen has long queues, frustrated students and limited staff. Diagnose the bottleneck from timed observations and choose interventions that balance cost and fairness.',
          decisions: ['Read the timed queue observations', 'Name the real bottleneck', 'Pre-orders, a second counter or staggered breaks', 'Run a one-week trial'],
          skills: ['Problem framing', 'Option comparison', 'Experiment design'],
          image: 'the-rs-600-canteen-challenge'
        },
        '11-12': {
          topics: ['Systems thinking and unintended consequences', 'Decision-making with incomplete information', 'Trade-offs, constraints and second-order effects', 'Simple hypotheses and experiments', 'Communicating an evidence-backed recommendation'],
          mission: 'The City Traffic Decision',
          brief: 'You advise a fictional city team facing congestion near a college. New evidence, resident reactions and budget limits appear as you choose and adapt a traffic intervention.',
          decisions: ['Map who is affected and how', 'Choose an intervention within budget', 'Residents push back', 'Adapt after the first month’s data'],
          skills: ['Systems reasoning', 'Trade-off management', 'Adaptability'],
          image: 'the-flooded-crossroads'
        }
      }
    },

    // ---------------------------------------------------------- People Skills
    {
      id: 'P01', area: 'people', title: 'Speak So People Listen',
      tagline: 'Say it clearly, listen well and handle questions calmly.',
      levels: {
        '6-8': {
          topics: ['Listening before replying', 'Explaining an idea in a simple order', 'Using examples instead of vague words', 'Asking questions to clear confusion', 'Tone, body language and kindness'],
          mission: 'The Group Announcement',
          brief: 'Help a fictional classmate explain a changed sports-day plan to different groups. Choose words, sequencing and responses until everybody understands the important information.',
          decisions: ['Put the new plan in a clear order', 'Explain it to younger students', 'Answer a worried classmate', 'Check everyone has understood'],
          skills: ['Clarity', 'Active listening', 'Empathy'],
          image: 'the-survey-that-lied'
        },
        '9-10': {
          topics: ['Structuring a persuasive message', 'Speaking with confidence, not aggression', 'Adapting words to classmates, teachers and parents', 'Writing clear messages and emails', 'Responding to questions and objections calmly'],
          mission: 'Pitch the School Change',
          brief: 'You want the principal to approve a small school improvement. Choose your evidence, build a short message from it and handle objections from classmates and staff.',
          decisions: ['Pick the change and the evidence', 'Build a short message for the principal', 'Respond to a teacher’s objection', 'Adjust the pitch for classmates'],
          skills: ['Audience awareness', 'Persuasion', 'Responsiveness'],
          image: 'should-the-school-go-solar'
        },
        '11-12': {
          topics: ['Executive summaries and concise communication', 'Professional email and meeting etiquette', 'Presenting evidence and recommendations', 'Managing difficult conversations', 'Adapting to formal and informal stakeholders'],
          mission: 'The Important Meeting',
          brief: 'You are a junior team member presenting a proposal to a fictional manager and client. Respond to interruptions, conflicting priorities and follow-up questions while keeping your message accurate and professional.',
          decisions: ['Open with a one-line summary', 'The client interrupts', 'Manager and client want different things', 'Follow up in writing'],
          skills: ['Structured communication', 'Professionalism', 'Handling objections'],
          image: 'you-are-the-product-manager'
        }
      }
    },
    {
      id: 'P02', area: 'people', title: 'Work Better Together',
      tagline: 'Share the work, settle disagreements and build trust.',
      levels: {
        '6-8': {
          topics: ['Seeing situations from another person’s view', 'Dividing responsibilities fairly', 'Helping someone who feels left out', 'Disagreeing without personal attacks', 'Making group decisions that everyone understands'],
          mission: 'The Games Day Team',
          brief: 'Four fictional classmates disagree over games-day roles and one is being excluded. Listen to each person, distribute responsibilities and repair trust when plans change.',
          decisions: ['Hear each classmate out', 'Split the roles fairly', 'Include the classmate left out', 'Re-plan when it rains'],
          skills: ['Fairness', 'Listening', 'Conflict resolution'],
          image: 'the-cricket-match-argument'
        },
        '9-10': {
          topics: ['Different working styles and strengths', 'Giving and receiving useful feedback', 'Handling peer pressure and disagreements', 'Negotiating when needs compete', 'Building trust through commitments'],
          mission: 'The Festival Team',
          brief: 'Your virtual team must organise a school festival, but one teammate misses commitments and another wants control. Choose conversations and compromises that protect both delivery and relationships.',
          decisions: ['Talk to the teammate missing deadlines', 'Respond to a teammate taking over', 'Give feedback that helps', 'Agree a compromise plan'],
          skills: ['Feedback quality', 'Negotiation', 'Trust building'],
          image: 'the-college-fest-one-night-left'
        },
        '11-12': {
          topics: ['Stakeholder interests and competing incentives', 'Leadership without formal authority', 'Difficult feedback and constructive disagreement', 'Negotiation and principled compromise', 'Ethics and accountability in teams'],
          mission: 'The Project Crisis',
          brief: 'A fictional cross-functional team is behind schedule and blaming each other. Diagnose misunderstandings, manage a tense meeting and choose a recovery plan without hiding problems.',
          decisions: ['Find where the plan broke', 'Run the tense meeting', 'Own a mistake openly', 'Choose a recovery plan'],
          skills: ['Leadership', 'Accountability', 'Relationship repair'],
          image: 'the-group-project-ghost'
        }
      }
    },

    // ---------------------------------------------------------- Digital Power
    {
      id: 'D01', area: 'digital', title: 'Stay Safe Online',
      tagline: 'Protect your accounts, your money and your information.',
      levels: {
        '6-8': {
          topics: ['Private information and digital footprints', 'Strong passwords and multi-factor safety', 'Safe links, downloads and unfamiliar messages', 'Cyberbullying, reporting and getting help', 'Pausing before sending or sharing'],
          mission: 'The Mystery Message',
          brief: 'In a fictional chat, a new contact asks for a photo, a password hint and a link click. Choose what to share, how to check the request and when to seek a trusted adult.',
          decisions: ['A stranger asks for a photo', 'A “fun quiz” asks for a password hint', 'A link to a free game', 'Decide when to tell a trusted adult'],
          skills: ['Privacy', 'Scam detection', 'Help-seeking'],
          image: 'forward-or-fact-check'
        },
        '9-10': {
          topics: ['Phishing, fake accounts and social engineering', 'UPI, OTP and QR-code fraud red flags', 'Account security and device permissions', 'Online harassment, impersonation and reporting', 'What to do immediately after a suspected scam'],
          mission: 'The Fake Scholarship Offer',
          brief: 'A viral scholarship message leads to a website asking for personal details and a payment. Check authenticity, help a friend avoid a scam and choose safe reporting steps.',
          decisions: ['Check the sender and the website', 'Spot the “processing fee”', 'Help a friend who already shared details', 'Report it: 1930 and cybercrime.gov.in'],
          skills: ['Fraud recognition', 'Verification', 'Incident response'],
          image: 'digital-payment-fraud-report'
        },
        '11-12': {
          topics: ['Identity theft, credential leaks and phishing', 'Digital banking, marketplace and job scams', 'Privacy settings, app permissions and data trails', 'Evidence preservation and responsible reporting', 'Handling a compromised account or suspected financial fraud'],
          mission: 'The Internship Scam',
          brief: 'A convincing recruiter approaches you with an offer, a document request and an urgent fee. Investigate red flags, protect your information and take recovery steps after a fictional account compromise.',
          decisions: ['Verify the recruiter and the company', 'A request for Aadhaar and PAN', 'An urgent “registration fee”', 'Recover a compromised email account'],
          skills: ['Threat assessment', 'Data protection', 'Recovery judgement'],
          image: 'digital-payment-fraud-report'
        }
      }
    },
    {
      id: 'D02', area: 'digital', title: 'Social Media & Digital Life',
      tagline: 'Use social media well, and understand how it uses you.',
      levels: {
        '6-8': {
          topics: ['What the internet and social platforms show us', 'Why feeds recommend different posts', 'Online kindness, peer pressure and screen-time choices', 'Photos, consent and lasting digital footprints', 'Simple digital creation, search and collaboration'],
          mission: 'The Class Page Challenge',
          brief: 'You help manage a fictional class page when an exciting rumour and an embarrassing photo appear. Choose what to post, how to credit creators and how to keep classmates safe.',
          decisions: ['Choose what to post today', 'An exciting rumour arrives', 'An embarrassing photo of a classmate', 'Credit the student who made the poster'],
          skills: ['Digital citizenship', 'Consent', 'Responsible posting'],
          image: 'the-deepfake-has-40000-views'
        },
        '9-10': {
          topics: ['How algorithms and engagement shape attention', 'Creators, ads, sponsorships and influencer claims', 'Misleading edits, clickbait and online reputation', 'Copyright, permissions and content ownership', 'Using search, documents and data tools to work better'],
          mission: 'Launch a Student Channel',
          brief: 'Run a simulated school-interest social channel through several posting days. Balance reach, accuracy, privacy and sponsorship choices as the audience responds.',
          decisions: ['Plan the first week of posts', 'Clickbait or an honest title', 'A sponsor offer with conditions', 'Read what the analytics really say'],
          skills: ['Media literacy', 'Ethical content choices', 'Tool selection'],
          image: 'the-video-everyone-believes'
        },
        '11-12': {
          topics: ['Platform incentives, algorithms and attention economics', 'Personal brand and long-term digital reputation', 'Misinformation, manipulation and echo chambers', 'Digital productivity, collaboration and data presentation', 'Creator economics, intellectual property and professional conduct'],
          mission: 'The Viral Campaign Decision',
          brief: 'A fictional club campaign unexpectedly goes viral, attracting a brand offer and criticism. Manage analytics, disclosures, rights, audience expectations and public responses without sacrificing trust.',
          decisions: ['Read what is driving the spike', 'A brand deal that needs disclosure', 'A copyright complaint', 'Respond to public criticism'],
          skills: ['Strategic judgement', 'Ethics', 'Digital professionalism'],
          image: 'the-video-everyone-believes'
        }
      }
    },

    // -------------------------------------------------------------- AI Skills
    {
      id: 'A01', area: 'ai', title: 'AI in Everyday Life',
      tagline: 'Understand what AI is, where it helps and where it fails.',
      levels: {
        '6-8': {
          topics: ['Where AI appears in everyday life', 'Patterns and predictions, not magic', 'How AI examples and training data matter', 'Why AI can be wrong or unfair', 'Human judgement, kindness and privacy around AI'],
          mission: 'The Smart School Helper',
          brief: 'Your fictional school introduces an AI helper that recommends books and answers questions. Decide when to trust it, when to double-check and when an adult or human decision is needed.',
          decisions: ['A book recommendation that misses', 'A confident but wrong answer', 'A question about a classmate’s private matter', 'When should a teacher decide?'],
          skills: ['AI understanding', 'Scepticism', 'Human oversight'],
          image: 'the-missing-library-book'
        },
        '9-10': {
          topics: ['AI versus regular software rules', 'How training data shapes outputs', 'Generative AI, images and recommendations', 'Hallucinations, bias and deepfakes', 'Safe and ethical AI use in schoolwork'],
          mission: 'The AI Newsroom',
          brief: 'A fictional media club uses AI to create articles and images before an event. Detect invented facts and altered images, choose disclosures and decide what is safe to publish.',
          decisions: ['An article with invented quotes', 'A photo that has been altered', 'What to disclose to readers', 'Publish, fix or drop'],
          skills: ['AI literacy', 'Verification', 'Ethics'],
          image: 'the-deepfake-has-40000-views'
        },
        '11-12': {
          topics: ['Machine learning, generative models and their limits', 'Data quality, bias and model evaluation', 'AI in healthcare, business and public services', 'Privacy, consent, accountability and human oversight', 'Evaluating when AI should or should not be deployed'],
          mission: 'The AI Decision Committee',
          brief: 'A fictional institution is considering an AI tool for student counselling and scholarship screening. Assess benefits, fairness, privacy and error risks before recommending safeguards or rejecting the proposal.',
          decisions: ['Test the vendor’s accuracy claims', 'Check who the tool gets wrong', 'Data, privacy and consent', 'Approve with safeguards, or reject'],
          skills: ['System understanding', 'Risk assessment', 'Responsible deployment'],
          image: 'the-antibiotic-resistance-puzzle'
        }
      }
    },
    {
      id: 'A02', area: 'ai', title: 'Make AI Work for You',
      tagline: 'Use AI tools well, and stay the one in charge.',
      levels: {
        '6-8': {
          topics: ['Giving clear instructions to AI', 'Adding examples and context to requests', 'Asking AI to explain or quiz, not just give answers', 'Checking facts in generated responses', 'Keeping private information out of prompts'],
          mission: 'Save the Science Fair',
          brief: 'Your fictional science team uses an AI assistant to prepare for a fair. Improve vague prompts, spot faulty explanations and decide which suggestions need a real-world check.',
          decisions: ['Rewrite a vague prompt', 'Spot a faulty explanation', 'Ask the assistant to quiz you', 'Keep personal details out'],
          skills: ['Prompt clarity', 'Verification', 'Privacy'],
          image: 'the-lemon-and-soap-mystery'
        },
        '9-10': {
          topics: ['A prompt structure: role, task, context and format', 'Using AI for brainstorming and organising', 'Iterating and comparing responses', 'Checking sources, images and numeric claims', 'Originality, disclosure and responsible school use'],
          mission: 'The Event Planner Assistant',
          brief: 'An AI assistant helps plan a fictional interschool event with budget and accessibility rules. Refine prompts, detect inaccurate suggestions and choose a final plan.',
          decisions: ['Build a prompt with role, task, context and format', 'Catch a plan that breaks the budget', 'Check an accessibility claim', 'Choose the final plan'],
          skills: ['AI collaboration', 'Constraint handling', 'Output evaluation'],
          image: 'design-the-play-space'
        },
        '11-12': {
          topics: ['Designing repeatable human–AI workflows', 'Task decomposition and evaluating outputs', 'Research, analysis and multimodal AI use', 'Reliability, privacy, copyright and human sign-off', 'Knowing when automation is inappropriate'],
          mission: 'The AI Operations Desk',
          brief: 'You are asked to use AI to review a fictional organisation’s customer feedback and recommend improvements. Decide what data may be used, catch invented findings and hand over a verified, human-approved recommendation.',
          decisions: ['Decide what customer data may be used', 'Break the job into steps', 'Catch an invented finding', 'Hand over for human sign-off'],
          skills: ['Workflow design', 'Verification discipline', 'Accountability'],
          image: 'the-survey-that-lied'
        }
      }
    },

    // ------------------------------------------------------------ World Ready
    {
      id: 'W01', area: 'world', title: 'How Business Works',
      tagline: 'See how real organisations make, sell and serve.',
      levels: {
        '6-8': {
          topics: ['Why businesses exist and whom they help', 'How a product reaches a customer', 'Jobs people do behind the scenes', 'Costs, prices and the idea of profit', 'Why customer experience matters'],
          mission: 'Run the School Canteen',
          brief: 'Step into a fictional canteen manager’s role during a busy day. Set a few prices, manage supplies and respond to customer problems while keeping the operation fair.',
          decisions: ['Set prices for three items', 'Samosas run out at break', 'A complaint about cold food', 'Work out the day’s profit'],
          skills: ['Customer awareness', 'Operations basics', 'Cost awareness'],
          image: 'the-new-student-at-lunch'
        },
        '9-10': {
          topics: ['Customers, demand and competition', 'Supply chains and the people behind a product', 'Revenue, costs, margins and trade-offs', 'Quality, service and business reputation', 'How sales, finance, operations and teams coordinate'],
          mission: 'The Online Store Day',
          brief: 'Run a simulated order day for an established school-merchandise seller. Handle stockouts, refunds, customer complaints and delivery delays without sacrificing the business’s credibility.',
          decisions: ['A best-seller goes out of stock', 'A refund request', 'A courier delay', 'Reply to an angry review'],
          skills: ['Functional thinking', 'Prioritisation', 'Customer service'],
          image: 'you-are-the-product-manager'
        },
        '11-12': {
          topics: ['Business models and unit economics', 'Operations, constraints and process bottlenecks', 'Functional teams and competing KPIs', 'Customer retention, pricing and service recovery', 'Ethics, incentives and performance measurement'],
          mission: 'The Company Turnaround',
          brief: 'Join the leadership meeting of a fictional established company facing falling profits and unhappy customers. Analyse simplified performance figures and choose cross-team changes as new constraints emerge.',
          decisions: ['Read the performance figures', 'Sales and operations want different things', 'A price cut or a service fix', 'Choose the cross-team changes'],
          skills: ['Commercial thinking', 'Cross-functional trade-offs', 'Stakeholder judgement'],
          image: 'the-electricity-bill-that-does-not-add-up'
        }
      }
    },
    {
      id: 'W02', area: 'world', title: 'Life Beyond School',
      tagline: 'Handle everyday systems, rights and responsibilities with confidence.',
      levels: {
        '6-8': {
          topics: ['Who provides everyday community services', 'Asking for help and using services responsibly', 'Reading labels, signs, instructions and warnings', 'Being a thoughtful consumer and citizen', 'Choices that affect neighbours and the environment'],
          mission: 'A Day in Your Neighbourhood',
          brief: 'Your fictional neighbourhood faces a broken streetlight, an unsafe crossing and an overflowing bin. Identify the right people to approach, choose respectful actions and prioritise urgent safety.',
          decisions: ['Rank what is most urgent', 'Who fixes a streetlight?', 'Choose how to ask respectfully', 'Stay safe at the crossing meanwhile'],
          skills: ['Civic awareness', 'Safety', 'Practical judgement'],
          image: 'thirty-seconds-to-cross'
        },
        '9-10': {
          topics: ['Consumer choices, bills, warranties and receipts', 'Basic forms, agreements and privacy rules', 'Using public services and complaint channels', 'Rights, responsibilities and respectful advocacy', 'Balancing convenience, cost and social impact'],
          mission: 'The Lost Delivery Problem',
          brief: 'A fictional online purchase arrives damaged, and different people offer conflicting advice. Check the terms, choose fair complaint steps and handle a misleading replacement offer.',
          decisions: ['Read the return and warranty terms', 'Contact the seller with evidence', 'A “better replacement” offer', 'Escalate to the National Consumer Helpline'],
          skills: ['Consumer awareness', 'Process judgement', 'Persistence'],
          image: 'the-online-sale-countdown'
        },
        '11-12': {
          topics: ['Reading agreements, terms and hidden obligations', 'Renting, subscriptions, taxes and basic paperwork', 'Consumer grievance and public service processes', 'Health, travel and safety decisions using reliable information', 'Ethical choices, sustainability and civic participation'],
          mission: 'Your First Month Away',
          brief: 'You have moved to a new city for college or work. A rental agreement with a lock-in clause, an auto-renewing service contract, a wrong bill and a cancelled train all need handling. Read the fine print, use the right channels and stay safe.',
          decisions: ['Spot the lock-in and deposit clauses', 'Cancel an auto-renewing plan', 'Dispute a wrong bill', 'Rebook a cancelled train safely'],
          skills: ['Independent living', 'Document literacy', 'Responsible decisions'],
          image: 'your-first-independent-month'
        }
      }
    }
  ];

  window.YOPPI_FSL = {
    areas: AREAS,
    bands: BANDS,
    courses: COURSES,
    images: IMAGES,
    // One standard experience for every course.
    learning: { minutes: 120, steps: ['Explore', 'Understand', 'Practise', 'Prepare'] },
    missionMinutes: 60,
    rubric: [
      { name: 'Understanding', q: 'Did they apply the concepts taught?' },
      { name: 'Decision quality', q: 'Did they balance options and constraints?' },
      { name: 'Responsibility', q: 'Did they recognise risks and ethical concerns?' },
      { name: 'Adaptability', q: 'Did they respond sensibly to changing information?' }
    ]
  };
})();
