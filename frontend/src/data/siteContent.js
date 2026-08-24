import heroVideo from "../../media/aditi-hero-video.mp4";
import heroMobileVideo from "../../media/pre-comp-2-mobile.mp4";
import frameworkBg from "../../media/Terrain-w-scaled.webp";
import logoMark from "../../media/logo.png";
import navbarLogo from "../../media/navbar-logo.webp";
import contributorPlaceholder from "../../media/contributor-placeholder.svg";

import readerAkash from "../../media/testimonials/akash.webp";
import readerAmita from "../../media/testimonials/amita.webp";
import readerAnkit from "../../media/testimonials/ankit.webp";
import readerAyush from "../../media/testimonials/ayush.webp";
import readerBhumika from "../../media/testimonials/bhumika.webp";
import readerDhruv from "../../media/testimonials/dhruv.webp";
import readerGeetanjali from "../../media/testimonials/geetanjali.webp";
import readerKhushbu from "../../media/testimonials/khushbu.webp";
import readerRitika from "../../media/testimonials/ritika.webp";
import readerShivam from "../../media/testimonials/shivam.webp";

const contributorImages = import.meta.glob(
  "../../media/contributors image/*",
  {
    eager: true,
    import: "default",
    query: "?url",
  }
);

const contributorImagesIssueTwo = import.meta.glob(
  "../../media/contributors images issue II/*.webp",
  {
    eager: true,
    import: "default",
    query: "?url",
  }
);

function findImage(images, matchText) {
  const match = Object.entries(images).find(([path]) =>
    path.toLowerCase().includes(matchText.toLowerCase())
  );

  return (
    match?.[1] ??
    "https://i.pravatar.cc/240?img=15"
  );
}

function contributorImage(matchText) {
  return findImage(contributorImages, matchText);
}

// Contributors whose portrait has not been supplied yet fall back to this mark.
function contributorImageIssueTwo(matchText) {
  if (matchText === null) {
    return contributorPlaceholder;
  }

  const match = Object.entries(contributorImagesIssueTwo).find(([path]) =>
    path.toLowerCase().includes(matchText.toLowerCase())
  );

  return match?.[1] ?? contributorPlaceholder;
}

export const PREMIUM_MAGAZINE_PRICE_RUPEES = "350";
export const PREMIUM_MAGAZINE_PRICE_LABEL = `₹${PREMIUM_MAGAZINE_PRICE_RUPEES}`;

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
  { id: "feedback", label: "Testimonials", index: "04" },
];

