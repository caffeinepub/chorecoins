import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetChildrenPublic } from "../hooks/useQueries";

const CHILD_COLORS = [
  "from-yellow-300 to-orange-300",
  "from-pink-300 to-rose-300",
  "from-cyan-300 to-blue-300",
  "from-green-300 to-emerald-300",
  "from-purple-300 to-violet-300",
  "from-amber-300 to-yellow-300",
  "from-teal-300 to-cyan-300",
  "from-red-300 to-pink-300",
];

const CHILD_EMOJIS = [
  "🌟",
  "🦊",
  "🐬",
  "🦋",
  "🦄",
  "🐻",
  "🐸",
  "🦁",
  "🌈",
  "🎈",
];

function getChildColor(index: number): string {
  return CHILD_COLORS[index % CHILD_COLORS.length];
}

function getChildEmoji(index: number): string {
  return CHILD_EMOJIS[index % CHILD_EMOJIS.length];
}

interface RoleSelectionProps {
  onParentLogin: () => void;
  onChildSelect: (childId: bigint, childName: string) => void;
}

export function RoleSelection({
  onParentLogin,
  onChildSelect,
}: RoleSelectionProps) {
  const { login, isLoggingIn, isLoginSuccess, identity } =
    useInternetIdentity();
  const { data: children, isLoading: childrenLoading } = useGetChildrenPublic();

  // After login succeeds, navigate to parent dashboard
  useEffect(() => {
    if (isLoginSuccess && identity) {
      onParentLogin();
    }
  }, [isLoginSuccess, identity, onParentLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8 md:py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center mb-4">
          <img
            src="/assets/generated/chore-hero-transparent.dim_200x200.png"
            alt="ChoreCoins logo"
            className="w-20 h-20 md:w-24 md:h-24 drop-shadow-lg"
          />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          ChoreCoins
        </h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">
          Earn money. Do chores. Be awesome.
        </p>
      </motion.div>

      {/* Who's here? */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="w-full max-w-2xl"
      >
        <h2 className="font-display text-2xl font-bold text-center text-foreground mb-6">
          Who's here? 👋
        </h2>

        {/* Parent Login Card */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="mb-5"
        >
          <Button
            data-ocid="role_selection.parent_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-20 rounded-2xl bg-foreground text-background hover:bg-foreground/90 shadow-card font-display font-bold text-xl flex items-center justify-between px-6 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
                {isLoggingIn ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" />
                ) : (
                  <Shield className="w-6 h-6 text-primary-foreground" />
                )}
              </div>
              <div className="text-left">
                <div className="text-lg font-bold">Parent Login</div>
                <div className="text-sm font-normal opacity-70">
                  Manage chores & approve completions
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground font-medium">
            or pick a child
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Children Grid */}
        {childrenLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : children && children.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {children.map((child, index) => (
              <motion.button
                key={child.id.toString()}
                data-ocid={`role_selection.child_card.${index + 1}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.06 }}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onChildSelect(child.id, child.name)}
                className={`
                  relative h-32 rounded-2xl bg-gradient-to-br ${getChildColor(index)}
                  shadow-card flex flex-col items-center justify-center gap-2 p-4
                  hover:shadow-glow transition-shadow duration-200 cursor-pointer
                  border-2 border-white/50
                `}
              >
                <span className="text-4xl">{getChildEmoji(index)}</span>
                <span className="font-display font-bold text-white text-sm md:text-base text-center drop-shadow-sm truncate max-w-full px-2">
                  {child.name}
                </span>
                <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <span className="text-xs font-bold text-white">
                    ${(Number(child.balanceCents) / 100).toFixed(2)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div
            data-ocid="children.empty_state"
            className="text-center py-10 bg-card rounded-2xl border-2 border-dashed border-border"
          >
            <p className="text-4xl mb-3">👨‍👩‍👧‍👦</p>
            <p className="font-display font-semibold text-foreground text-lg">
              No children yet
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Parents: log in to add your kids!
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-auto pt-12 text-center text-sm text-muted-foreground"
      >
        © {new Date().getFullYear()} Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </motion.footer>
    </div>
  );
}
