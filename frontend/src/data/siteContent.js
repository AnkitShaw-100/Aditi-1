import heroVideo from "../../media/aditi-hero-video.mp4";
import heroMobileVideo from "../../media/pre-comp-2-mobile.mp4";
import frameworkBg from "../../media/Terrain-w-scaled.webp";
import logoMark from "../../media/logo.png";

const contributorImages = import.meta.glob("../../media/contributors image/*", {
  eager: true,
  import: "default",
  query: "?url",
});

function contributorImage(matchText) {
  const match = Object.entries(contributorImages).find(([path]) =>
    path.toLowerCase().includes(matchText.toLowerCase())
  );

  return match?.[1] ?? "https://i.pravatar.cc/240?img=15";
}

export const SECTION_IDS = [
  "intro",
  "mission",
  "authors",
  "read",
  "feedback",
  "faq",
  "pillars",
  "credentials",
  "editions",
];

export const NAV_ITEMS = [
  { id: "intro", label: "Home", index: "01" },
  { id: "authors", label: "Authors", index: "02" },
  { id: "read", label: "Articles", index: "03" },
  { id: "feedback", label: "Testimonials", index: "04" }
];

export const MENU_ITEMS = [
  { id: "intro", title: "Home", index: "01", meta: "Hero video" },
  { id: "mission", title: "Mission", index: "02", meta: "About the brand" },
  { id: "authors", title: "Authors", index: "03", meta: "Ranks and roles" },
  { id: "read", title: "Articles", index: "04", meta: "Free and premium" },
  { id: "feedback", title: "Testimonials", index: "05", meta: "Reader trust" },
  { id: "faq", title: "FAQ", index: "06", meta: "Terms and access" },
];

export const MISSION_PILLARS = [
  {
    index: "01",
    title: "Clarity before commentary",
    copy:
      "ADITI is built to explain what matters, why it matters, and what changes because of it.",
  },
  {
    index: "02",
    title: "Doctrine over noise",
    copy:
      "We frame each article through doctrine, terrain, technology, and political intent instead of headline churn.",
  },
  {
    index: "03",
    title: "Reading for decision-makers",
    copy:
      "The writing is structured for serious readers who want context they can keep, revisit, and use.",
  },
];