export const MENU_ITEMS = [
  { id: "intro", title: "Home", index: "01", meta: "Hero video" },
  { id: "mission", title: "Mission", index: "02", meta: "About the brand" },
  { id: "authors", title: "Authors", index: "03", meta: "Ranks and roles" },
  { id: "read", title: "Articles", index: "04", meta: "Free and premium" },
  {
    id: "feedback",
    title: "Testimonials",
    index: "05",
    meta: "Reader trust",
  },
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

/* ============================================================
   ISSUE I CONTRIBUTORS
   Designations / professional status aligned with client document.
   ============================================================ */
// ============================================================
// AUTHORS — ISSUE I
// ============================================================

export const AUTHORS = [
  {
    name: "Prof. (Dr.) Srikanth Kondapalli",
    rank:
      "Professor; Dean, School of International Studies & Chairman, Centre for East Asian Studies, Jawaharlal Nehru University",
    specialty: "Chinese politics, East Asian strategy, and cognitive warfare.",
    summary:
      "Chairman of the Centre for East Asian Studies at JNU, he examines China's cognitive warfare approach and its impact on India.",
    image: contributorImage("srikanth"),
  },
  {
    name: "Lt. Gen. Dharam Vir Kalra | PVSM, AVSM (Retd.)",
    rank:
      "Former Director General of Ordnance Services; Indian Army Veteran",
    specialty: "Defence logistics, supply chains, and operational planning.",
    summary:
      "Former Director General of Ordnance Services, he brings a civilisational and logistics lens to questions of strategy.",
    image: contributorImage("dv kalra"),
  },
  {
    name: "Air Marshal (Dr.) Diptendu Choudhury | PVSM, AVSM, VM, VSM (Retd.)",
    rank:
      "Former Commandant, National Defence College; Indian Air Force Veteran",
    specialty: "Air power, strategic policy, and regional defence dynamics.",
    summary:
      "A former Commandant of the National Defence College and fighter pilot, he analyses Control of Air and future regional dynamics.",
    image: contributorImage("diptendu"),
  },
  {
    name: "Maj. Gen. (Dr.) Rajan Kochhar | VSM (Retd.)",
    rank:
      "Former Major General, Army Ordnance Corps, Central Command; Indian Army Veteran",
    specialty: "Army logistics, defence analysis, and higher defence management.",
    summary:
      "A former Army Ordnance Corps officer and defence writer, he assesses future-ready logistics for the Indian Army.",
    image: contributorImage("rajan kochhar"),
  },
  {
    name: "Maj. Gen. (Dr.) Mandip Singh | SM, VSM (Retd.)",
    rank:
      "Former Senior Officer, Indian Army; Indian Army Veteran",
    specialty: "Operations, strategic planning, and perception management.",
    summary:
      "A senior Army veteran with deep operational and headquarters experience, he examines the revolution in drone affairs.",
    image: contributorImage("mandip"),
  },
  {
    name: "Maj. Gen. Neeraj Bali | SM (Retd.)",
    rank:
      "Indian Army Veteran; Former Rashtriya Rifles Battalion Commander & Security Adviser to the Government of Lesotho",
    specialty:
      "China strategy, counter-terror operations, and professional military education.",
    summary:
      "An Army veteran with operational and advisory experience, he analyses why India's China strategy requires a rethink.",
    image: contributorImage("neeraj bali"),
  },
  {
    name: "Cmde. Anil Jai Singh (Retd.)",
    rank:
      "Senior Vice President, Thyssenkrupp Marine Systems India; Former Indian Navy Officer",
    specialty:
      "Submarine warfare, maritime strategy, procurement, and indigenisation.",
    summary:
      "A veteran submariner and maritime commentator, he examines India's defence procurement process for ADITI.",
    image: contributorImage("anil jai singh"),
  },
  {
    name: "Brig. Anshuman Narang (Retd.)",
    rank:
      "Founder & Director, Atma Nirbhar Soch Foundation; Former Indian Army Officer",
    specialty: "OSINT, space security, UAS, and counter-UAS warfare.",
    summary:
      "Founder of the Atma Nirbhar Soch Foundation, he writes on re-energising India's space ecosystem.",
    image: contributorImage("anshuman narang"),
  },
  {
    name: "Brig. Brijesh Dhiman (Retd.)",
    rank:
      "Former Indian Army Infantry Officer, Assam Regiment",
    specialty:
      "Counterinsurgency, internal security, and Northeast operations.",
    summary:
      "An Assam Regiment veteran, he analyses the Indian State's approach to non-state actors in the Northeast.",
    image: contributorImage("brijesh dhiman"),
  },
  {
    name: "Gp. Cpt. (Dr.) Rajiv Kumar Narang | VM (Retd.)",
    rank:
      "Senior Fellow, Manohar Parrikar Institute for Defence Studies and Analyses; Former Indian Air Force Officer",
    specialty:
      "Aviation safety, unmanned systems, drones, and defence indigenisation.",
    summary:
      "A former IAF helicopter pilot and Senior Fellow at MP-IDSA, he writes on Atmanirbharta in naval aviation.",
    image: contributorImage("rk narang"),
  },
  {
    name: "Mr. Pawan Kakkar",
    rank:
      "Chief Executive Officer, Jugapro India Pvt. Ltd.; Director, Quick Silver Freight Systems Pvt. Ltd.",
    specialty:
      "Emerging defence technologies, UAVs, and counter-unmanned systems.",
    summary:
      "An industry leader in advanced construction and defence technologies, he studies counter-UAS innovation and operational relevance.",
    image: contributorImage("pawan kakkar"),
  },
  {
    name: "Dr. Indranil Roy",
    rank:
      "Co-Founder & Senior Vice President, Research & Development, Natural Intelligence Systems (NIS), Inc.",
    specialty:
      "Neuromorphic computing, defence research, and manufacturing.",
    summary:
      "A technology builder and researcher, he writes on the need for a builder's psyche in pursuing Atmanirbharta in defence.",
    image: contributorImage("indranil"),
  },
  {
    name: "Mr. Jaidev Jamwal",
    rank: "Defence Analyst",
    specialty:
      "Chinese and Pakistani order of battle, force structure, and deployments.",
    summary:
      "A military affairs analyst and ORBAT author, he studies China's Western Theatre Command and the PLA's evolving posture.",
    image: contributorImage("jaidev"),
  },
  {
    name: "Mr. Adithya Kothandhapani",
    rank: "Aerospace Engineer",
    specialty:
      "LEO, cis-lunar missions, satellite tracking, and OSINT validation.",
    summary:
      "He combines space engineering with policy analysis to examine the cost of chasing China in space.",
    image: contributorImage("adithya kothandhapani"),
  },
  {
    name: "Mr. Sameep Agarwal",
    rank: "Cybersecurity Expert",
    specialty:
      "Cyber intelligence, digital forensics, homeland security, and threat intelligence.",
    summary:
      "A cybersecurity practitioner associated with national security work, he analyses India's challenges in cyber warfare capability.",
    image: contributorImage("sameep"),
  },
];


/* ============================================================
   ISSUE II CONTRIBUTORS
   Designations / professional status aligned with client document.
   ============================================================ */

export const AUTHORS_ISSUE_2 = [
  {
    name: "Professor (Dr) Sukhwant S. Bindraaa",
    rank:
      "Director (Research), Amity Institute of International Studies & Amity Institute of Public Policy, Amity University Noida",
    specialty:
      "International relations, foreign policy analysis, and political theory.",
    summary:
      "Nearly five decades of teaching and research, over 70 published papers, and an advisory role with the Union Public Service Commission.",
    image: contributorImageIssueTwo("sukhwant singh bindra"),
  },
  {
    name: "Professor (Dr.) Commander Bhushan Dewan Retd",
    rank: "Indian Navy Veteran; Academic & Industry Leader",
    specialty:
      "Entrepreneurship, innovation, technology, and educational leadership.",
    summary:
      "A 1971 war veteran and author of four books, he has led at TCS, Tanla Solutions and the Adani Group, and served as Founding Provost and Pro Vice-Chancellor.",
    image: contributorImageIssueTwo("bhushan dewan"),
  },
  {
    name: "Professor (Dr.) Y. Nithiyanandam",
    rank:
      "Professor & Head, Geospatial Research Program, Takshashila Institution",
    specialty:
      "Geospatial intelligence, remote sensing, GIS analytics, and geospatial policy.",
    summary:
      "Lead author of the Takshashila Geospatial Bulletin, he has established geospatial programmes at leading Indian institutions.",
    image: contributorImageIssueTwo("nithiyanandam"),
  },
  {
    name: "Air Marshal Anil Khosla | PVSM, AVSM, VM, ADC Retd",
    rank:
      "Former Vice Chief of the Air Staff; Former AOC-in-C, Eastern Air Command",
    specialty:
      "Ground attack, air defence, and maritime air operations.",
    summary:
      "A former Vice Chief of the Air Staff with over 4,000 hours on the Jaguar and MiG-21, he writes on integrating air operations for credible conventional deterrence.",
    image: contributorImageIssueTwo("anil khosla"),
  },
  {
    name: "Air Marshal Anil Chopra | PVSM, AVSM, VM, VSM (Retd)",
    rank:
      "Indian Air Force Veteran; Former Air Officer-in-Charge Personnel",
    specialty:
      "Air power, flight testing, and aerospace capability.",
    summary:
      "A test pilot and Mirage-2000 pioneer, and former Director General of the Centre for Air Power Studies, he examines Indian missiles pushing ahead with precision and reach.",
    image: contributorImageIssueTwo("anil chopra"),
  },
  {
    name: "Lieutenant General (Dr) Sunil Kumar Gadeock | AVSM (Retd)",
    rank:
      "Indian Army Veteran, Indian Army Veteran / Defence & Strategic Studies Professional",
    specialty:
      "Defence logistics, military training, and defence education.",
    summary:
      "A Brigade of the Guards veteran and former Logistics Advisor to the Botswana Defence Force, he writes on the Russian-Ukrainian war conundrum and the way forward.",
    image: contributorImageIssueTwo("sunil kumar gadeock"),
  },
  {
    name: "Lieutenant General Vijay Singh (Retd)",
    rank: "Indian Army Veteran",
    specialty:
      "Counter-insurgency, border management, and UN peacekeeping.",
    summary:
      "A 9th Gorkha Rifles veteran and former Chief of Staff, South Western Command, he studies the power dynamics shaping India's strategic environment.",
    image: contributorImageIssueTwo("vijay singh"),
  },
  {
    name: "Major General Brajesh Kumar | AVSM, VSM (Retd)",
    rank: "Indian Army Veteran; Infrastructure Consultant",
    specialty:
      "Defence infrastructure, project execution, and military engineering.",
    summary:
      "A Corps of Engineers veteran of 39 years, he oversaw tri-service infrastructure projects with annual capital expenditure above ₹6,500 crore.",
    image: contributorImageIssueTwo("brajesh kumar"),
  },
  {
    name: "Colonel (Dr) Amitabh Hoskote (Retd)",
    rank:
      "Indian Army Veteran; Senior Fellow & Faculty, CLAWS–MAHE",
    specialty:
      "Military doctrine, conflict and security, and post-conflict transition.",
    summary:
      "Senior Fellow and PhD supervisor at CLAWS-MAHE, he researches new-age threats and security in the nuclearised subcontinent.",
    image: contributorImageIssueTwo("amitabh hoskote"),
  },
  {
    name: "Colonel Amitabh Bhagat (Retd)",
    rank:
      "Indian Army Veteran; Former Senior Business Leader, Aerospace & Defence Sector",
    specialty:
      "Defence policy, procurement, and international security.",
    summary:
      "An Army veteran and former BAE Systems business leader, he brings three decades across military service and the aerospace and defence industry.",
    image: contributorImageIssueTwo("amitabh bhagat"),
  },
  {
    name: "Colonel Shailender Arya (Retd)",
    rank:
      "Indian Army Veteran; Senior Advisor, The Asia Group",
    specialty:
      "Geopolitics, defence and aerospace policy, and risk advisory.",
    summary:
      "Senior Advisor at The Asia Group and an Adviser in the Ministry of Defence from 2020 to 2025, he has helped shape Indian policy and regulatory frameworks.",
    image: contributorImageIssueTwo("shailender arya"),
  },
  {
    name: "Mr. Adithya Krishna Menon",
    rank: "India Contributor, Naval News",
    specialty:
      "Naval technology, indigenous R&D, and defence procurement.",
    summary:
      "He tracks naval developments across the Indian Ocean Region, from modernisation and procurement to India's defence export efforts.",
    image: contributorImageIssueTwo("adithya krishna menon"),
  },
  {
    name: "Mr. Kartikeya Gupt",
    rank:
      "Co-Founder, C SCAN; Doctoral Scholar, Amity Institute of Defence and Strategic Studies",
    specialty:
      "Strategy and air power theory.",
    summary:
      "Previously with Janes, WikiStrat and the National Maritime Foundation, he studies strategy and air power theory.",
    image: contributorImageIssueTwo("kartikeya gupta"),
  },
  {
    name: "Mr. Pranav Kedar Paranjape",
    rank:
      "Student, Amity Institute of Defence and Strategic Studies",
    specialty:
      "Military history, land warfare, and the Af-Pak region.",
    summary:
      "An avid reader of military history, his work focuses on India's western neighbourhood.",
    image: contributorImageIssueTwo("pranav"),
  },
];

export const AUTHOR_ISSUES = [
  {
    id: "issue-2",
    ordinal: "II",
    label: "Issue II",
    authors: AUTHORS_ISSUE_2,
  },
  {
    id: "issue-1",
    ordinal: "I",
    label: "Issue I",
    authors: AUTHORS,
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
    value: PREMIUM_MAGAZINE_PRICE_LABEL,
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
    copy:
      "Concerns the means of war: weapons, platforms, logistics, industrial capacity, supply chains, and sustainment.",
  },
  {
    id: "doctrine",
    index: "02",
    title: "Doctrine",
    copy:
      "Concerns the ideas of war: how force is conceptualised, organised, and employed to achieve political ends.",
  },
  {
    id: "initiative",
    index: "03",
    title: "Initiative",
    copy:
      "Concerns agency and choice: who sets the agenda, controls escalation, and dictates tempo under uncertainty.",
  },
  {
    id: "terrain",
    index: "04",
    title: "Terrain",
    copy:
      "Concerns the environment of conflict: physical, political, technological, informational, legal, or cognitive.",
  },
  {
    id: "integration",
    index: "05",
    title: "Integration",
    copy:
      "Concerns the joining of parts: civil-military fusion, inter-service coordination, whole-of-government or nation approaches.",
  },
];

export const DISPATCH_FILTERS = [
  { label: "All", value: "all" },
  { label: "Free", value: "free" },
  { label: "Premium", value: "premium" },
];

export const DISPATCHES = [
  // ============================================================
  // INDIAN MISSILES — NEW
  // ============================================================
  {
    type: "free",
    href: "/articles/indian-missiles-precision-and-reach",
    slug: "indian-missiles-precision-and-reach",
    contentPath:
      "/articles/indian-missiles-precision-and-reach.txt",
    image:
      "/article-doc-assets/indian-missiles-precision-and-reach/image-2.png",
    tag: "Armament",
    title:
      "Indian Missiles Pushing Ahead with Precision and Reach",
    teaser:
      "Air Marshal Anil Chopra surveys India's missile arsenal, from Agni and the K-series to BrahMos, Astra, Rudram, and hypersonics.",
    author:
      "Air Marshal Anil Chopra, PVSM, AVSM, VM, VSM (Retd)",
    readTime: "11 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Indian Missiles Pushing Ahead with Precision and Reach",
  },

  // ============================================================
  // JOINT AIR OPERATIONS — NEW
  // ============================================================
  {
    type: "free",
    href:
      "/articles/integrating-air-operations-conventional-deterrence",
    slug:
      "integrating-air-operations-conventional-deterrence",
    contentPath:
      "/articles/integrating-air-operations-conventional-deterrence.txt",
    image:
      "/article-doc-assets/integrating-air-operations-conventional-deterrence/image-7.png",
    tag: "Integration",
    title:
      "Integrating Air Operations for Credible Conventional Deterrence",
    teaser:
      "Air Marshal Anil Khosla argues that India's deterrent credibility rests on air superiority, SEAD, and genuine multi-domain jointness.",
    author:
      "Air Marshal Anil Khosla, PVSM, AVSM, VM, ADC (Retd)",
    readTime: "7 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Integrating Air Operations for Credible Conventional Deterrence",
  },

  // ============================================================
  // DETERRENCE DOCTRINE — NEW
  // ============================================================
  {
    type: "free",
    href: "/articles/evolving-indian-deterrence-doctrine",
    slug: "evolving-indian-deterrence-doctrine",
    contentPath:
      "/articles/evolving-indian-deterrence-doctrine.txt",
    image:
      "/article-doc-assets/evolving-indian-deterrence-doctrine/image-2.jpg",
    tag: "Doctrine",
    title:
      "Evolving Indian Deterrence Doctrine: An Assessment",
    teaser:
      "Colonel (Dr) Amitabh Hoskote assesses the Dynamic Response Strategy after Operation Sindoor, its critiques, and the vectors that still need work.",
    author: "Colonel (Dr) Amitabh Hoskote (Retd)",
    readTime: "10 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Evolving Indian Deterrence Doctrine: An Assessment",
  },

  // ============================================================
  // RUSSIA-UKRAINE — NEW
  // ============================================================
  {
    type: "free",
    href:
      "/articles/russian-ukrainian-war-conundrum-way-forward",
    slug:
      "russian-ukrainian-war-conundrum-way-forward",
    contentPath:
      "/articles/russian-ukrainian-war-conundrum-way-forward.txt",
    image:
      "/article-doc-assets/russian-ukrainian-war-conundrum-way-forward/image-7.jpg",
    tag: "Initiative",
    title:
      "Russian-Ukrainian War Conundrum and the Way Forward",
    teaser:
      "Lt Gen Sunil Kumar Gadeock traces the roots of the war and sets out how India can act as a credible intermediary between Moscow and Kyiv.",
    author:
      "Lieutenant General Sunil Kumar Gadeock, AVSM (Retd)",
    readTime: "13 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Russian-Ukrainian War Conundrum and the Way Forward",
  },

  {
    type: "free",
    href: "/articles/builders-psyche-atmanirbharta-defence",
    slug: "builders-psyche-atmanirbharta-defence",
    contentPath:
      "/articles/builders-psyche-atmanirbharta-defence.txt",
    image:
      "/article-banners/builders-psyche-atmanirbharta-defence-banner.png",
    tag: "Initiative",
    title:
      "The Need for a Builder's Psyche in the Pursuit of Atmanirbharta in Defence",
    teaser:
      "Dr. Indranil Roy argues that Atmanirbharta depends on building, testing, producing, deploying, and iterating domestic weapons.",
    author: "Dr. Indranil Roy",
    readTime: "10 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read The Need for a Builder's Psyche in the Pursuit of Atmanirbharta in Defence",
  },

  {
    type: "free",
    href: "/articles/china-western-theatre-command-evolving-posture",
    slug: "china-western-theatre-command-evolving-posture",
    contentPath:
      "/articles/china-western-theatre-command-evolving-posture.txt",
    image:
      "/article-banners/china-western-theatre-command-evolving-posture-banner.png",
    tag: "Armament",
    title:
      "China's Western Theatre Command and PLA's Evolving Posture",
    teaser:
      "Jaidev Jamwal maps the Western Theatre Command's reforms, logistics, airpower, air defence, missiles, and multi-domain posture.",
    author: "Mr. Jaidev Jamwal",
    readTime: "12 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read China's Western Theatre Command and PLA's Evolving Posture",
  },

  {
    type: "free",
    href: "/articles/challenges-of-atmanirbharta-in-naval-aviation",
    slug: "challenges-of-atmanirbharta-in-naval-aviation",
    contentPath:
      "/articles/challenges-of-atmanirbharta-in-naval-aviation.txt",
    image:
      "/article-banners/challenges-of-atmanirbharta-in-naval-aviation-banner.png",
    tag: "Armament",
    title:
      "Challenges of Atmanirbharta in Naval Aviation",
    teaser:
      "Gp Capt Rajiv Kumar Narang examines why naval aviation has not followed the Navy's shipbuilding self-reliance trajectory.",
    author:
      "Gp Capt (Dr.) Rajiv Kumar Narang VM (Retd.)",
    readTime: "9 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Challenges of Atmanirbharta in Naval Aviation",
  },

  {
    type: "free",
    href:
      "/articles/followers-dilemma-cost-of-chasing-china-in-space",
    slug:
      "followers-dilemma-cost-of-chasing-china-in-space",
    contentPath:
      "/articles/followers-dilemma-cost-of-chasing-china-in-space.txt",
    image:
      "/article-doc-assets/followers-dilemma-cost-of-chasing-china-in-space/image-2.png",
    tag: "Initiative",
    title:
      "The Follower's Dilemma: The Cost of Chasing China in Space",
    teaser:
      "Adithya Kothandhapani argues that India's space strategy must solve Indian constraints instead of validating Chinese metrics.",
    author:
      "Adithya Kothandhapani, Independent Space Analyst",
    readTime: "12 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read The Follower's Dilemma: The Cost of Chasing China in Space",
  },

  // ============================================================
  // CONTROL OF AIR — UPDATED
  // ============================================================
  {
    type: "free",
    href: "/articles/control-of-air-future-regional-dynamics",
    slug: "control-of-air-future-regional-dynamics",
    contentPath:
      "/articles/control-of-air-future-regional-dynamics.txt",
    image:
      "/article-banners/control-of-air-future-regional-dynamics-card.png",
    tag: "Armament",
    title: "Control of Air: Future Regional Dynamics",
    teaser:
      "Air Marshal (Dr) Diptendu Choudhury examines the enduring importance of control of air in contemporary conflicts and India's future multi-domain operations.",
    author:
      "Air Marshal (Dr) Diptendu Choudhury (Retd) PVSM, AVSM, VM, VSM",
    readTime: "12 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Control of Air: Future Regional Dynamics",
  },

  // ============================================================
  // GEOINT — UPDATED
  // ============================================================
  {
    type: "free",
    href:
      "/articles/geospatial-intelligence-india-future-defence-edge",
    slug:
      "geospatial-intelligence-india-future-defence-edge",
    contentPath:
      "/articles/geospatial-intelligence-india-future-defence-edge.txt",
    image:
      "/article-banners/geospatial-intelligence-india-future-defence-edge.jpg",
    tag: "Terrain",
    title:
      "Geospatial Intelligence and India's Future Defence Edge",
    teaser:
      "Prof. (Dr.) Y. Nithiyanandam explains how integrated geospatial intelligence can strengthen India's understanding of terrain, movement, infrastructure, and future defence operations.",
    author:
      "Prof. (Dr.) Y. Nithiyanandam",
    readTime: "10 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Geospatial Intelligence and India's Future Defence Edge",
  },

  // ============================================================
  // BIOTECHNOLOGY — NEW
  // ============================================================
  {
    type: "free",
    href: "/articles/biotechnology-one-bet-several-wins",
    slug: "biotechnology-one-bet-several-wins",
    contentPath:
      "/articles/biotechnology-one-bet-several-wins.txt",
    image:
      "/article-banners/biotechnology-one-bet-several-wins.webp",
    tag: "Initiative",
    title: "Biotechnology – One Bet, Several Wins",
    teaser:
      "Mr. Kushal Johri argues that biotechnology is India's next geopolitical currency, and that regulatory credibility and patents must catch up with manufacturing scale.",
    author: "Mr. Kushal Johri",
    readTime: "6 min read",
    cta: "Read",
    priceLabel: "Free",
    ariaLabel:
      "Read Biotechnology – One Bet, Several Wins",
  },

  {
    type: "premium",
    href: "/checkout",
    slug: "aditi-strategy-defence-volume-1-issue-1",
    image:
      "/article-banners/aditi-strategy-defence-magazine-mockup.webp",
    tag: "Premium Magazine",
    title:
      "ADITI Strategy & Defence Magazine - Volume 1, Issue 1: Cognitive Dissonance in Indian Strategy",
    teaser:
      "The inaugural ADITI issue on cognitive dissonance in Indian strategy, featuring strategic essays, interviews, procurement analysis, drone affairs, air power, and book reviews.",
    author: "ADITI Editorial",
    readTime: "Magazine issue",
    cta: "Buy Now",
    priceLabel: PREMIUM_MAGAZINE_PRICE_LABEL,
    ariaLabel:
      "Buy ADITI Strategy and Defence Magazine Volume 1 Issue 1",
  },

  {
    type: "premium",
    href: "/checkout",
    slug: "aditi-strategy-defence-volume-1-issue-2",
    image:
      "/article-banners/aditi-magazine-issue-2-mockup.webp",
    tag: "Premium Magazine",
    title:
      "ADITI Strategy & Defence Magazine - Volume 1, Issue 2: Forging the Republic's Power",
    teaser:
      "India's deliberate push to strengthen its military capabilities during a period of strategic transition, read across missiles, air operations, and the lessons of the Russian-Ukrainian war.",
    author: "ADITI Editorial",
    readTime: "Magazine issue",
    cta: "Buy Now",
    priceLabel: PREMIUM_MAGAZINE_PRICE_LABEL,
    ariaLabel:
      "Buy ADITI Strategy and Defence Magazine Volume 1 Issue 2",
  },
];

/* ============================================================
   MAGAZINE ISSUES
   ============================================================ */

export const MAGAZINE_ISSUES = [
  {
    ordinal: "II",
    label: "Issue II",
    slug: "aditi-strategy-defence-volume-1-issue-2",
    shortTitle: "Forging the Republic's Power",
    cover:
      "/article-banners/aditi-strategy-defence-magazine-issue-2-cover.webp",
  },
  {
    ordinal: "I",
    label: "Issue I",
    slug: "aditi-strategy-defence-volume-1-issue-1",
    shortTitle:
      "Cognitive Dissonance in Indian Strategy",
    cover:
      "/article-banners/aditi-strategy-defence-magazine-cover.webp",
  },
].map((issue) => ({
  ...issue,
  priceLabel: PREMIUM_MAGAZINE_PRICE_LABEL,
}));

export const LATEST_MAGAZINE_ISSUE = MAGAZINE_ISSUES[0];

export function magazineForIssue(ordinal) {
  const issue = MAGAZINE_ISSUES.find(
    (item) => item.ordinal === ordinal
  );

  return (
    DISPATCHES.find(
      (item) => item.slug === issue?.slug
    ) ?? null
  );
}

/* ============================================================
   FEEDBACK
   ============================================================ */

export const FEEDBACKS = [
  {
    category: "Strategic Affairs",
    quote:
      "The battlefield begins long before the first shot.",
    name: "Meera Rao",
    role: "Strategic Affairs Editor",
    image: "https://i.pravatar.cc/160?img=32",
  },
  {
    category: "Defence Technology",
    quote:
      "Platforms matter when they change political options.",
    name: "Kabir Menon",
    role: "Defence Technology Analyst",
    image: "https://i.pravatar.cc/160?img=12",
  },
  {
    category: "Geopolitics",
    quote:
      "Sovereignty is a habit before it is a headline.",
    name: "Arjun Sethi",
    role: "Geopolitics Contributor",
    image: "https://i.pravatar.cc/160?img=56",
  },
];

export const READER_FEEDBACKS = [
  {
    category: "Reader View",
    quote:
      "Came across ADITI on Instagram and ended up reading a couple of articles. Safe to say I'll be coming back for more.",
    name: "Khushbu",
    role: "Reader",
    image: readerKhushbu,
  },
  {
    category: "Credibility Note",
    quote:
      "Not many pages manage to keep defence content both credible and engaging. This one does.",
    name: "Geetanjali Bhati",
    role: "Reader",
    image: readerGeetanjali,
  },
  {
    category: "Editorial View",
    quote:
      "ADITI brings discipline, design, and depth together; it makes serious strategic writing easier to follow and worth returning to.",
    name: "Ankit",
    role: "Reader",
    image: readerAnkit,
  },
  {
    category: "Quality Note",
    quote:
      "This deserves a much bigger audience. Really impressed with the quality of the articles.",
    name: "Dhruv Sharma",
    role: "Reader",
    image: readerDhruv,
  },
  {
    category: "Defence Affairs",
    quote:
      "As someone interested in defence affairs, this is exactly the kind of content I've been looking for.",
    name: "Amita Pilania",
    role: "Reader",
    image: readerAmita,
  },
  {
    category: "Regular Reader",
    quote:
      "Been following for a while now, and the articles just keep getting better. Great work by the team.",
    name: "Akash Bhushan",
    role: "Reader",
    image: readerAkash,
  },
  {
    category: "Reader Note",
    quote:
      "Finally, defence content that isn't just clickbait.",
    name: "Ritika Basera",
    role: "Reader",
    image: readerRitika,
  },
  {
    category: "Writing Note",
    quote:
      "The writing feels thoughtful and well put together. Great work!",
    name: "Shivam Kikan",
    role: "Reader",
    image: readerShivam,
  },
  {
    category: "Perspective",
    quote:
      "Every article feels like it gives me a new perspective.",
    name: "Bhumika",
    role: "Reader",
    image: readerBhumika,
  },
  {
    category: "Strategic Affairs",
    quote:
      "This feels like a page made for people who genuinely want to understand strategic affairs.",
    name: "Ayush Negi",
    role: "Reader",
    image: readerAyush,
  },
];

/* ============================================================
   EDITION STATS
   ============================================================ */

export const EDITION_STATS = [
  {
    value: "4",
    label: "Quarterly Editions",
    tagline: "A measured publishing rhythm",
    description:
      "Four releases each year — each edition built as a complete strategic argument, not a news cycle reaction.",
  },
  {
    value: PREMIUM_MAGAZINE_PRICE_RUPEES,
    prefix: "₹",
    label: "Per Dispatch",
    tagline: "Pay per essay, not per month",
    description:
      `Buy individual premium dispatches at ${PREMIUM_MAGAZINE_PRICE_LABEL} each. No recurring subscription, no paywall maze.`,
  },
  {
    value: "5",
    label: "Analytical Lenses",
    tagline: "One disciplined reading method",
    description:
      "Armament, doctrine, intelligence, terrain, and initiative — five lenses that turn noise into strategy.",
  },
];

/* ============================================================
   OJAS
   ============================================================ */

export const OJAS_PANELS = [
  {
    id: "forum",
    index: "01",
    label: "Annual Forum",
    headline: "Arguments sharpened in public",
    copy:
      "A yearly gathering where India's strategic community debates doctrine, deterrence, and national intent across disciplines and domains.",
    detail:
      "Keynotes - Panels - Working sessions - Land - Sea - Air - Cyber - Space - Statecraft",
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

/* ============================================================
   FAQ
   ============================================================ */

export const FAQ_ITEMS = [
  {
    question: `What exactly do I get for ${PREMIUM_MAGAZINE_PRICE_LABEL}?`,
    answer:
      "The complete first issue — all sixteen contributions, the full magazine, not a sample. It's yours to keep and re-read, on mobile or desktop, from the moment your payment clears.",
  },
  {
    question:
      "Is this a subscription? Will I be charged again?",
    answer:
      "No. Issue I is a single purchase — one payment, no auto-renewal, nothing recurring. A full subscription opens in July with our new website, but it will always sit alongside the option to buy a single issue. You commit to nothing today beyond this one issue.",
  },
  {
    question:
      "I've never read defence or strategy writing. Is this for me?",
    answer:
      "Yes — that's exactly who it's for. ADITI takes the depth of a strategic briefing and writes it in plain language. You don't need a defence background.",
  },
  {
    question: "Who actually writes it?",
    answer:
      "India's most senior strategic voices — veterans who commanded at the highest levels of the Army, Navy and Air Force, alongside the scholars shaping the strategic discourse",
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
    question:
      "When is the next issue, and will I get it?",
    answer:
      "Issue II — Forging the Republic's Power — arrives in July. Buy Issue I now and you'll be reading ADITI from its very first edition — first in line for every issue that follows.",
  },
];

export {
  heroVideo,
  heroMobileVideo,
  frameworkBg,
  logoMark,
  navbarLogo,
};