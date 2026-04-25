import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Hub from "@/pages/Hub";
import Verify from "@/pages/Verify";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/useAuth";

import Navbar from "@/components/Navbar";
import WarpJump from "@/components/WarpJump";
import SystemToastContainer from "@/components/SystemToast";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={Profile} />
      <Route path="/hub" component={Hub} />
      <Route path="/verify" component={Verify} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { HUDFilters } from "@/components/HUDRenderer";

export default function App() {
  const [location] = useLocation();
  const [isWarping, setIsWarping] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);
  const isHomePage = location === "/";

  useEffect(() => {
    if (location !== prevLocation) {
      setIsWarping(true);
      const timer = setTimeout(() => {
        setIsWarping(false);
        setPrevLocation(location);
      }, 900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [location, prevLocation]);

  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-x-hidden">
          <HUDFilters />
          <SystemToastContainer />
          <AnimatePresence>
            {isWarping && <WarpJump />}
          </AnimatePresence>
          {!isHomePage && <Navbar />}
          <div className={isWarping ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
            <Router />
          </div>
        </div>
      </WouterRouter>
    </AuthProvider>
  );
}