export const AUTHORS = [
  {
    name: "Prof. (Dr.) Srikanth Kondapalli",
    rank: "Dean, School of International Studies, JNU",
    specialty: "Chinese politics, East Asian strategy, and cognitive warfare.",
    summary:
      "Chairman of the Centre for East Asian Studies at JNU, he examines China's cognitive warfare approach and its impact on India.",
    image: contributorImage("srikanth"),
  },
  {
    name: "Lt. Gen. Dharam Vir Kalra",
    rank: "PVSM, AVSM (Retd.)",
    specialty: "Defence logistics, supply chains, and operational planning.",
    summary:
      "Former Director General of Ordnance Services, he brings a civilisational and logistics lens to questions of strategy.",
    image: contributorImage("dv kalra"),
  },
  {
    name: "A.M. (Dr.) Diptendu Choudhury",
    rank: "PVSM, AVSM, VM, VSM (Retd.)",
    specialty: "Air power, strategic policy, and regional defence dynamics.",
    summary:
      "A former Commandant of the National Defence College and fighter pilot, he analyses Control of Air and future regional dynamics.",
    image: contributorImage("diptendu"),
  },
  {
    name: "Maj. Gen. (Dr.) Rajan Kochhar",
    rank: "VSM (Retd.)",
    specialty: "Army logistics, defence analysis, and higher defence management.",
    summary:
      "A former Army Ordnance Corps officer and defence writer, he assesses future-ready logistics for the Indian Army.",
    image: contributorImage("rajan kochhar"),
  },
  {
    name: "Maj. Gen. (Dr.) Mandip Singh",
    rank: "SM, VSM (Retd.)",
    specialty: "Operations, strategic planning, and perception management.",
    summary:
      "A senior Army veteran with deep operational and headquarters experience, he examines the revolution in drone affairs.",
    image: contributorImage("mandip"),
  },
  {
    name: "Maj. Gen. Neeraj Bali",
    rank: "SM (Retd.)",
    specialty: "China strategy, counter-terror operations, and professional military education.",
    summary:
      "An Army veteran with operational and advisory experience, he analyses why India's China strategy requires a rethink.",
    image: contributorImage("neeraj bali"),
  },
  {
    name: "Cmde. Anil Jai Singh",
    rank: "Commodore (Retd.)",
    specialty: "Submarine warfare, maritime strategy, procurement, and indigenisation.",
    summary:
      "A veteran submariner and maritime commentator, he examines India's defence procurement process for ADITI.",
    image: contributorImage("anil jai singh"),
  },
  {
    name: "Brig. Anshuman Narang",
    rank: "Brigadier (Retd.)",
    specialty: "OSINT, space security, UAS, and counter-UAS warfare.",
    summary:
      "Founder of the Atma Nirbhar Soch Foundation, he writes on re-energising India's space ecosystem.",
    image: contributorImage("anshuman narang"),
  },
  {
    name: "Brig. Brijesh Dhiman",
    rank: "Brigadier (Retd.)",
    specialty: "Counterinsurgency, internal security, and Northeast operations.",
    summary:
      "An Assam Regiment veteran, he analyses the Indian State's approach to non-state actors in the Northeast.",
    image: contributorImage("brijesh dhiman"),
  },
  {
    name: "Gp. Cpt. (Dr.) Rajiv Kumar Narang",
    rank: "VM (Retd.)",
    specialty: "Aviation safety, unmanned systems, drones, and defence indigenisation.",
    summary:
      "A former IAF helicopter pilot and Senior Fellow at MP-IDSA, he writes on Atmanirbharta in naval aviation.",
    image: contributorImage("rk narang"),
  },
  {
    name: "Mr. Pawan Kakkar",
    rank: "Chief Executive Officer, Jugapro India",
    specialty: "Emerging defence technologies, UAVs, and counter-unmanned systems.",
    summary:
      "An industry leader in advanced construction and defence technologies, he studies counter-UAS innovation and operational relevance.",
    image: contributorImage("pawan kakkar"),
  },
  {
    name: "Dr. Indranil Roy",
    rank: "Co-founder and SVP, Natural Intelligence Systems",
    specialty: "Neuromorphic computing, defence research, and manufacturing.",
    summary:
      "A technology builder and researcher, he writes on the need for a builder's psyche in pursuing Atmanirbharta in defence.",
    image: contributorImage("indranil"),
  },
  {
    name: "Mr. Jaidev Jamwal",
    rank: "Defence Analyst",
    specialty: "Chinese and Pakistani order of battle, force structure, and deployments.",
    summary:
      "A military affairs analyst and ORBAT author, he studies China's Western Theatre Command and the PLA's evolving posture.",
    image: contributorImage("jaidev"),
  },
  {
    name: "Mr. Adithya Kothandhapani",
    rank: "Aerospace Engineer",
    specialty: "LEO, cis-lunar missions, satellite tracking, and OSINT validation.",
    summary:
      "He combines space engineering with policy analysis to examine the cost of chasing China in space.",
    image: contributorImage("adithya kothandhapani"),
  },
  {
    name: "Mr. Sameep Agarwal",
    rank: "Cybersecurity Expert",
    specialty: "Cyber intelligence, digital forensics, homeland security, and threat intelligence.",
    summary:
      "A cybersecurity practitioner associated with national security work, he analyses India's challenges in cyber warfare capability.",
    image: contributorImage("sameep"),
  },
];

export const ARTICLE_ACCESS_OPTIONS = [
  {
    label: "Free Access",
    value: "Open",
    copy:
      "Starter dispatches that let new readers experience the editorial method before buying.",
  },
  {
    label: "Premium Access",
    value: "\u20B9350",
    copy:
      "Full-length strategic essays available one article at a time without a recurring subscription.",
  },
];

export const BRAND_STATS = [
  { value: "6", label: "Issues/Year", tone: "void" },
  { value: "5", label: "Strategic Pillars", tone: "plate" },
  { value: "1", label: "Central Paradox", tone: "ember" },
];

export const LENSES = [
  {
    id: "armament",
    index: "01",
    title: "Armament",
    copy: "Systems matter only when they change tempo, range, cost or political choice. ADITI reads weapons through doctrine, not catalogues.",
  },
  {
    id: "doctrine",
    index: "02",
    title: "Doctrine",
    copy: "Every force carries assumptions into battle. ADITI tests those assumptions against geography, adversary behavior and escalation risk.",
  },
  {
    id: "intelligence",
    index: "03",
    title: "Intelligence",
    copy: "Signals, deception and uncertainty shape outcomes before the first shot. ADITI separates evidence from theatre.",
  },
  {
    id: "terrain",
    index: "04",
    title: "Terrain",
    copy: "Mountains, ports, deserts and cities are strategic actors. They decide what ambition can actually do.",
  },
  {
    id: "initiative",
    index: "05",
    title: "Initiative",
    copy: "The side that frames the contest often controls escalation. ADITI studies initiative as a political instrument.",
  },
];

export const DISPATCH_FILTERS = [
  { label: "All", value: "all" },
  { label: "Free", value: "free" },
  { label: "Premium", value: "premium" },
];

