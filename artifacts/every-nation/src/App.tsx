import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Hub from "@/pages/Hub";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/useAuth";

import Navbar from "@/components/Navbar";

function Router() {
  // Increased top padding to ensure content is never overlapped by the fixed navbar
  // Keep this in sync with the Navbar height (py-6/py-4)
  return (
    <div className="pt-24 md:pt-28"> {/* Increased padding to clear fixed navbar */}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profile" component={Profile} />
        <Route path="/hub" component={Hub} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default function App() {
  const [location] = useLocation();
  const isHomePage = location === "/";

  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
          {!isHomePage && <Navbar />}
          <Router />
        </div>
      </WouterRouter>
    </AuthProvider>
  );
}
