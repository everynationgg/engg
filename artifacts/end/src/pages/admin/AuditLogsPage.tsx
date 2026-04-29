import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { Loader2, Search, Filter, ChevronDown, ChevronUp, Clock, User, Shield, Terminal } from "lucide-react";
import { playSciFiClick } from "@/lib/sound";

interface AuditLog {
  id: string;
  userId: string | null;
  eventType: string;
  description: string;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditLogsPage() {
  const { isLoggedIn, isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [sessionIdFilter, setSessionIdFilter] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Strictly protected by frontend check (backend also enforces this)
  if (!isLoggedIn) return <Redirect to="/" />;
  if (!isAdmin) return <Redirect to="/" />;

  const { data, isLoading, error } = useQuery<LogsResponse>({
    queryKey: ["admin", "logs", page, eventType, userIdFilter, sessionIdFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(eventType && { eventType }),
        ...(userIdFilter && { userId: userIdFilter }),
        ...(sessionIdFilter && { sessionId: sessionIdFilter }),
      });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/admin/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("lp_token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  const toggleExpand = (id: string) => {
    playSciFiClick();
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-200 font-sans pb-20 pt-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Terminal className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-orbitron font-bold tracking-widest text-cyan-400 uppercase">
                System Audit Vault
              </h1>
              <p className="text-xs text-cyan-500/60 font-mono tracking-tighter">
                SECURE CONSOLE // HIGH-FIDELITY EVENT STREAM
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Admin Authenticated</span>
          </div>
        </header>

        {/* Filters */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
          <div className="space-y-2">
            <label className="text-[10px] font-orbitron tracking-[0.2em] text-slate-500 uppercase">Event Protocol</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <select 
                value={eventType} 
                onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-md py-2 pl-10 pr-4 text-sm outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="">ALL PROTOCOLS</option>
                <optgroup label="Authentication">
                  <option value="AUTH_LOGIN_SUCCESS">LOGIN SUCCESS</option>
                  <option value="AUTH_LOGIN_FAILURE">LOGIN FAILURE</option>
                  <option value="AUTH_REGISTER_SUCCESS">REGISTRATION</option>
                </optgroup>
                <optgroup label="Gameplay">
                  <option value="GAME_START">GAME START</option>
                  <option value="GAME_ROUND_RESOLVED">ROUND RESOLVE</option>
                  <option value="PLAYER_ELIMINATED">ELIMINATION</option>
                </optgroup>
                <optgroup label="Economy">
                  <option value="CREDIT_SPEND_UNLOCK">ROLE UNLOCK</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-orbitron tracking-[0.2em] text-slate-500 uppercase">User ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input 
                type="text" 
                placeholder="UUID..."
                value={userIdFilter}
                onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-md py-2 pl-10 pr-4 text-sm outline-none focus:border-cyan-500/50 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-orbitron tracking-[0.2em] text-slate-500 uppercase">Session ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input 
                type="text" 
                placeholder="ROOM CODE..."
                value={sessionIdFilter}
                onChange={(e) => { setSessionIdFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-md py-2 pl-10 pr-4 text-sm outline-none focus:border-cyan-500/50 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button 
              onClick={() => { setEventType(""); setUserIdFilter(""); setSessionIdFilter(""); setPage(1); }}
              className="w-full h-10 border border-slate-800 hover:bg-slate-800/50 rounded-md text-xs font-orbitron tracking-widest uppercase transition-all"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* Content Table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-orbitron tracking-widest text-slate-500 uppercase">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-orbitron tracking-widest text-slate-500 uppercase">Protocol</th>
                <th className="px-6 py-4 text-[10px] font-orbitron tracking-widest text-slate-500 uppercase">Identity</th>
                <th className="px-6 py-4 text-[10px] font-orbitron tracking-widest text-slate-500 uppercase">Description</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
                    <p className="text-xs font-mono text-slate-500">SYNCHRONIZING WITH ARCHIVE...</p>
                  </td>
                </tr>
              ) : data?.logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-xs font-mono text-slate-500">NO RECORDS FOUND IN SPECIFIED PARAMETERS</p>
                  </td>
                </tr>
              ) : (
                data?.logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`group border-b border-slate-800/50 hover:bg-cyan-500/[0.03] transition-colors cursor-pointer ${expandedLogId === log.id ? 'bg-cyan-500/[0.03]' : ''}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-tighter uppercase ${
                          log.eventType.includes('SUCCESS') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          log.eventType.includes('FAILURE') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                          'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                        }`}>
                          {log.eventType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[11px] font-mono text-slate-500 truncate max-w-[120px] block">
                          {log.userId || "GUEST_LINK"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-300 line-clamp-1">{log.description}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {expandedLogId === log.id ? <ChevronUp className="w-4 h-4 text-slate-600 ml-auto" /> : <ChevronDown className="w-4 h-4 text-slate-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr className="bg-slate-950/80 border-b border-slate-800/50">
                        <td colSpan={5} className="px-8 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-orbitron tracking-widest text-cyan-500 uppercase">Trace Metadata</h4>
                              <div className="p-4 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] leading-relaxed overflow-x-auto">
                                <pre className="text-cyan-400/80">{JSON.stringify(log.metadata, null, 2)}</pre>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-orbitron tracking-widest text-slate-500 uppercase">Context Information</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between py-1 border-b border-slate-800/50">
                                  <span className="text-[10px] text-slate-500 uppercase">IP Address</span>
                                  <span className="text-[11px] font-mono text-slate-300">{log.ipAddress || "INTERNAL_SYSTEM"}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/50">
                                  <span className="text-[10px] text-slate-500 uppercase">Database ID</span>
                                  <span className="text-[11px] font-mono text-slate-300">{log.id}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/50">
                                  <span className="text-[10px] text-slate-500 uppercase">Auth Context</span>
                                  <span className="text-[11px] font-mono text-slate-300">{log.userId ? 'AUTHENTICATED' : 'ANONYMOUS'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <footer className="mt-6 flex items-center justify-between">
            <p className="text-[10px] font-mono text-slate-600">
              SHOWING {data.logs.length} OF {data.pagination.total} ENTRIES
            </p>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => { playSciFiClick(); setPage(p => p - 1); }}
                className="px-4 py-2 border border-slate-800 rounded text-[10px] font-orbitron tracking-widest uppercase disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center px-4 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-cyan-500">
                PAGE {page} // {data.pagination.totalPages}
              </div>
              <button 
                disabled={page === data.pagination.totalPages}
                onClick={() => { playSciFiClick(); setPage(p => p + 1); }}
                className="px-4 py-2 border border-slate-800 rounded text-[10px] font-orbitron tracking-widest uppercase disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}

import React from "react";