export const DISPATCHES = [
  {
    type: "free",
    href: "/articles/builders-psyche-atmanirbharta-defence",
    slug: "builders-psyche-atmanirbharta-defence",
    contentPath: "/articles/builders-psyche-atmanirbharta-defence.txt",
    image: "/article-banners/builders-psyche-atmanirbharta-defence-banner.png",
    tag: "Initiative",
    title: "The Need for a Builder's Psyche in the Pursuit of Atmanirbharta in Defence",
    teaser:
      "Dr. Indranil Roy argues that Atmanirbharta depends on building, testing, producing, deploying, and iterating domestic weapons.",
    author: "Dr. Indranil Roy",
    readTime: "10 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel: "Read The Need for a Builder's Psyche in the Pursuit of Atmanirbharta in Defence",
  },
  {
    type: "free",
    href: "/articles/china-western-theatre-command-evolving-posture",
    slug: "china-western-theatre-command-evolving-posture",
    contentPath: "/articles/china-western-theatre-command-evolving-posture.txt",
    image: "/article-banners/china-western-theatre-command-evolving-posture-banner.png",
    tag: "Armament",
    title: "China's Western Theatre Command and PLA's Evolving Posture",
    teaser:
      "Jaidev Jamwal maps the Western Theatre Command's reforms, logistics, airpower, air defence, missiles, and multi-domain posture.",
    author: "Mr. Jaidev Jamwal",
    readTime: "12 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel: "Read China's Western Theatre Command and PLA's Evolving Posture",
  },
  {
    type: "free",
    href: "/articles/challenges-of-atmanirbharta-in-naval-aviation",
    slug: "challenges-of-atmanirbharta-in-naval-aviation",
    contentPath: "/articles/challenges-of-atmanirbharta-in-naval-aviation.txt",
    image: "/article-banners/challenges-of-atmanirbharta-in-naval-aviation-banner.png",
    tag: "Armament",
    title: "Challenges of Atmanirbharta in Naval Aviation",
    teaser:
      "Gp Capt Rajiv Kumar Narang examines why naval aviation has not followed the Navy's shipbuilding self-reliance trajectory.",
    author: "Gp Capt (Dr.) Rajiv Kumar Narang VM (Retd.)",
    readTime: "9 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel: "Read Challenges of Atmanirbharta in Naval Aviation",
  },
  {
    type: "free",
    href: "/articles/followers-dilemma-cost-of-chasing-china-in-space",
    slug: "followers-dilemma-cost-of-chasing-china-in-space",
    contentPath: "/articles/followers-dilemma-cost-of-chasing-china-in-space.txt",
    image: "/article-doc-assets/followers-dilemma-cost-of-chasing-china-in-space/image-2.png",
    tag: "Initiative",
    title: "The Follower's Dilemma: The Cost of Chasing China in Space",
    teaser:
      "Adithya Kothandhapani argues that India's space strategy must solve Indian constraints instead of validating Chinese metrics.",
    author: "Adithya Kothandhapani, Independent Space Analyst",
    readTime: "12 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel: "Read The Follower's Dilemma: The Cost of Chasing China in Space",
  },
  {
    type: "free",
    href: "/articles/control-of-air-future-regional-dynamics",
    slug: "control-of-air-future-regional-dynamics",
    contentPath: "/articles/control-of-air-future-regional-dynamics.txt",
    image: "/article-banners/control-of-air-future-regional-dynamics-banner.png",
    tag: "Armament",
    title: "Control of Air: Future Regional Dynamics",
    teaser:
      "Air Marshal Diptendu Choudhury revisits control of air through contemporary conflicts, China, Pakistan, and India's future context.",
    author: "Air Marshal (Dr) Diptendu Choudhury (Retd)",
    readTime: "10 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel: "Read Control of Air: Future Regional Dynamics",
  },
  {
    type: "premium",
    href: "/checkout",
    slug: "aditi-strategy-defence-volume-1-issue-1",
    image: "/article-banners/aditi-strategy-defence-magazine-mockup.webp",
    tag: "Premium Magazine",
    title:
      "ADITI Strategy & Defence Magazine - Volume 1, Issue 1: Cognitive Dissonance in Indian Strategy",
    teaser:
      "The inaugural ADITI issue on cognitive dissonance in Indian strategy, featuring strategic essays, interviews, procurement analysis, drone affairs, air power, and book reviews.",
    author: "ADITI Editorial",
    readTime: "Magazine issue",
    cta: "Buy Now",
    priceLabel: "\u20B9350",
    ariaLabel:
      "Buy ADITI Strategy and Defence Magazine Volume 1 Issue 1",
  },
];

