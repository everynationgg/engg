import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaCheckCircle,
  FaHourglassHalf,
  FaCogs,
  FaRocket,
  FaInfoCircle,
  FaClock,
  FaUserCheck,
} from "react-icons/fa";
import { resolveSessionCode, TrackedProject } from "@/lib/visienData";

interface VisienSessionTrackerProps {
  initialCode?: string;
  onAskAboutProject?: (projectName: string) => void;
}

export default function VisienSessionTracker({
  initialCode = "929-909",
  onAskAboutProject,
}: VisienSessionTrackerProps) {
  const [inputCode, setInputCode] = useState(initialCode);
  const [currentProject, setCurrentProject] = useState<TrackedProject | null>(() =>
    resolveSessionCode(initialCode)
  );
  const [searched, setSearched] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const project = resolveSessionCode(inputCode);
    setCurrentProject(project);
    setSearched(true);
  };

  const getStatusBadge = (status: TrackedProject["status"]) => {
    switch (status) {
      case "ready":
        return {
          label: "Ready for Download / Launch",
          color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
          icon: FaRocket,
        };
      case "processing":
        return {
          label: "Engineering & APK Compilation",
          color: "bg-amber-500/15 text-amber-600 border-amber-500/30",
          icon: FaCogs,
        };
      case "conceptualizing":
        return {
          label: "Discovery & Blueprint Drafting",
          color: "bg-purple-500/15 text-purple-600 border-purple-500/30",
          icon: FaHourglassHalf,
        };
      case "received":
      default:
        return {
          label: "Inquiry Received",
          color: "bg-blue-500/15 text-blue-600 border-blue-500/30",
          icon: FaUserCheck,
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xl p-6 sm:p-8 space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1 flex items-center gap-2">
          <span>Project & APK Build Status Tracker</span>
        </h3>
        <p className="text-xs sm:text-[13px] text-neutral-500 mb-4">
          Enter your private session token, client reference code, or name to check live build status.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. 929-909, ENGG-770, or client name"
              className="w-full bg-neutral-100 hover:bg-neutral-50 focus:bg-white text-neutral-900 text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            Track
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-neutral-400">
          <span>Demo sessions:</span>
          {["929-909", "ENGG-770", "DEMO-101"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setInputCode(code);
                setCurrentProject(resolveSessionCode(code));
                setSearched(true);
              }}
              className="bg-neutral-100 hover:bg-purple-100 text-neutral-600 hover:text-[#7c3aed] px-2 py-0.5 rounded-md font-mono text-[10px] transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {currentProject ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="border border-neutral-200 rounded-2xl p-5 sm:p-6 bg-neutral-50/70 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                Session Code: <span className="font-bold text-[#7c3aed]">{currentProject.token}</span>
              </div>
              <h4 className="text-base sm:text-xl font-black text-neutral-900 mt-0.5">
                {currentProject.appName}
              </h4>
              <p className="text-xs text-neutral-600 mt-0.5">
                Client: <span className="font-semibold text-neutral-800">{currentProject.clientName}</span>
              </p>
            </div>

            {(() => {
              const badge = getStatusBadge(currentProject.status);
              const BadgeIcon = badge.icon;
              return (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}
                >
                  <BadgeIcon className="w-3.5 h-3.5" />
                  <span>{badge.label}</span>
                </div>
              );
            })()}
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-neutral-700">Engineering Completion</span>
              <span className="font-black text-[#7c3aed]">{currentProject.progressPercent}%</span>
            </div>
            <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7c3aed] to-[#f97316] h-full rounded-full transition-all duration-700"
                style={{ width: `${currentProject.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-neutral-600 mt-2 font-medium">
              {currentProject.statusDesc}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Deliverables & Milestones
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentProject.deliverables.map((item, dIdx) => (
                <div
                  key={dIdx}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${
                    item.completed
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold"
                      : "bg-white border-neutral-200 text-neutral-500"
                  }`}
                >
                  <FaCheckCircle
                    className={`w-3.5 h-3.5 shrink-0 ${
                      item.completed ? "text-emerald-500" : "text-neutral-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 pt-3 border-t border-neutral-200/80">
            <div className="flex items-center gap-1.5">
              <FaClock className="text-neutral-400" />
              <span>Last engineering update: {currentProject.updatedAt}</span>
            </div>

            {onAskAboutProject && (
              <button
                type="button"
                onClick={() => onAskAboutProject(currentProject.appName)}
                className="text-[#7c3aed] hover:underline font-bold text-xs"
              >
                Ask VISIEN about this build →
              </button>
            )}
          </div>
        </motion.div>
      ) : searched ? (
        <div className="p-8 text-center border border-dashed border-neutral-300 rounded-2xl bg-neutral-50">
          <FaInfoCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-neutral-700">No Active Session Found</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            We couldn't find a build linked to "{inputCode}". Try one of the demo tokens above, or start a new discovery session with VISIEN.
          </p>
        </div>
      ) : null}
    </div>
  );
}
