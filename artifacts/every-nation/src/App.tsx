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

const About = lazy(() => import("@/pages/About"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const ServiceWebsites = lazy(() => import("@/pages/ServiceWebsites"));
const ServiceWebApps = lazy(() => import("@/pages/ServiceWebApps"));
const ServiceRealtime = lazy(() => import("@/pages/ServiceRealtime"));
const ServiceCustomTools = lazy(() => import("@/pages/ServiceCustomTools"));
const Estimator = lazy(() => import("@/pages/Estimator"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));

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
        <Route path="/services" component={ServicesPage} />
        <Route path="/services/websites" component={ServiceWebsites} />
        <Route path="/services/web-apps" component={ServiceWebApps} />
        <Route path="/services/realtime-engines" component={ServiceRealtime} />
        <Route path="/services/custom-tools" component={ServiceCustomTools} />
        <Route path="/estimate" component={Estimator} />
        <Route path="/contact" component={ContactPage} />
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
    location === "/about" ||
    location.startsWith("/services") ||
    location === "/estimate" ||
    location === "/contact";

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] selection:bg-neutral-200 selection:text-black overflow-x-hidden">
      <HUDFilters />
      <SystemToastContainer />
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
          </WouterRouter>
        </UIProvider>
      </MessagingProvider>
    </AuthProvider>
  );
}