export const FEEDBACKS = [
  {
    category: "Strategic Affairs",
    quote: "The battlefield begins long before the first shot.",
    name: "Meera Rao",
    role: "Strategic Affairs Editor",
    image: "https://i.pravatar.cc/160?img=32",
  },
  {
    category: "Defence Technology",
    quote: "Platforms matter when they change political options.",
    name: "Kabir Menon",
    role: "Defence Technology Analyst",
    image: "https://i.pravatar.cc/160?img=12",
  },
  {
    category: "Geopolitics",
    quote: "Sovereignty is a habit before it is a headline.",
    name: "Arjun Sethi",
    role: "Geopolitics Contributor",
    image: "https://i.pravatar.cc/160?img=56",
  },
];

export const READER_FEEDBACKS = [
  {
    category: "Reader Note",
    quote: "It reads like a briefing, but it stays elegant and human.",
    name: "Nandini Shah",
    role: "Policy Reader",
    image: "https://i.pravatar.cc/160?img=47",
  },
  {
    category: "Field Opinion",
    quote: "The structure helps me through doctrine without clutter.",
    name: "Aarav Khanna",
    role: "Security Professional",
    image: "https://i.pravatar.cc/160?img=68",
  },
  {
    category: "Dispatch Review",
    quote: "Each piece feels like a serious argument, not a feed update.",
    name: "Ishita Menon",
    role: "Graduate Reader",
    image: "https://i.pravatar.cc/160?img=5",
  },
  {
    category: "Subscriber View",
    quote: "The essays give me a framework before they give me an opinion.",
    name: "Rohan Malhotra",
    role: "Defence Enthusiast",
    image: "https://i.pravatar.cc/160?img=61",
  },
];

export const EDITION_STATS = [
  {
    value: "4",
    label: "Quarterly Editions",
    tagline: "A measured publishing rhythm",
    description:
      "Four releases each year — each edition built as a complete strategic argument, not a news cycle reaction.",
  },
  {
    value: "350",
    prefix: "\u20B9",
    label: "Per Dispatch",
    tagline: "Pay per essay, not per month",
    description:
      "Buy individual premium dispatches at \u20B9350 each. No recurring subscription, no paywall maze.",
  },
  {
    value: "5",
    label: "Analytical Lenses",
    tagline: "One disciplined reading method",
    description:
      "Armament, doctrine, intelligence, terrain, and initiative — five lenses that turn noise into strategy.",
  },
];

export const OJAS_PANELS = [
  {
    id: "forum",
    index: "01",
    label: "Annual Forum",
    headline: "Arguments sharpened in public",
    copy:
      "A yearly gathering where India's strategic community debates doctrine, deterrence, and national intent across disciplines and domains.",
    detail: "Keynotes - Panels - Working sessions - Land - Sea - Air - Cyber - Space - Statecraft",
  },
  {
    id: "heritage",
    index: "02",
    label: "Indian Frame",
    headline: "Heritage meets the present",
    copy:
      "OJAS anchors debate in India's civilisational memory while confronting the operational pressures of the contemporary moment and the reading discipline behind the forum.",
    detail: "Learn about OJAS 2026",
    accent: true,
  },
];

export const FAQ_ITEMS = [
  {
    question: "What exactly do I get for ₹350?",
    answer:
      "The complete first issue — all sixteen contributions, the full magazine, not a sample. It's yours to keep and re-read, on mobile or desktop, from the moment your payment clears.",
  },
  {
    question: "Is this a subscription? Will I be charged again?",
    answer:
      "No. Issue I is a single purchase — one payment, no auto-renewal, nothing recurring. A full subscription opens in July with our new website, but it will always sit alongside the option to buy a single issue. You commit to nothing today beyond this one issue.",
  },
  {
    question: "I've never read defence or strategy writing. Is this for me?",
    answer:
      "Yes. ADITI is written to be understood, not to show off. If you can follow the news, you can follow ADITI — you'll simply understand far more of what you're reading, and why it matters.",
  },
  {
    question: "Who actually writes it?",
    answer:
      "Senior retired officers of the Indian armed forces and India's leading strategic scholars — Air Marshals, Lieutenant Generals, Major Generals, a Commodore, Brigadiers, and one of the country's foremost China experts.",
  },
  {
    question: "Is ADITI political?",
    answer:
      "No. ADITI analyses strategy, not party politics. It is deliberately independent and rigorously analytical — the goal is clearer thinking about Indian power, not a position to defend.",
  },
  {
    question: "Can I read a bit before I buy?",
    answer:
      "Yes — three primers are open and free. Read them here. They show you exactly how ADITI reasons before you spend a rupee.",
  },
  {
    question: "When is the next issue, and will I get it?",
    answer:
      "Issue II — Forging the Republic's Power — arrives in July. Buy Issue I now and you'll be reading ADITI from its very first edition — first in line for every issue that follows.",
  },
];

export { heroVideo, heroMobileVideo, frameworkBg, logoMark };
