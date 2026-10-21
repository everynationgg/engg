import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import Home from "@/pages/Home";
import { AuthProvider } from "@/hooks/useAuth";

import SystemToastContainer from "@/components/common/SystemToast";
import { MessagingProvider } from "@/context/MessagingContext";
import { UIProvider } from "@/context/UIContext";
import { AuthAccessPaused, ShopOffline } from "@/pages/AccessPaused";
import { AUTH_PUBLIC_ACCESS_ENABLED, SHOP_ENABLED } from "@/lib/productAccess";
import { PROJECT_STUDIO_URL } from "@/lib/externalLinks";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const About = lazy(() => import("@/pages/About"));

const Shop = lazy(() => import("@/pages/Shop"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
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

function ProjectStudioRedirect() {
  useEffect(() => {
    window.location.replace(PROJECT_STUDIO_URL);
  }, []);
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-6 text-center">
      <p className="font-sans text-xs uppercase tracking-widest text-neutral-500">
        Redirecting to VISIEN AI...
      </p>
    </div>
  );
}

const ShopRoute = SHOP_ENABLED ? Shop : ShopOffline;
const LoginRoute = AUTH_PUBLIC_ACCESS_ENABLED ? Login : AuthAccessPaused;
const RegisterRoute = AUTH_PUBLIC_ACCESS_ENABLED ? Register : AuthAccessPaused;
const ProfileRoute = AUTH_PUBLIC_ACCESS_ENABLED ? Profile : AuthAccessPaused;
const VerifyRoute = AUTH_PUBLIC_ACCESS_ENABLED ? Verify : AuthAccessPaused;
const ForgotPasswordRoute = AUTH_PUBLIC_ACCESS_ENABLED ? ForgotPassword : AuthAccessPaused;
const ResetPasswordRoute = AUTH_PUBLIC_ACCESS_ENABLED ? ResetPassword : AuthAccessPaused;

function RouteLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center px-6 text-center">
      <p className="font-sans text-xs uppercase tracking-widest text-neutral-500">
        Loading page...
      </p>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/about/who-we-are" component={About} />
        <Route path="/about/what-we-do" component={About} />
        <Route path="/about/mission-and-vision" component={About} />
        <Route path="/who-we-are" component={About} />
        <Route path="/what-we-do" component={About} />
        <Route path="/mission-and-vision" component={About} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/visien" component={ProjectStudioRedirect} />
        <Route path="/visein" component={ProjectStudioRedirect} />
        <Route path="/hub" component={Hub} />
        <Route path="/shop" component={ShopRoute} />
        <Route path="/login" component={LoginRoute} />
        <Route path="/register" component={RegisterRoute} />
        <Route path="/profile" component={ProfileRoute} />
        <Route path="/verify" component={VerifyRoute} />
        <Route path="/forgot-password" component={ForgotPasswordRoute} />
        <Route path="/reset-password" component={ResetPasswordRoute} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isGameHubPage = location === "/hub";

  return (
    <div
      className={`min-h-screen ${
        isGameHubPage ? "bg-[#020408] text-white" : "bg-[#fbfbfd] text-[#1d1d1f]"
      } selection:bg-neutral-200 selection:text-black overflow-x-clip`}
    >
      <SystemToastContainer />
      {isGameHubPage && (
        <Suspense fallback={null}>
          <Navbar />
          <AlliesSidebar />
        </Suspense>
      )}
      <Router />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MessagingProvider>
        <UIProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppContent />
            <Analytics />
            <SpeedInsights />
          </WouterRouter>
        </UIProvider>
      </MessagingProvider>
    </AuthProvider>
  );
}
