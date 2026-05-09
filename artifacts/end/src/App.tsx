import { Switch, Route, Router as WouterRouter, useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import SystemToastContainer from "@/components/common/SystemToast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import LandingPage from "@/pages/marketing/LandingPage";
import ProfilePage from "@/pages/user/ProfilePage";
import SettingsPage from "@/pages/user/SettingsPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import JoinPage from "@/pages/marketing/JoinPage";
import GameShell from "@/pages/game/GameShell";
import AuditLogsPage from "@/pages/admin/AuditLogsPage";
import NotFound from "@/pages/not-found";
import GlobalControls from "@/components/system/GlobalControls";
import ShipOSBoot from "@/components/system/ShipOSBoot";
import ParallaxBackground from "@/components/common/ParallaxBackground";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { gameSessionStore } from "@/lib/gameSessionStore";

const queryClient = new QueryClient();

/** Redirect old game-phase routes to /room/:roomCode (or / if no session) */
function OldGameRouteRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const roomCode = gameSessionStore.getRoomCode();
    setLocation(roomCode ? `/room/${roomCode}` : "/");
  }, [setLocation]);
  return null;
}

/** Redirect old /r/:roomCode URLs to /room/:roomCode */
function LegacyRoomRedirect() {
  const params = useParams<{ roomCode: string }>();
  const [, setLocation] = useLocation();
  useEffect(() => {
    const code = params.roomCode ?? "";
    setLocation(code ? `/room/${code}` : "/", { replace: true });
  }, [params.roomCode, setLocation]);
  return null;
}

function Router() {
  return (
    <>
      <ShipOSBoot />
      <ParallaxBackground />
      {/* This is now the ONLY component controlling lobby-music.mp3 */}
      <GlobalControls />
      {/* <CustomCursor /> removed */}

      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/join/:roomCode" component={JoinPage} />
        {/* Legacy /r/:code route — redirect to /room/:code */}
        <Route path="/r/:roomCode" component={LegacyRoomRedirect} />
        {/* Legacy game-phase routes — redirect to /room/:code */}
        <Route path="/role-config" component={OldGameRouteRedirect} />
        <Route path="/role-reveal" component={OldGameRouteRedirect} />
        <Route path="/orbit" component={OldGameRouteRedirect} />
        <Route path="/discussion" component={OldGameRouteRedirect} />
        <Route path="/voting" component={OldGameRouteRedirect} />
        <Route path="/result" component={OldGameRouteRedirect} />
        {/* Game room — /room/:roomCode (must be last before catch-all) */}
        <Route path="/room/:roomCode" component={GameShell} />
        {/* Admin tools */}
        <Route path="/admin/logs" component={AuditLogsPage} />
        {/* 404 catch-all */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <PayPalScriptProvider options={{ "clientId": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test" }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <PreferencesProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}> 
                <ErrorBoundary>
                  <Router />
                </ErrorBoundary>
              </WouterRouter>
              <Toaster />
              <SystemToastContainer />
            </PreferencesProvider>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </PayPalScriptProvider>
  );
}

export default App;

