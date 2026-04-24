import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaWallet, FaSignOutAlt, FaBars, FaTimes, FaGlobe } from "react-icons/fa";

export default function Navbar() {
  const { isLoggedIn, username, credits, logout } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Gaming Hub", href: "/hub" },
    { name: "Credit Shop", href: "/shop" },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${
        scrolled || isOpen 
          ? "bg-black/90 backdrop-blur-xl border-white/10 py-4" 
          : "bg-transparent border-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="w-8 h-8 border border-cyan-500/50 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
            <div className="w-4 h-4 bg-cyan-500 shadow-[0_0_10px_#00f3ff]" />
          </div>
          <span className="font-orbitron font-black text-lg tracking-[0.3em] uppercase text-white group-hover:text-cyan-400 transition-colors">
            Every<span className="text-cyan-400">Nation</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-12">
          {navLinks.map((link) => (
            link.external ? (
              <a 
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-orbitron text-[10px] uppercase tracking-[0.3em] text-white/60 hover:text-cyan-400 transition-colors"
              >
                {link.name}
              </a>
            ) : (
              <Link 
                key={link.name}
                href={link.href}
                className={`font-orbitron text-[10px] uppercase tracking-[0.3em] transition-colors ${
                  location === link.href ? "text-cyan-400" : "text-white/60 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            )
          ))}
        </div>

        {/* User HUD */}
        <div className="hidden lg:flex items-center gap-6 pl-12 border-l border-white/10">
          {isLoggedIn ? (
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="font-mono text-[9px] uppercase text-white/30 tracking-widest">Balance</span>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron text-sm text-cyan-400 font-bold">{credits}</span>
                  <span className="font-orbitron text-[9px] text-cyan-400/50">CC</span>
                </div>
              </div>
              
              <Link href="/profile" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-cyan-500/50 transition-all overflow-hidden">
                  <FaUser className="text-white/40 group-hover:text-cyan-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-orbitron text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white">{username}</span>
                  <span className="font-mono text-[8px] text-cyan-500/60 uppercase group-hover:text-cyan-400 tracking-[0.2em]">Verified_Account</span>
                </div>
              </Link>
              
              <button 
                onClick={logout}
                className="p-3 text-white/30 hover:text-red-400 transition-colors"
                title="Disconnect Session"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="px-6 py-2 bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em] text-white"
            >
              Initialize Connection
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/95 backdrop-blur-2xl border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-12 flex flex-col gap-8">
              {navLinks.map((link) => (
                link.external ? (
                  <a 
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    className="font-orbitron text-xs uppercase tracking-[0.4em] text-white/60"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link 
                    key={link.name}
                    href={link.href}
                    className={`font-orbitron text-xs uppercase tracking-[0.4em] ${
                      location === link.href ? "text-cyan-400" : "text-white/60"
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              
              <div className="pt-8 border-t border-white/10 flex flex-col gap-6">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] uppercase text-white/30 tracking-widest">Balance</span>
                        <div className="flex items-center gap-2">
                          <span className="font-orbitron text-lg text-cyan-400 font-bold">{credits}</span>
                          <span className="font-orbitron text-[10px] text-cyan-400/50 uppercase">CC</span>
                        </div>
                      </div>
                      <Link href="/profile" className="p-3 bg-cyan-500/10 border border-cyan-500/40 rounded">
                        <FaUser className="text-cyan-400" />
                      </Link>
                    </div>
                    <button 
                      onClick={logout}
                      className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-orbitron text-[10px] uppercase tracking-[0.4em]"
                    >
                      Disconnect Identity
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login"
                    className="w-full py-4 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-center font-orbitron text-[10px] uppercase tracking-[0.4em]"
                  >
                    Initialize Connection
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
