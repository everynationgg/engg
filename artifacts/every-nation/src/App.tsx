import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { lazy, Suspense } from "react";
import Home from "@/pages/Home";
import { AuthProvider } from "@/hooks/useAuth";

import SystemToastContainer from "@/components/common/SystemToast";
import { MessagingProvider } from "@/context/MessagingContext";
import { UIProvider } from "@/context/UIContext";
import { HUDFilters } from "@/components/common/HUDRenderer";
import { AuthAccessPaused, ShopOffline } from "@/pages/AccessPaused";
import { AUTH_PUBLIC_ACCESS_ENABLED, SHOP_ENABLED } from "@/lib/productAccess";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const About = lazy(() => import("@/pages/About"));
const WhoWeAre = lazy(() => import("@/pages/about/WhoWeAre"));
const WhatWeDo = lazy(() => import("@/pages/about/WhatWeDo"));
const MissionVision = lazy(() => import("@/pages/about/MissionVision"));

const Shop = lazy(() => import("@/pages/Shop"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Visien = lazy(() => import("@/pages/Visien"));
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
import VisienFloatingWidget from "@/components/visien/VisienFloatingWidget";

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
        <Route path="/about/who-we-are" component={WhoWeAre} />
        <Route path="/about/what-we-do" component={WhatWeDo} />
        <Route path="/about/mission-and-vision" component={MissionVision} />
        <Route path="/who-we-are" component={WhoWeAre} />
        <Route path="/what-we-do" component={WhatWeDo} />
        <Route path="/mission-and-vision" component={MissionVision} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/visien" component={Visien} />
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
  const isStudioPage =
    location === "/" ||
    location === "" ||
    location.startsWith("/about") ||
    location === "/who-we-are" ||
    location === "/what-we-do" ||
    location === "/mission-and-vision" ||
    location === "/marketplace" ||
    location === "/visien" ||
    location === "/login" ||
    location === "/register" ||
    location === "/forgot-password" ||
    location === "/reset-password" ||
    location === "/verify";

  return (
    <div
      className={`min-h-screen ${
        isStudioPage ? "bg-white text-[#1d1d1f]" : "bg-[#020408] text-white"
      } selection:bg-neutral-200 selection:text-black overflow-x-clip`}
    >
      <HUDFilters />
      <SystemToastContainer />
      <VisienFloatingWidget />
      {!isStudioPage && (
        <Suspense fallback={null}>
          <Navbar />
          <AlliesSidebar />
        </Suspense>
      )}
      <div className={`${!isStudioPage ? "pt-[100px] lg:pt-[120px]" : ""}`}>
        <Router />
      </div>
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
