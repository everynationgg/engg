export interface VisienQuestion {
  id: string;
  chapter: number;
  chapterTitle: string;
  number: number;
  title: string;
  guidance: string;
  chips: string[];
}

export interface VisienChapter {
  id: number;
  title: string;
  subtitle: string;
}

export const VISIEN_CHAPTERS: VisienChapter[] = [
  { id: 1, title: "Concept & Idea", subtitle: "Problem, audience & core value" },
  { id: 2, title: "Platform & APK", subtitle: "Mobile APK, Web App & user flow" },
  { id: 3, title: "Features & Vibe", subtitle: "Key functionality & design style" },
  { id: 4, title: "Scope & Timeline", subtitle: "V1 requirements & target launch" },
];

export const VISIEN_CORE_QUESTIONS: VisienQuestion[] = [
  {
    id: "app_type",
    chapter: 1,
    chapterTitle: "Concept & Idea",
    number: 1,
    title: "What kind of app or project are you looking to create?",
    guidance: "Whether you have a specific app concept or an open idea for your business or gaming community, let's shape it together.",
    chips: [
      "Mobile App (Android APK / iOS)",
      "Business / Client Management System",
      "Multiplayer Web Game / Interactive Portal",
      "AI Chatbot or Customer Assistant",
      "I have an idea — help me brainstorm!",
    ],
  },
  {
    id: "bottleneck_problem",
    chapter: 1,
    chapterTitle: "Concept & Idea",
    number: 2,
    title: "What is the primary challenge or bottleneck this app will solve?",
    guidance: "Describe where things get messy, slow, or difficult without this solution.",
    chips: [
      "Inquiries & orders get lost across chats",
      "Manual coordination & spreadsheets take too long",
      "Customers lack a simple self-service mobile app",
      "Need a custom gaming lobby or community platform",
      "Off-the-shelf software is too clunky and expensive",
    ],
  },
  {
    id: "platform_distribution",
    chapter: 2,
    chapterTitle: "Platform & APK",
    number: 3,
    title: "How do you want users and clients to access your app?",
    guidance: "We can package your app as a standalone Android APK, a fast responsive Web App, or both.",
    chips: [
      "Direct Android APK download for mobile",
      "Responsive Web App accessible in any browser",
      "Hybrid (Android APK + Web Portal)",
      "Desktop / Tablet kiosk mode",
    ],
  },
  {
    id: "essential_features",
    chapter: 3,
    chapterTitle: "Features & Vibe",
    number: 4,
    title: "What are the core features you must have for Version 1?",
    guidance: "Focus on the must-have capabilities for launch. We can always plan secondary features for future phases.",
    chips: [
      "User Accounts & Secure Login",
      "Catalog / Booking / Order Checkout",
      "Real-time Chat & Push Notifications",
      "Admin Dashboard with Analytics",
      "AI Assistant / Automated Responses",
    ],
  },
  {
    id: "timeline_budget",
    chapter: 4,
    chapterTitle: "Scope & Timeline",
    number: 5,
    title: "What is your target launch horizon and budget expectation?",
    guidance: "This helps ENGG tailor the architecture and recommend the best development roadmap for your budget.",
    chips: [
      "Rapid prototype (1 - 2 weeks)",
      "Production MVP (3 - 6 weeks)",
      "Flexible timeline / Staged milestones",
      "Standard MVP budget ($500 - $1,500)",
      "Full custom ecosystem ($2,000+)",
    ],
  },
];

export interface TrackedProject {
  token: string;
  clientName: string;
  appName: string;
  status: "received" | "conceptualizing" | "processing" | "ready";
  statusTitle: string;
  statusDesc: string;
  updatedAt: string;
  progressPercent: number;
  deliverables: { name: string; completed: boolean }[];
  notes?: string;
}

export const MOCK_PROJECT_SESSIONS: Record<string, TrackedProject> = {
  "929-909": {
    token: "929-909",
    clientName: "Every Nation Operations",
    appName: "VISIEN Discovery Engine v2",
    status: "processing",
    statusTitle: "Engineering Phase: APK Packaging & API Binding",
    statusDesc: "Core discovery engine active. Building production Android APK build and integrating real-time project sync.",
    updatedAt: "Today, 11:42 AM",
    progressPercent: 75,
    deliverables: [
      { name: "Concept Discovery & Architectural Brief", completed: true },
      { name: "UI Design & Interactive Prototype", completed: true },
      { name: "Android APK Build & Sideload Testing", completed: true },
      { name: "Production Deployment & CDN Sync", completed: false },
    ],
    notes: "Client requested lightweight APK target under 25MB with offline discovery caching.",
  },
  "ENGG-770": {
    token: "ENGG-770",
    clientName: "Solstice Tactical",
    appName: "Errant Night Mobile Port",
    status: "ready",
    statusTitle: "Ready for Download & Client Review",
    statusDesc: "v1.3.4 APK generated and validated across test devices. Ready for deployment.",
    updatedAt: "Yesterday, 4:15 PM",
    progressPercent: 100,
    deliverables: [
      { name: "Mobile Touch Grid Controls", completed: true },
      { name: "Socket.IO Multi-room Lobby Sync", completed: true },
      { name: "APK Build v1.3.4 Release", completed: true },
      { name: "User Documentation & Install Guide", completed: true },
    ],
    notes: "Direct APK download link available in the Marketplace.",
  },
  "DEMO-101": {
    token: "DEMO-101",
    clientName: "Aether Clinic",
    appName: "OmniFlow Appointment & Order APK",
    status: "conceptualizing",
    statusTitle: "Discovery & Blueprint Drafting",
    statusDesc: "Synthesizing booking workflows and automated SMS notification architecture.",
    updatedAt: "2 days ago",
    progressPercent: 35,
    deliverables: [
      { name: "Business Discovery & Pain Point Mapping", completed: true },
      { name: "Database Schema & API Specifications", completed: true },
      { name: "Mobile Wireframes & Flow Mockup", completed: false },
      { name: "Android APK Test Build", completed: false },
    ],
    notes: "Requires WhatsApp API and thermal printer Bluetooth sync.",
  },
};

export function resolveSessionCode(query: string): TrackedProject | null {
  const clean = query.trim().toUpperCase();
  if (MOCK_PROJECT_SESSIONS[clean]) {
    return MOCK_PROJECT_SESSIONS[clean];
  }
  const match = Object.values(MOCK_PROJECT_SESSIONS).find(
    (p) =>
      p.clientName.toLowerCase().includes(query.toLowerCase()) ||
      p.appName.toLowerCase().includes(query.toLowerCase())
  );
  if (match) return match;

  if (query.trim().length >= 3) {
    return {
      token: query.trim(),
      clientName: query.trim().length < 8 ? `Client #${query.trim()}` : query.trim(),
      appName: "Custom Software & Mobile App Build",
      status: "received",
      statusTitle: "Inquiry Received & Enos AI Analyzing",
      statusDesc: "Your project parameters have been logged. The ENGG engineering team will review requirements within 24 hours.",
      updatedAt: "Just now",
      progressPercent: 15,
      deliverables: [
        { name: "Discovery Questionnaire Completed", completed: true },
        { name: "Engineering Feasibility Review", completed: false },
        { name: "Technical Proposal & Cost Breakdown", completed: false },
        { name: "Prototype / APK Milestone", completed: false },
      ],
      notes: "You can chat with VISIEN to refine your blueprint specifications at any time.",
    };
  }

  return null;
}
