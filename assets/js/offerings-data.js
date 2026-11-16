/* YOPPI — offerings. One source for the cards and the detail dialog on every page.
   status: 'live' = ready to use today (links out); 'soon' = in development (links to contact).
   pillar / alsoBuilds use the four pillars: Growth, Wellness, Connection, Exposure. */
(function () {
  var INSCENE_CAREER = 'https://inscene.anagat.net/products?category=career';
  var INSCENE_SCHOOL = 'https://inscene.anagat.net/products?category=school';
  var DEFEND = 'https://defend.anagat.net/';

  var SOON_NOTE =
    "We're shaping this with our first partner institutions. If it sounds right for your students, we'd like to hear from you.";

  window.YOPPI_OFFERINGS = [
    // ---------------------------------------------------------------- Schools
    {
      slug: 'career-simulator',
      audience: 'schools',
      title: 'Career Simulator',
      pillar: 'Exposure',
      who: 'Class 7 to 12',
      format: 'Online · 10–15 minute sessions',
      alsoBuilds: [],
      tagline: "Don't just learn about careers. Try them.",
      summary:
        'Students build a career profile, then try short simulations of real work and collect stamps in a Career Passport.',
      description:
        'Most students know a handful of careers from family, school and social media. The Career Simulator starts with what a student enjoys doing, not job titles. A ten-minute profile maps their interests to ten career worlds. Short missions then let them try the work itself, such as planning drainage for a flooding neighbourhood alongside an engineer, a planner and a scientist.',
      outcomes: ['Career awareness', 'Industry exposure', 'Interest discovery', 'Better decision making'],
      status: 'live',
      statusNote: 'Live on InScene. Students start with a nickname, with no email or phone number needed to begin.',
      href: INSCENE_CAREER,
      cta: 'Open Career Simulator',
      where: 'Opens on InScene',
      image: 'career-simulator',
      alt: 'Two students look up from a laptop, imagining careers as a doctor, a wind-energy engineer and an artist.'
    },
    {
      slug: 'scenario-learning',
      audience: 'schools',
      title: 'Scenario Learning',
      pillar: 'Growth',
      who: 'Grades 6 to 12',
      format: 'Online, on the InScene platform',
      alsoBuilds: ['Connection'],
      tagline: 'Think through the real world.',
      summary:
        'Interactive scenarios where students make decisions, see how they play out and reflect on what they learned.',
      description:
        "Students step into situations drawn from everyday life: a puddle that dries faster than its neighbour, a worrying message forwarded in a class group, a ₹600 canteen budget. They talk with characters, make choices and see the consequences. A short debrief then shows what worked and what to try next time.",
      outcomes: ['Critical thinking', 'Decision making', 'Empathy & perspective', 'Real-world awareness'],
      status: 'live',
      statusNote: 'Live on InScene, with scenarios for Grades 6–8, 9–10 and 11–12.',
      href: INSCENE_SCHOOL,
      cta: 'Explore scenarios',
      where: 'Opens on InScene',
      image: 'scenario-learning',
      alt: 'Four students discuss a practical science investigation at a school courtyard table.'
    },
    {
      slug: 'future-skills-lab',
      audience: 'schools',
      title: 'Future Skills Lab',
      pillar: 'Growth',
      who: 'Class 6 to 12',
      format: '12 courses · 2 h learning + 1 h InScene mission',
      alsoBuilds: ['Exposure'],
      tagline: 'Understand, create and thrive in a changing world.',
      summary:
        'Twelve courses on money, thinking, people, digital life, AI and the world beyond school, each assessed through an InScene mission.',
      description:
        'Six skill areas, two courses each, written separately for Class 6\u20138, 9\u201310 and 11\u201312. Students learn through short interactive lessons on YOPPI, then prove what they learned in an InScene mission: a real-life situation where they make decisions and see the consequences, such as managing \u20b9800 for a class trip, spotting a fake scholarship offer or deciding whether an AI tool should screen scholarship applications.',
      outcomes: ['Financial literacy', 'Critical thinking', 'Communication & teamwork', 'Online safety', 'Responsible AI use', 'Real-world readiness'],
      status: 'live',
      statusNote: 'The course catalogue is live on YOPPI: browse all 36 grade-specific versions and their InScene missions. Courses open with partner schools first.',
      href: 'future-skills-lab.html',
      cta: 'Open Future Skills Lab',
      where: 'Opens on YOPPI',
      image: 'future-skills-lab',
      alt: 'Four students work together around laptops and project sheets in a classroom.'
    },
    {
      slug: 'startup-sprint',
      audience: 'schools',
      title: 'Startup Sprint',
      pillar: 'Growth',
      who: 'Middle and senior school',
      format: 'Online simulator (20–30 min) + multi-week team programme',
      alsoBuilds: ['Connection'],
      tagline: 'From curious students to confident problem-solvers.',
      summary: 'Students find a real problem, form a team, build a simple solution and pitch it.',
      description:
        'Students look around their school and community for a problem worth solving. In small teams they shape an idea, test it with real people, build a simple version and present it, learning that good ideas come from listening as much as from inspiration. It starts online in Startup City: a short simulation where students find a problem, talk to pretend customers, build a product, open a pretend shop and download their own startup report.',
      outcomes: ['Entrepreneurial mindset', 'Problem solving', 'Teamwork & collaboration', 'Presentation skills'],
      status: 'live',
      statusNote: 'The Startup City simulator is live on YOPPI for Class 6–12: no sign-up, nothing to install, and all money and sales are pretend. The multi-week team programme runs with partner schools.',
      href: 'startup-sprint.html',
      cta: 'Play Startup Sprint',
      where: 'Opens on YOPPI',
      image: 'startup-sprint',
      alt: 'Three students plan an idea together with sticky notes and a laptop.'
    },
    {
      slug: 'growwell',
      audience: 'schools',
      title: 'GrowWell',
      pillar: 'Wellness',
      who: 'All grades',
      format: 'Weekly in-school sessions',
      alsoBuilds: ['Connection'],
      tagline: 'Because growth is bigger than marks.',
      summary: 'Yoga, mindfulness, movement and confidence-building to support how students feel, not just how they score.',
      description:
        'Regular sessions of yoga, mindfulness, movement and confidence-building activities that support physical, social and emotional wellbeing, and help students feel at home with each other.',
      outcomes: ['Healthy habits', 'Emotional awareness', 'Self-confidence', 'Positive peer relationships'],
      status: 'soon',
      image: 'growwell',
      alt: 'A student with a lunchbox smiles at a classmate in a bright school canteen.'
    },

    // --------------------------------------------------------------- Colleges
    {
      slug: 'defend',
      audience: 'colleges',
      title: 'DEFEND',
      pillar: 'Growth',
      who: 'Students preparing for placements',
      format: 'Online · upload a resume',
      alsoBuilds: [],
      tagline: 'Your resume says you know it. Can you defend it?',
      summary:
        "Turns each claim on a student's resume into the depth an interviewer will expect, so they prepare for the questions that matter.",
      description:
        'DEFEND reads a resume claim by claim and maps each one to the concepts an interviewer is likely to probe, across engineering, data, product, design, business and more. Students see which claims carry the most preparation risk, fix their weakest lines and check their resume against any job description.',
      outcomes: ['Interview-ready answers', 'Stronger resume lines', 'Clarity on job fit'],
      status: 'live',
      statusNote: 'Live at defend.anagat.net. Free to start, with no sign-in needed to upload a resume.',
      href: DEFEND,
      cta: 'Open DEFEND',
      where: 'Opens defend.anagat.net',
      image: 'defend',
      alt: 'A resume claim about a RAG pipeline broken into the concepts an interviewer will ask about.'
    },
    {
      slug: 'career-simulator-colleges',
      audience: 'colleges',
      title: 'Career Simulator',
      pillar: 'Growth',
      who: 'Undergraduates',
      format: 'Online · 10–15 minute sessions',
      alsoBuilds: ['Exposure'],
      tagline: 'Try the job before you choose it.',
      summary:
        'A career profile and short simulations of real work, so students can test a direction before they commit to it.',
      description:
        'College is when choices start to narrow. The Career Simulator helps students see which kinds of work genuinely suit them. A short profile maps interests and values to career worlds, then hands-on missions let them try the work with professionals before they commit to a specialisation, an internship or a first job.',
      outcomes: ['Career awareness', 'Better decision making', 'Informed students and parents'],
      status: 'live',
      statusNote: 'Live on InScene. Students start with a nickname, with no email or phone number needed to begin.',
      href: INSCENE_CAREER,
      cta: 'Open Career Simulator',
      where: 'Opens on InScene',
      image: 'career-simulator',
      alt: 'Two students look up from a laptop, imagining careers as a doctor, a wind-energy engineer and an artist.'
    },
    {
      slug: 'veterans-workshops',
      audience: 'colleges',
      title: 'Veterans Workshops',
      pillar: 'Exposure',
      who: 'Undergraduates',
      format: 'Industry-led workshops and mentorship',
      alsoBuilds: ['Connection'],
      tagline: 'Learn from people who have done the job.',
      summary: 'Workshops and mentorship from experienced professionals, built around practical work and interviews.',
      description:
        "Experienced professionals run practical workshops on how their work actually happens: the tools, the trade-offs and what interviewers look for. Students can ask the questions a syllabus doesn't cover and build early professional connections.",
      outcomes: ['Industry exposure', 'Practical skills', 'Stronger professional network'],
      status: 'soon',
      image: 'veterans-workshops',
      alt: 'An engineer in a hard hat explains a solar layout plan to two students on a rooftop.'
    },
    {
      slug: 'campus-calm',
      audience: 'colleges',
      title: 'Campus Calm',
      pillar: 'Wellness',
      who: 'All students',
      format: 'Programmes and ongoing support',
      alsoBuilds: [],
      tagline: 'Support before stress becomes a crisis.',
      summary: 'Exam-stress programmes and everyday wellbeing support, with a clear path to a counsellor when it matters.',
      description:
        'Practical programmes around exams and transitions, alongside everyday wellbeing support that students can reach when they need it. When something needs a professional, students are guided to a counsellor.',
      outcomes: ['Reduced stress and anxiety', 'Improved mental wellbeing', 'Timely professional support'],
      status: 'soon',
      image: 'campus-calm',
      alt: 'A student sits quietly at a desk with books, thinking.'
    },
    {
      slug: 'sports-infra',
      audience: 'colleges',
      title: 'Sports Infra as a Service',
      pillar: 'Wellness',
      who: 'Whole campus',
      format: 'Managed service, with a simple app',
      alsoBuilds: ['Connection'],
      tagline: 'One partner for every court, kit and consumable.',
      summary: 'Equipment, leasing, maintenance and repairs for campus sports, managed through one simple partner.',
      description:
        'A single partner for campus sports infrastructure: equipment, leasing, maintenance, repairs and consumables, requested through a simple app so courts and kit stay ready to play.',
      outcomes: ['Higher sports participation', 'Better equipment uptime', 'Hassle-free operations'],
      status: 'soon',
      image: 'sports-infra',
      alt: 'Students in cricket whites talk on a school ground.'
    }
  ];

  window.YOPPI_PILLARS = ['Growth', 'Wellness', 'Connection', 'Exposure'];
  window.YOPPI_SOON_NOTE = SOON_NOTE;
})();
