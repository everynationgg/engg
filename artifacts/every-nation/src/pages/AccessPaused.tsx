import { Link } from "wouter";

type PausedScreenProps = {
  eyebrow: string;
  title: string;
  message: string;
  status: string;
  telemetry: readonly string[];
  accent: "cyan" | "violet";
};

const accentStyles = {
  cyan: {
    text: "text-cyan-300",
    border: "border-cyan-300/35",
    bg: "bg-cyan-300/10",
    shadow: "shadow-[0_0_80px_rgba(34,211,238,0.18)]",
    line: "from-transparent via-cyan-300/70 to-transparent",
  },
  violet: {
    text: "text-fuchsia-300",
    border: "border-fuchsia-300/35",
    bg: "bg-fuchsia-300/10",
    shadow: "shadow-[0_0_80px_rgba(217,70,239,0.18)]",
    line: "from-transparent via-fuchsia-300/70 to-transparent",
  },
} as const;

function PausedScreen({ eyebrow, title, message, status, telemetry, accent }: PausedScreenProps) {
  const theme = accentStyles[accent];

  return (
    <main className="relative flex min-h-[calc(100dvh-120px)] items-center justify-center overflow-hidden bg-black px-5 py-12 text-white sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(34,211,238,0.14), transparent 32%), radial-gradient(circle at 70% 72%, rgba(217,70,239,0.12), transparent 30%), linear-gradient(180deg, rgba(2,6,23,0.72), rgba(0,0,0,0.98))",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-20 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-24 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden="true" />

      <section className="relative flex min-h-[620px] w-full max-w-4xl flex-col items-center justify-center text-center">
        <div className={`absolute left-1/2 top-1/2 h-[min(74vw,520px)] w-[min(74vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border ${theme.border} ${theme.shadow}`} aria-hidden="true" />
        <div className={`absolute left-1/2 top-1/2 h-[min(50vw,360px)] w-[min(50vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${theme.border}`} aria-hidden="true" />

        <div className="relative w-full border border-white/10 bg-black/45 px-5 py-10 shadow-2xl backdrop-blur-md sm:px-10 sm:py-12">
          <div className={`mx-auto mb-7 h-px w-44 bg-gradient-to-r ${theme.line}`} aria-hidden="true" />
          <p className={`font-mono text-[9px] uppercase tracking-[0.42em] ${theme.text}`}>{eyebrow}</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-orbitron text-3xl font-black uppercase leading-tight tracking-[0.18em] text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            {message}
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {telemetry.map((item) => (
              <div key={item} className="border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="block font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/hub"
              className={`inline-flex min-h-12 items-center justify-center border ${theme.border} ${theme.bg} px-6 py-3 font-orbitron text-[10px] font-bold uppercase tracking-[0.28em] ${theme.text} transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/60`}
            >
              Return To Hub
            </Link>
            <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/34">{status}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AuthAccessPaused() {
  return (
    <PausedScreen
      accent="cyan"
      eyebrow="Identity Access Paused"
      title="Public Login Offline"
      message="Identity terminals are temporarily sealed while access protocols are recalibrated. Game and hub navigation remain available."
      status="AUTH_PUBLIC_ACCESS_ENABLED=false"
      telemetry={["Login Hidden", "Forms Sealed", "Profiles Gated"]}
    />
  );
}

export function ShopOffline() {
  return (
    <PausedScreen
      accent="violet"
      eyebrow="Vault Access Temporarily Offline"
      title="Game Shop Under Construction"
      message="Credit systems are being recalibrated. The vault is offline until the next deployment window, and no purchase controls are available."
      status="SHOP_ENABLED=false"
      telemetry={["Vault Offline", "Purchases Disabled", "Credits Safe"]}
    />
  );
}
