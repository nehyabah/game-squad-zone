import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  Users,
  HelpCircle,
  Zap,
  Rocket,
  BarChart3,
} from "lucide-react";

interface FAQSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const howToPlaySections = [
  {
    id: "what-is",
    icon: HelpCircle,
    color: "blue",
    title: "What is SquadPot?",
    content: [
      "SquadPot is a prediction game for the Six Nations Championship.",
      "Players compete across the five rounds of the tournament by answering match-based questions, earning points, and climbing the leaderboard within their private league (called a Squad).",
    ],
  },
  {
    id: "format",
    icon: Trophy,
    color: "amber",
    title: "Competition Format",
    content: [
      "The Six Nations runs over 5 rounds",
      "Each round has 3 matches",
      "Each match has 3 prediction questions",
      "That's 9 questions per round",
    ],
  },
  {
    id: "points",
    icon: Zap,
    color: "purple",
    title: "Points Structure",
    content: [
      "Each question can be worth different points depending on difficulty",
      "Rounds 1–4: 10 points per match, 30 per round",
      "Round 5 (Final): Double points — 20 per match, 60 per round",
    ],
  },
  {
    id: "picks",
    icon: Target,
    color: "green",
    title: "Making Your Picks",
    content: [
      "You'll see 9 prediction questions per round (3 per match)",
      'Each question is Yes / No (e.g. "Will France beat Ireland by more than 10 points?")',
      "Point values are shown before you select",
      "One selection per question",
      "Picks lock 1 hour before kick-off",
    ],
  },
  {
    id: "scoring",
    icon: BarChart3,
    color: "orange",
    title: "Points & Scoring",
    content: [
      "Correct picks earn the full points shown",
      "Incorrect picks or no selection score zero",
      "Scores update once results are confirmed",
    ],
  },
  {
    id: "leaderboards",
    icon: Trophy,
    color: "yellow",
    title: "Leaderboards",
    content: [
      "Each Squad has its own leaderboard",
      "Rankings are based on total points",
      "Leaderboards update after every match",
      "Final standings decided after Round 5 (double points)",
    ],
  },
  {
    id: "squads",
    icon: Users,
    color: "pink",
    title: "Squads & Leagues",
    content: [
      "Games are played inside private Squads",
      "Each Squad has an Admin who creates it and shares a join code",
      "Players join by entering the code",
    ],
  },
];

const gettingStartedSteps = [
  "Sign up to the SquadPot app",
  'Select "Join a Squad" and enter the code',
  "Go to Fixtures to make your picks",
  "Review selections in My Picks",
  "Track progress on the Leaderboard",
];

const faqItems = [
  {
    q: "How many picks do I make each round?",
    a: "Nine — three per match.",
  },
  {
    q: "Are point values fixed?",
    a: "No. Each question can be worth any number of points, depending on difficulty. All point values are shown before you submit.",
  },
  {
    q: "What's special about the final round?",
    a: "The final round uses double points: 60 points per match, 180 points in total.",
  },
  {
    q: "When is the pick deadline?",
    a: "Picks must be submitted at least 1 hour before kick-off.",
  },
  {
    q: "Can I change my picks?",
    a: "Yes — up until the deadline.",
  },
  {
    q: "Can I see other players' picks?",
    a: "Picks are visible once the match has kicked off.",
  },
  {
    q: "What happens if I miss a pick?",
    a: "You score zero points for that match, but can continue playing.",
  },
  {
    q: "Who wins the Squad?",
    a: "The player with the highest total points after all five rounds.",
  },
  {
    q: "Is SquadPot a betting app?",
    a: "No. SquadPot is a free-to-play prediction game with no real-money betting.",
  },
];

const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
  blue: {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    border: "border-blue-200/60 dark:border-blue-800/40",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    border: "border-amber-200/60 dark:border-amber-800/40",
  },
  purple: {
    icon: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    border: "border-purple-200/60 dark:border-purple-800/40",
  },
  green: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/40",
    border: "border-green-200/60 dark:border-green-800/40",
  },
  orange: {
    icon: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    border: "border-orange-200/60 dark:border-orange-800/40",
  },
  yellow: {
    icon: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    border: "border-yellow-200/60 dark:border-yellow-800/40",
  },
  pink: {
    icon: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-100 dark:bg-pink-900/40",
    border: "border-pink-200/60 dark:border-pink-800/40",
  },
};

export default function FAQSheet({ open, onOpenChange }: FAQSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85dvh] max-h-[85vh] sm:h-[90dvh] sm:max-h-[90vh] rounded-t-2xl border-0 p-0 z-[10000] flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 bg-background border-b px-4 py-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-bold">How to Play & FAQ</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 py-5">
            <p className="text-2xl font-bold">Six Nations SquadPot</p>
            <p className="text-sm text-muted-foreground mt-1">
              Predict. Compete. Win your Squad.
            </p>
          </div>

          <div className="px-4 pb-6">
            {/* How to Play */}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-4 mb-2.5 px-1">
              How to Play
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {howToPlaySections.map((section) => {
                const Icon = section.icon;
                const colors = colorMap[section.color];
                return (
                  <AccordionItem
                    key={section.id}
                    value={section.id}
                    className={`border ${colors.border} rounded-xl overflow-hidden`}
                  >
                    <AccordionTrigger className="py-3 px-3 text-sm font-medium hover:no-underline gap-2">
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`w-8 h-8 ${colors.bg} rounded-lg flex items-center justify-center shrink-0`}
                        >
                          <Icon className={`w-4 h-4 ${colors.icon}`} />
                        </span>
                        {section.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      <ul className="space-y-1.5 ml-10">
                        {section.content.map((item, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground list-disc"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Getting Started - numbered steps */}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-5 mb-2.5 px-1">
              Getting Started
            </h3>
            <div className="rounded-xl border bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-200/60 dark:border-emerald-800/40 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="text-sm font-medium">
                  5 steps to get playing
                </span>
              </div>
              <ol className="space-y-2.5 ml-1">
                {gettingStartedSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* FAQ */}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-5 mb-2.5 px-1">
              Frequently Asked Questions
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {faqItems.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border/60 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="py-3 px-3 text-sm font-medium hover:no-underline gap-2 text-left">
                    <span className="flex items-center gap-2.5">
                      <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </span>
                      {item.q}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 ml-10">
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
