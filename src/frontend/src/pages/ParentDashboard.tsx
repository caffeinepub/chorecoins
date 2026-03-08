import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ApprovalsTab } from "../components/app/ApprovalsTab";
import { ChildDetail } from "../components/app/ChildDetail";
import { ChildrenTab } from "../components/app/ChildrenTab";
import { ChoresTab } from "../components/app/ChoresTab";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetPendingCompletions } from "../hooks/useQueries";

interface ParentDashboardProps {
  onBack: () => void;
}

type ParentView =
  | { view: "tabs"; tab: string }
  | { view: "childDetail"; childId: bigint; childName: string };

export function ParentDashboard({ onBack }: ParentDashboardProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: pendingCompletions } = useGetPendingCompletions();
  const [parentView, setParentView] = useState<ParentView>({
    view: "tabs",
    tab: "children",
  });

  const pendingCount = pendingCompletions?.length ?? 0;

  const handleLogout = () => {
    clear();
    onBack();
  };

  const principalShort = `${identity?.getPrincipal().toString().slice(0, 8)}…`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-foreground text-background shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-background hover:text-background hover:bg-white/10 rounded-xl"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">
                Parent Dashboard
              </h1>
              {identity && (
                <p className="text-xs opacity-60 font-mono">{principalShort}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-background hover:text-background hover:bg-white/10 rounded-xl gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {parentView.view === "childDetail" ? (
            <motion.div
              key="child-detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <ChildDetail
                childId={parentView.childId}
                childName={parentView.childName}
                onBack={() => setParentView({ view: "tabs", tab: "children" })}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tabs"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25 }}
            >
              <Tabs
                value={parentView.tab}
                onValueChange={(tab) => setParentView({ view: "tabs", tab })}
              >
                <TabsList className="w-full mb-6 bg-card shadow-card rounded-2xl p-1.5 h-auto gap-1">
                  <TabsTrigger
                    data-ocid="parent.children_tab"
                    value="children"
                    className="flex-1 rounded-xl font-display font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background py-2.5"
                  >
                    👨‍👩‍👧 Children
                  </TabsTrigger>
                  <TabsTrigger
                    data-ocid="parent.chores_tab"
                    value="chores"
                    className="flex-1 rounded-xl font-display font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background py-2.5"
                  >
                    🧹 Chores
                  </TabsTrigger>
                  <TabsTrigger
                    data-ocid="parent.approvals_tab"
                    value="approvals"
                    className="flex-1 rounded-xl font-display font-semibold data-[state=active]:bg-foreground data-[state=active]:text-background py-2.5 relative"
                  >
                    ✅ Approve
                    {pendingCount > 0 && (
                      <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 bg-accent text-accent-foreground text-xs font-bold rounded-full shadow-glow-coral">
                        {pendingCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="children" className="mt-0">
                  <ChildrenTab
                    onViewChild={(childId, childName) =>
                      setParentView({ view: "childDetail", childId, childName })
                    }
                  />
                </TabsContent>
                <TabsContent value="chores" className="mt-0">
                  <ChoresTab />
                </TabsContent>
                <TabsContent value="approvals" className="mt-0">
                  <ApprovalsTab />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
