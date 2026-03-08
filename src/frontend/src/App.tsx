import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { ChildDashboard } from "./pages/ChildDashboard";
import { ParentDashboard } from "./pages/ParentDashboard";
import { RoleSelection } from "./pages/RoleSelection";

export type AppView =
  | { mode: "select" }
  | { mode: "parent" }
  | { mode: "child"; childId: bigint; childName: string };

export default function App() {
  const [view, setView] = useState<AppView>({ mode: "select" });

  return (
    <>
      <Toaster richColors position="top-center" />
      {view.mode === "select" && (
        <RoleSelection
          onParentLogin={() => setView({ mode: "parent" })}
          onChildSelect={(childId, childName) =>
            setView({ mode: "child", childId, childName })
          }
        />
      )}
      {view.mode === "parent" && (
        <ParentDashboard onBack={() => setView({ mode: "select" })} />
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
