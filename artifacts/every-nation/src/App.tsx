import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { lazy, Suspense } from "react";
import Home from "@/pages/Home";
import { AuthProvider } from "@/hooks/useAuth";

import SystemToastContainer from "@/components/common/SystemToast";
import { MessagingProvider } from "@/context/MessagingContext";
import { UIProvider } from "@/context/UIContext";
import { HUDFilters } from "@/components/common/HUDRenderer";

const Shop = lazy(() => import("@/pages/Shop"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Profile = lazy(() => import("@/pages/Profile"));
const Hub = lazy(() => import("@/pages/Hub"));
const Verify = lazy(() => import("@/pages/Verify"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Navbar = lazy(() => import("@/components/Navbar"));
const AlliesSidebar = lazy(() => import("@/components/AlliesSidebar"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-6 text-center">
      <p className="font-orbitron text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">
        Loading node...
      </p>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/profile" component={Profile} />
        <Route path="/hub" component={Hub} />
        <Route path="/verify" component={Verify} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  const [location] = useLocation();


  const isHomePage = location === "/" || location === "";

  return (
    <AuthProvider>
      <MessagingProvider>
        <UIProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-x-hidden">
              <HUDFilters />
              <SystemToastContainer />
              {!isHomePage && (
                <Suspense fallback={null}>
                  <Navbar />
                  <AlliesSidebar />
                </Suspense>
              )}
              <div className={`${!isHomePage ? "pt-[100px] lg:pt-[120px]" : ""}`}>
                <Router />
              </div>
            </div>
          </WouterRouter>
        </UIProvider>
      </MessagingProvider>
    </AuthProvider>
  );
}
