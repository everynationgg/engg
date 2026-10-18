import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaMagic,
  FaLightbulb,
  FaRedo,
} from "react-icons/fa";
import { OrbState } from "./EnosOrb";
import { VISIEN_CORE_QUESTIONS } from "@/lib/visienData";

export interface ChatMessage {
  id: string;
  sender: "enos" | "user";
  text: string;
  timestamp: string;
  chips?: string[];
  blueprintData?: {
    appType?: string;
    targetPlatform?: string;
    coreProblem?: string;
    keyFeatures?: string[];
    timelineBudget?: string;
  };
}

interface VisienChatProps {
  onStateChange?: (state: OrbState) => void;
  compact?: boolean;
  preloadedPrompt?: string;
}

export default function VisienChat({
  onStateChange,
  compact = false,
  preloadedPrompt,
}: VisienChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "enos",
      text: "Greetings! I am Enos, your VISIEN AI guide at Every Nation GG. I'm here to answer your questions, assist your customer inquiries, and transform your vision into a production-ready application blueprint.",
      timestamp: "Just now",
      chips: [
        "What kind of mobile APKs can ENGG build?",
        "How much does a custom app or game cost?",
        "Start Guided Discovery (Step-by-step)",
        "How do I track an existing project build?",
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [discoveredBlueprint, setDiscoveredBlueprint] = useState<{
    appType?: string;
    coreProblem?: string;
    targetPlatform?: string;
    keyFeatures?: string[];
    timelineBudget?: string;
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (preloadedPrompt) {
      handleUserSubmit(preloadedPrompt);
    }
  }, [preloadedPrompt]);

  const handleUserSubmit = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);
    onStateChange?.("thinking");

    setTimeout(() => {
      respondToInput(text.trim());
    }, 750);
  };

  const respondToInput = (input: string) => {
    const lower = input.toLowerCase();
    let replyText = "";
    let replyChips: string[] = [];
    let blueprintUpdate = { ...discoveredBlueprint };

    if (lower.includes("start guided discovery") || lower.includes("step-by-step") || lower.includes("guided")) {
      setStepIndex(0);
      const q = VISIEN_CORE_QUESTIONS[0];
      replyText = `Excellent! Let's build your project blueprint step-by-step.\n\n**Step 1 of ${VISIEN_CORE_QUESTIONS.length} — ${q.chapterTitle}**:\n${q.title}\n\n*${q.guidance}*`;
      replyChips = q.chips;
    } else if (stepIndex !== null && stepIndex < VISIEN_CORE_QUESTIONS.length) {
      const currentQ = VISIEN_CORE_QUESTIONS[stepIndex];

      if (currentQ.id === "app_type") blueprintUpdate.appType = input;
      if (currentQ.id === "bottleneck_problem") blueprintUpdate.coreProblem = input;
      if (currentQ.id === "platform_distribution") blueprintUpdate.targetPlatform = input;
      if (currentQ.id === "essential_features") {
        blueprintUpdate.keyFeatures = [input];
      }
      if (currentQ.id === "timeline_budget") blueprintUpdate.timelineBudget = input;

      setDiscoveredBlueprint(blueprintUpdate);

      const nextStep = stepIndex + 1;
      if (nextStep < VISIEN_CORE_QUESTIONS.length) {
        setStepIndex(nextStep);
        const nextQ = VISIEN_CORE_QUESTIONS[nextStep];
        replyText = `Noted: "${input}"\n\n**Step ${nextStep + 1} of ${VISIEN_CORE_QUESTIONS.length} — ${nextQ.chapterTitle}**:\n${nextQ.title}\n\n*${nextQ.guidance}*`;
        replyChips = nextQ.chips;
      } else {
        setStepIndex(null);
        replyText = `🎉 **Discovery Complete! Here is your generated ENGG Project Blueprint:**\n\n` +
          `• **Application Concept**: ${blueprintUpdate.appType || "Custom Application"}\n` +
          `• **Primary Problem Solved**: ${blueprintUpdate.coreProblem || "Streamlined operation"}\n` +
          `• **Platform & APK**: ${blueprintUpdate.targetPlatform || "Mobile APK & Web App"}\n` +
          `• **Core Features**: ${blueprintUpdate.keyFeatures?.join(", ") || "User system, dashboard, automation"}\n` +
          `• **Target Horizon**: ${blueprintUpdate.timelineBudget || "Standard MVP roadmap"}\n\n` +
          `Your specifications have been structured. You can download this technical brief or submit it directly to the Every Nation GG development studio for an official proposal.`;
        replyChips = [
          "Submit Blueprint to ENGG Engineers",
          "Ask another question",
          "Browse Marketplace APKs",
        ];
      }
    } else if (lower.includes("apk") || lower.includes("mobile") || lower.includes("android") || lower.includes("download")) {
      replyText = `Yes! Every Nation GG engineers direct **Android APKs** as well as responsive web apps and iOS PWAs.\n\n` +
        `• **Clean, lightweight APKs**: Built with React Native, Capacitor, or optimized WebViews targeting 60 FPS.\n` +
        `• **Direct Sideloading**: Clients and users can download \`.apk\` files directly from our Marketplace without waiting for app store bottlenecks.\n` +
        `• **Enterprise & Private Builds**: Ideal for internal team tools, POS systems, private multiplayer games, and early-access customer apps.\n\n` +
        `Check our **Marketplace** page to test live downloadable APK samples we've already built!`;
      replyChips = [
        "Go to Marketplace APKs",
        "How do I install an APK?",
        "Start Guided Discovery (Step-by-step)",
      ];
    } else if (lower.includes("cost") || lower.includes("price") || lower.includes("budget") || lower.includes("pricing") || lower.includes("rate")) {
      replyText = `At ENGG, we tailor custom software and mobile applications around real project requirements rather than fixed markups:\n\n` +
        `• **Rapid Prototype / Mobile APK Demo**: typically $350 - $800 (1 - 2 weeks turnaround)\n` +
        `• **Production MVP (Mobile APK + Web Portal + Database)**: typically $1,000 - $2,500\n` +
        `• **Full-Scale Ecosystem (Real-time multiplayer, AI, custom POS, SaaS)**: bespoke quotation based on milestones.\n\n` +
        `Would you like to run a 2-minute Guided Discovery to get an exact scope recommendation?`;
      replyChips = [
        "Start Guided Discovery (Step-by-step)",
        "What tech stack do you use?",
        "Speak with a Human Engineer on Discord",
      ];
    } else if (lower.includes("track") || lower.includes("status") || lower.includes("session") || lower.includes("code")) {
      replyText = `You can track active project builds anytime using our **Project Tracker** tab! Just enter your token code (such as \`929-909\` or \`ENGG-770\`) or your client name to view live engineering stages, completed deliverables, and status updates.`;
      replyChips = [
        "View Demo Session 929-909",
        "View Demo Session ENGG-770",
        "Start Guided Discovery (Step-by-step)",
      ];
    } else if (lower.includes("tech") || lower.includes("stack") || lower.includes("framework") || lower.includes("language")) {
      replyText = `Every Nation GG builds with modern, high-performance technologies:\n\n` +
        `• **Frontend & Mobile**: React 19, TypeScript, Tailwind CSS, Vite, Capacitor for Android APK packaging, Three.js / WebGL\n` +
        `• **Backend & Real-Time**: Node.js, Express, Socket.IO (for real-time multiplayer lobbies & alerts)\n` +
        `• **Database & Cloud**: PostgreSQL, Drizzle ORM, Supabase, Fly.io, Vercel\n` +
        `• **AI & Automation**: Google Gemini 2.5 Flash, structured tool calling, custom agentic workflows`;
      replyChips = [
        "Can you build a mobile APK for my business?",
        "Start Guided Discovery (Step-by-step)",
        "Browse Marketplace",
      ];
    } else {
      replyText = `Thank you for sharing that! As an independent software & gaming studio, Every Nation GG can develop custom mobile APKs, web systems, interactive tools, and automated platforms tailored specifically to your needs.\n\n` +
        `How would you like to proceed?`;
      replyChips = [
        "Start Guided Discovery (Step-by-step)",
        "What kind of mobile APKs can ENGG build?",
        "How much does a custom app cost?",
        "Join Discord Community",
      ];
    }

    onStateChange?.("speaking");

    const enosMsg: ChatMessage = {
      id: `enos-${Date.now()}`,
      sender: "enos",
      text: replyText,
      timestamp: "Now",
      chips: replyChips,
      blueprintData: stepIndex === null && Object.keys(blueprintUpdate).length > 0 ? blueprintUpdate : undefined,
    };

    setMessages((prev) => [...prev, enosMsg]);
    setIsTyping(false);

    setTimeout(() => {
      onStateChange?.("idle");
    }, 1200);
  };

  const handleResetChat = () => {
    setStepIndex(null);
    setDiscoveredBlueprint({});
    setMessages([
      {
        id: "welcome-reset",
        sender: "enos",
        text: "Session refreshed. How can I assist you with your project or inquiries today?",
        timestamp: "Now",
        chips: [
          "What kind of mobile APKs can ENGG build?",
          "Start Guided Discovery (Step-by-step)",
          "How much does a custom app cost?",
          "How do I track an existing project build?",
        ],
      },
    ]);
    onStateChange?.("idle");
  };

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-neutral-200/90 shadow-xl overflow-hidden ${compact ? "h-[480px]" : "h-[620px] 2xl:h-[680px]"}`}>
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white px-4 py-3 flex items-center justify-between border-b border-purple-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/40">
            <FaRobot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight">VISIEN AI Customer Guide</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-semibold">
                Online
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 leading-none">
              Client Support, Scope Discovery & Mobile APK Consultation
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          title="Reset conversation"
          className="text-xs text-purple-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1"
        >
          <FaRedo className="w-3 h-3" />
          <span className="hidden sm:inline text-[11px]">New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isEnos = msg.sender === "enos";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 max-w-[88%] sm:max-w-[80%] ${isEnos ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs mt-1 ${
                    isEnos
                      ? "bg-[#7c3aed] text-white shadow-xs"
                      : "bg-neutral-800 text-white"
                  }`}
                >
                  {isEnos ? <FaMagic className="w-3.5 h-3.5" /> : <FaUser className="w-3 h-3" />}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs whitespace-pre-line ${
                      isEnos
                        ? "bg-white text-neutral-800 border border-neutral-200/90 rounded-tl-xs"
                        : "bg-[#7c3aed] text-white rounded-tr-xs"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {isEnos && msg.chips && msg.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 pt-1">
                      {msg.chips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleUserSubmit(chip)}
                          className="bg-purple-50 hover:bg-purple-100/90 border border-purple-200 text-[#7c3aed] hover:text-[#6d28d9] px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95 flex items-center gap-1 shadow-2xs"
                        >
                          <FaLightbulb className="w-2.5 h-2.5 text-amber-500" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 pl-9">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-ping" />
            <span>Enos AI is formulating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUserSubmit(inputVal);
        }}
        className="p-3 bg-white border-t border-neutral-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask Enos about apps, mobile APKs, pricing, or your project..."
          className="flex-1 bg-neutral-100 hover:bg-neutral-50 focus:bg-white text-neutral-900 placeholder:text-neutral-400 text-xs sm:text-sm px-4 py-2.5 rounded-full border border-neutral-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all"
        />

        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 text-white w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all active:scale-95"
          aria-label="Send message"
        >
          <FaPaperPlane className="w-3.5 h-3.5 ml-[-1px]" />
        </button>
      </form>
    </div>
  );
}
