import React, { useState } from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import {
  MARKETPLACE_APPS,
  MarketplaceApp,
  AppCategory,
} from "@/lib/marketplaceCatalog";
import { PROJECT_STUDIO_URL, launchErrantNight } from "@/lib/externalLinks";
import {
  FaDownload,
  FaExternalLinkAlt,
  FaAndroid,
  FaGlobe,
  FaSearch,
  FaMobileAlt,
  FaGamepad,
  FaTools,
  FaCheck,
  FaInfoCircle,
  FaQuestionCircle,
  FaTimes,
  FaArrowRight,
  FaLayerGroup,
  FaPlay,
} from "react-icons/fa";

export default function MarketplacePage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  const filteredApps = MARKETPLACE_APPS.filter((app) => {
    const matchesCat =
      selectedCategory === "all" ||
      (selectedCategory === "mobile" && app.currentRelease.availability === "apk-available") ||
      app.category === selectedCategory;

    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  const handleDownloadApk = (app: MarketplaceApp) => {
    if (app.currentRelease.availability !== "apk-available" || !app.currentRelease.downloadUrl) {
      setSelectedApp(app);
      return;
    }

    setDownloadNotification(
      `Starting APK download for ${app.name} (${app.currentRelease.version})...`
    );
    setTimeout(() => {
      setDownloadNotification(null);
    }, 4500);

    if (app.currentRelease.downloadUrl.startsWith("http")) {
      window.location.assign(app.currentRelease.downloadUrl);
    } else {
      const a = document.createElement("a");
      a.href = app.currentRelease.downloadUrl;
      a.download = `${app.id}-${app.currentRelease.version}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleLaunchDemo = (demoUrl?: string) => {
    if (!demoUrl) return;
    if (demoUrl === "/errant-night" || demoUrl.endsWith("/errant-night")) {
      launchErrantNight();
    } else if (demoUrl.startsWith("http")) {
      window.open(demoUrl, "_blank", "noopener,noreferrer");
    } else {
      setLocation(demoUrl);
    }
  };

  const handleRequestCustomVersion = () => {
    window.open(PROJECT_STUDIO_URL, "_blank", "noopener,noreferrer");
  };

  const categories: {
    id: AppCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "all", label: "All Releases", icon: FaLayerGroup },
    { id: "games", label: "Games", icon: FaGamepad },
    { id: "mobile", label: "Android APKs", icon: FaMobileAlt },
    { id: "tools", label: "Studio & Web Tools", icon: FaTools },
  ];

  return (
    <StudioLayout>
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 2xl:px-10 py-8 sm:py-12">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-bold uppercase tracking-wider mb-3">
            <FaLayerGroup className="text-[#7c3aed]" />
            <span>Every Nation Releases &amp; Showcase</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-3">
            Games &amp; Software Marketplace
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Download official Android builds, launch our live browser games, or explore the web and mobile software we engineer for clients.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setInstallGuideOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-[#7c3aed] font-semibold bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <FaQuestionCircle className="text-amber-500" />
              <span>How to install Android APK files</span>
            </button>

            <button
              onClick={handleRequestCustomVersion}
              className="inline-flex items-center gap-1.5 text-xs text-[#7c3aed] hover:text-[#6d28d9] font-bold bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-full border border-purple-200 transition-colors cursor-pointer"
            >
              <FaTools className="text-[#7c3aed]" />
              <span>Launch VISIEN AI Discovery Platform →</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-neutral-50/80 p-3 sm:p-4 rounded-2xl border border-neutral-200">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto [scrollbar-width:none] pb-1 md:pb-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#7c3aed] text-white shadow-xs"
                      : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200"
                  }`}
                >
                  <Icon className="text-xs" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games, apps, features..."
              className="w-full bg-white text-neutral-900 text-xs pl-9 pr-4 py-2 rounded-xl border border-neutral-200 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all"
            />
          </div>
        </div>

        {downloadNotification && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <FaDownload className="text-emerald-600 animate-bounce" />
              <span>{downloadNotification}</span>
            </div>
            <button
              onClick={() => setInstallGuideOpen(true)}
              className="text-[#7c3aed] hover:underline font-bold cursor-pointer"
            >
              View Install Steps
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => {
            const hasApk = app.currentRelease.availability === "apk-available" && Boolean(app.currentRelease.downloadUrl);
            const hasDemo = Boolean(app.currentRelease.demoUrl);

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                <div>
                  <div
                    className="h-32 sm:h-36 w-full bg-neutral-900 relative bg-cover bg-center overflow-hidden"
                    style={{ backgroundImage: `url('${app.bannerImage}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-xs ${app.badgeColor}`}
                      >
                        {app.badge}
                      </span>

                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-white text-xs">
                        {hasApk && (
                          <span title="Android APK Ready">
                            <FaAndroid className="text-emerald-400" />
                          </span>
                        )}
                        {app.platforms.includes("web") && (
                          <span title="Web App">
                            <FaGlobe className="text-sky-400" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute -bottom-4 left-4 w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-md p-1.5 flex items-center justify-center overflow-hidden z-10">
                      <img
                        src={app.icon}
                        alt={app.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="p-5 pt-6 space-y-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-[#7c3aed] transition-colors leading-tight">
                        {app.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#f97316] mt-0.5 leading-snug">
                        {app.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {app.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="bg-neutral-100 text-neutral-700 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        >
                          {h}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="font-mono font-bold text-neutral-700">
                        {app.currentRelease.version}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          hasApk
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {app.currentRelease.apkSize}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {hasApk ? (
                      <button
                        onClick={() => handleDownloadApk(app)}
                        className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FaDownload className="text-xs" />
                        <span>Get APK</span>
                      </button>
                    ) : hasDemo ? (
                      <button
                        onClick={() => handleLaunchDemo(app.currentRelease.demoUrl)}
                        className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FaPlay className="text-[10px]" />
                        <span>Open Web App</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FaInfoCircle className="text-xs" />
                        <span>Preview</span>
                      </button>
                    )}

                    {hasApk && hasDemo ? (
                      <button
                        onClick={() => handleLaunchDemo(app.currentRelease.demoUrl)}
                        className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FaExternalLinkAlt className="text-xs" />
                        <span>Play on Web</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FaInfoCircle className="text-xs" />
                        <span>Details &amp; Specs</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedApp(app)}
                    className="w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold text-neutral-500 hover:text-[#7c3aed] hover:bg-purple-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View Release Notes &amp; Tech Stack</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
            <FaMobileAlt className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-neutral-700">No Matching Releases Found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your search query or selecting &quot;All Releases&quot; above.
            </p>
          </div>
        )}

        <div className="mt-16 bg-gradient-to-r from-neutral-900 via-purple-950 to-neutral-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              <FaTools />
              <span>Custom Web &amp; Mobile Engineering</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              Need a custom web platform or mobile app for your business?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              We design and build custom web portals, Android applications, and real-time multiplayer systems. Open our Project Studio to outline your goals and get a clear technical roadmap.
            </p>
          </div>

          <button
            onClick={handleRequestCustomVersion}
            className="shrink-0 bg-white hover:bg-neutral-100 text-[#7c3aed] font-extrabold text-xs sm:text-sm uppercase tracking-wider px-8 py-3.5 rounded-full shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>Start a Project</span>
            <FaArrowRight className="text-xs" />
          </button>
        </div>
      </div>

      {selectedApp && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedApp(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 p-1.5 flex items-center justify-center border border-neutral-200">
                  <img
                    src={selectedApp.icon}
                    alt={selectedApp.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{selectedApp.name}</h3>
                  <p className="text-xs text-[#f97316] font-semibold">{selectedApp.tagline}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">{selectedApp.description}</p>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                What&apos;s Included in {selectedApp.currentRelease.version}
              </h4>
              <ul className="space-y-1 text-xs text-neutral-700">
                {selectedApp.currentRelease.whatsNew.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#7c3aed] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Key Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedApp.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                    <FaCheck className="text-emerald-500 text-[10px] shrink-0" />
                    <span className="text-neutral-800">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Architecture &amp; Technologies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedApp.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="bg-neutral-100 text-neutral-700 text-[10px] font-mono px-2 py-0.5 rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex flex-wrap gap-2">
              {selectedApp.currentRelease.availability === "apk-available" &&
                selectedApp.currentRelease.downloadUrl && (
                  <button
                    onClick={() => {
                      handleDownloadApk(selectedApp);
                      setSelectedApp(null);
                    }}
                    className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaDownload />
                    <span>Download APK ({selectedApp.currentRelease.apkSize})</span>
                  </button>
                )}

              {selectedApp.currentRelease.demoUrl && (
                <button
                  onClick={() => {
                    const url = selectedApp.currentRelease.demoUrl;
                    setSelectedApp(null);
                    handleLaunchDemo(url);
                  }}
                  className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaExternalLinkAlt className="text-xs" />
                  <span>Open Web Version</span>
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedApp(null);
                  handleRequestCustomVersion();
                }}
                className="bg-purple-50 text-[#7c3aed] hover:bg-purple-100 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Scope with VISIEN AI
              </button>
            </div>
          </div>
        </div>
      )}

      {installGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setInstallGuideOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <FaAndroid className="text-emerald-500 text-lg" />
                <span>How to Install Android APKs</span>
              </h3>
              <button
                onClick={() => setInstallGuideOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Android allows direct installation of official studio `.apk` packages:
            </p>

            <ol className="space-y-3 text-xs text-neutral-700">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-neutral-900">Download the .apk:</strong> Tap &quot;Get APK&quot; on Errant Night to download the release package.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-neutral-900">Allow browser installation:</strong> If prompted by Android, enable &quot;Install unknown apps&quot; for your browser.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-neutral-900">Launch &amp; Play:</strong> Tap Install, then open the game from your home screen.
                </div>
              </li>
            </ol>

            <div className="pt-2 border-t border-neutral-100">
              <button
                onClick={() => setInstallGuideOpen(false)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </StudioLayout>
  );
}
