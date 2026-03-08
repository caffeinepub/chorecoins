import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { ChildDashboard } from "./pages/ChildDashboard";
import { ParentDashboard } from "./pages/ParentDashboard";
import { ProfileSetup } from "./pages/ProfileSetup";
import { RoleSelection } from "./pages/RoleSelection";

export type AppView =
  | { mode: "select" }
  | { mode: "profile" }
  | { mode: "profileEdit" }
  | { mode: "parent" }
  | { mode: "child"; childId: bigint; childName: string };

export default function App() {
  const [view, setView] = useState<AppView>({ mode: "select" });
  const { identity, isInitializing } = useInternetIdentity();
  // Prevent repeated auto-redirects on re-renders
  const autoRedirected = useRef(false);

  // If a valid session is already stored, jump straight to the parent flow
  useEffect(() => {
    if (!isInitializing && identity && !autoRedirected.current) {
      autoRedirected.current = true;
      setView((v) => (v.mode === "select" ? { mode: "profile" } : v));
    }
  }, [isInitializing, identity]);

  return (
    <>
      <Toaster richColors position="top-center" />
      {view.mode === "select" && (
        <RoleSelection
          onParentLogin={() => setView({ mode: "profile" })}
          onChildSelect={(childId, childName) =>
            setView({ mode: "child", childId, childName })
          }
        />
      )}
      {view.mode === "profile" && (
        <ProfileSetup onComplete={() => setView({ mode: "parent" })} />
      )}
      {view.mode === "profileEdit" && (
        <ProfileSetup
          onComplete={() => setView({ mode: "parent" })}
          editMode={true}
        />
      )}
      {view.mode === "parent" && (
        <ParentDashboard
          onBack={() => setView({ mode: "select" })}
          onEditProfile={() => setView({ mode: "profileEdit" })}
        />
      )}
      {view.mode === "child" && (
        <ChildDashboard
          childId={view.childId}
          childName={view.childName}
          onBack={() => setView({ mode: "select" })}
        />
      )}
    </>
  );
}
