import { Switch, Route, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/useAuth";

import Navbar from "@/components/Navbar";

function Router() {
  return (
    <div className="pt-20 lg:pt-0"> {/* Add padding for the fixed navbar on mobile */}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
          <Navbar />
          <Router />
        </div>
      </WouterRouter>
    </AuthProvider>
  );
}

export default App;
