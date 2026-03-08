import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

interface ProfileSetupProps {
  onComplete: (name: string) => void;
  editMode?: boolean;
}

export function ProfileSetup({
  onComplete,
  editMode = false,
}: ProfileSetupProps) {
  const [name, setName] = useState("");
  const [hasChecked, setHasChecked] = useState(false);

  const { data: existingProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  // Pre-fill name in edit mode, or auto-skip if profile already exists on first setup
  useEffect(() => {
    if (profileLoading || hasChecked) return;
    if (existingProfile !== undefined && existingProfile !== null) {
      setHasChecked(true);
      if (editMode) {
        // In edit mode, pre-fill the current name
        setName(existingProfile.name);
      } else {
        // First-time setup: profile already exists, skip directly to dashboard
        onComplete(existingProfile.name);
      }
    } else if (existingProfile === null) {
      // Explicitly no profile — stay on setup screen
      setHasChecked(true);
    }
  }, [existingProfile, profileLoading, editMode, onComplete, hasChecked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await saveProfile.mutateAsync({ name: trimmed });
    onComplete(trimmed);
  };

  // Show loading while we check for an existing profile (only on first-setup mode)
  if (
    !editMode &&
    (profileLoading || (!hasChecked && existingProfile === undefined))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          data-ocid="profile_setup.loading_state"
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">
            Loading your profile…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo / hero area */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              type: "spring",
              bounce: 0.4,
            }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-glow mb-4"
          >
            <span className="text-4xl">👋</span>
          </motion.div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            {editMode ? "Edit Your Profile" : "Welcome, Parent!"}
          </h1>
          <p className="text-muted-foreground mt-2 text-base font-medium">
            {editMode
              ? "Update the name shown on your dashboard."
              : "Let's set up your profile so your kids know who's in charge! 😄"}
          </p>
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-3xl shadow-card border border-border/50 p-8"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="parent-name"
                className="font-display font-semibold text-foreground text-base"
              >
                Your name
              </Label>
              <Input
                id="parent-name"
                data-ocid="profile_setup.name_input"
                type="text"
                placeholder="e.g. Mom, Dad, Guardian…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                autoFocus
                className="h-12 rounded-xl text-base font-medium border-border focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 characters
              </p>
            </div>

            {saveProfile.isError && (
              <div
                data-ocid="profile_setup.error_state"
                className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-destructive text-sm font-medium"
              >
                Something went wrong. Please try again.
              </div>
            )}

            <Button
              data-ocid="profile_setup.submit_button"
              type="submit"
              disabled={saveProfile.isPending || !name.trim()}
              className="h-12 rounded-xl font-display font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow disabled:shadow-none transition-all"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editMode ? (
                "Save Changes"
              ) : (
                "Save & Continue →"
              )}
            </Button>
          </form>
        </motion.div>

        {/* Fun decorative note */}
        {!editMode && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            🔒 Your profile is saved securely on-chain.
          </motion.p>
        )}
      </motion.div>

      {/* Footer */}
      <footer className="mt-auto pt-12 text-center text-sm text-muted-foreground">
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
