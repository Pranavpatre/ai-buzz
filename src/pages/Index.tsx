import { useState } from "react";
import { Zap, Settings, Mic, FileText } from "lucide-react";
import DigestCard from "@/components/DigestCard";
import FeedList, { Feed } from "@/components/FeedList";
import AddFeedForm from "@/components/AddFeedForm";
import StatsBar from "@/components/StatsBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SAMPLE_FEEDS: Feed[] = [
  { id: "1", name: "The Twenty Minute VC", type: "podcast", url: "https://feeds.megaphone.fm/20vc", active: true },
  { id: "2", name: "Lenny's Podcast", type: "podcast", url: "https://feeds.simplecast.com/lenny", active: true },
  { id: "3", name: "All-In Podcast", type: "podcast", url: "https://feeds.megaphone.fm/allin", active: true },
  { id: "4", name: "Stratechery", type: "newsletter", url: "https://stratechery.com/feed", active: true },
  { id: "5", name: "Not Boring", type: "newsletter", url: "https://notboring.co/feed", active: true },
];

interface DigestItem {
  type: "podcast" | "newsletter";
  title: string;
  source: string;
  guest?: string;
  guestBio?: string;
  author?: string;
  url: string;
  date: string;
  points: { heading: string; detail: string }[];
  quote?: string;
}

const INITIAL_DIGESTS: DigestItem[] = [
  {
    type: "podcast",
    title: "Head of Claude Code: What happens after coding is solved | Boris Cherny",
    source: "Lenny's Podcast",
    guest: "Boris Cherny",
    guestBio: "Creator and head of Claude Code at Anthropic",
    url: "https://open.spotify.com/episode/example",
    date: "Today, 10:00 AM",
    points: [
      { heading: "Claude Code's scale", detail: "~4% of all GitHub commits (higher in private repos); DAUs doubled in the past month. Enterprise adoption up 300% since Q3 2025." },
      { heading: "100% AI-written code", detail: "Hasn't hand-edited code since Nov 2025; ships 10–20–30 PRs/day. Uses Claude Code to build Claude Code itself — full recursive development." },
      { heading: "Origin story", detail: "Began as 'Claude CLI'; stayed terminal-first due to iteration speed. Team of 8 built v1 in 3 weeks; now 40+ engineers." },
      { heading: "Five-stage evolution", detail: "Autocomplete → chat → agents → coworkers → autonomous. Currently between stage 3 and 4; stage 5 expected by late 2026." },
      { heading: "Agentic workflows", detail: "Claude Code now handles multi-file refactors, test generation, and deployment pipelines end-to-end. Average task completion: 94% on SWE-bench." },
      { heading: "Business model shift", detail: "Moving from per-seat to usage-based pricing. Revenue grew 5x in 6 months; approaching $500M ARR." },
    ],
    quote: "By the end of the year, everyone's going to be a product manager and everyone codes.",
  },
  {
    type: "podcast",
    title: "The AI Infrastructure Stack in 2026 | Sarah Chen",
    source: "The Twenty Minute VC",
    guest: "Sarah Chen",
    guestBio: "Partner at Benchmark, former CTO at Scale AI",
    url: "https://open.spotify.com/episode/example2",
    date: "Today, 10:00 AM",
    points: [
      { heading: "Inference costs", detail: "Dropped 90% in 18 months; now $0.02/M tokens for mid-tier models. GPU utilization improved from 30% to 75% via better scheduling." },
      { heading: "Edge AI", detail: "30% of enterprise workloads now run on-device, up from 5% in 2024. Apple's on-device models handle 60% of Siri queries without cloud." },
      { heading: "Open-source convergence", detail: "Llama 4 and Mistral Large now comparable to GPT-5 on most benchmarks. Fine-tuned open models outperform closed ones in 40% of domain-specific tasks." },
      { heading: "Infrastructure consolidation", detail: "Top 3 cloud providers captured 80% of AI compute spend. Startups increasingly choose managed inference over self-hosting." },
      { heading: "Investment landscape", detail: "AI infra funding hit $28B in 2025. Benchmark's thesis: invest in the 'picks and shovels' — observability, data pipelines, and evaluation tooling." },
    ],
    quote: "The moat isn't the model anymore — it's the data flywheel.",
  },
  {
    type: "podcast",
    title: "Why We're Betting Everything on Vertical AI Agents | Jason Lemkin",
    source: "All-In Podcast",
    guest: "Jason Lemkin",
    guestBio: "Founder of SaaStr, early Salesforce executive",
    url: "https://open.spotify.com/episode/example3",
    date: "Today, 10:00 AM",
    points: [
      { heading: "Vertical AI thesis", detail: "Horizontal AI tools commoditize fast; vertical agents (legal, medical, finance) retain 3x higher margins. $18B TAM by 2027." },
      { heading: "SaaS disruption", detail: "Traditional SaaS seeing 15-20% churn increase as AI-native tools replace point solutions. Salesforce lost 8% market share in SMB segment." },
      { heading: "Agent economics", detail: "Cost per task dropped from $4.50 to $0.12 in 18 months. Agents now handle 40% of customer support tickets at enterprise scale." },
      { heading: "Founder advice", detail: "Pick a vertical where domain expertise is the moat, not the model. Best founders are domain experts who learn AI, not vice versa." },
      { heading: "Fundraising climate", detail: "AI-native startups raising at 25-40x ARR multiples; traditional SaaS compressed to 8-12x. Seed rounds averaging $6M for AI companies." },
    ],
    quote: "Every SaaS company will either become an AI company or be replaced by one.",
  },
  {
    type: "newsletter",
    title: "Why Every Company Is Now an AI Company (Whether They Like It or Not)",
    source: "Not Boring",
    author: "Packy McCormick",
    url: "https://notboring.co/p/example",
    date: "Today, 10:00 AM",
    points: [
      { heading: "AI adoption curve", detail: "Enterprise AI spend hit $340B in 2025, projected $520B by 2027. Fastest technology adoption since mobile — 3x faster than cloud computing's curve." },
      { heading: "The integration tax", detail: "Companies spend 3x on integration vs. model costs; middleware is the real bottleneck. Average enterprise uses 4.2 different AI providers." },
      { heading: "Winner-take-most dynamics", detail: "Top 3 players in each vertical capture 70%+ of AI-driven revenue uplift. Network effects compound faster in AI due to data advantages." },
      { heading: "Talent war", detail: "AI engineer salaries up 45% YoY. Companies offering $800K+ total comp for senior ML roles. Remote-first teams gaining edge in hiring." },
      { heading: "Regulatory landscape", detail: "EU AI Act enforcement begins Q2 2026. Companies spending avg $2.4M on compliance; creates moat for incumbents over startups." },
    ],
  },
  {
    type: "newsletter",
    title: "The Aggregation Theory of AI: Who Captures the Value?",
    source: "Stratechery",
    author: "Ben Thompson",
    url: "https://stratechery.com/p/example",
    date: "Today, 10:00 AM",
    points: [
      { heading: "Distribution wins again", detail: "Just like search and social, AI value accrues to aggregators who own the user relationship. Google, Apple, and Microsoft best positioned as default AI surfaces." },
      { heading: "Model commoditization", detail: "GPT-5, Claude 4, Gemini 2 converging on benchmarks. Differentiation shifting from model quality to UX, latency, and ecosystem integration." },
      { heading: "Enterprise lock-in", detail: "Companies using 1 AI provider for 6+ months show 85% retention. Switching costs are rising as fine-tuned models become embedded in workflows." },
      { heading: "The API economy", detail: "API-first AI companies growing 4x faster than app-first. Stripe-for-AI plays seeing $100M+ ARR within 2 years of launch." },
      { heading: "Consumer AI plateau", detail: "ChatGPT MAU growth slowed to 5% QoQ after hitting 400M. Next growth wave requires new form factors — wearables, ambient computing." },
    ],
    quote: "The best AI company is the one you don't know you're using.",
  },
  {
    type: "podcast",
    title: "Building the Future of Developer Tools | Guillermo Rauch",
    source: "Lenny's Podcast",
    guest: "Guillermo Rauch",
    guestBio: "CEO of Vercel, creator of Next.js",
    url: "https://open.spotify.com/episode/example4",
    date: "Today, 10:00 AM",
    points: [
      { heading: "v0 growth", detail: "Vercel's AI coding tool hit 2M monthly users. 35% of new Next.js projects now start from v0-generated code. Revenue contribution: 20% of Vercel's ARR." },
      { heading: "Framework evolution", detail: "Next.js 16 introduced native AI streaming primitives. Server components now handle 70% of rendering; client JS bundles shrunk 60% on average." },
      { heading: "Edge computing", detail: "Edge functions now serve 45% of Vercel traffic. P99 latency dropped from 200ms to 40ms. Cold starts eliminated with persistent edge workers." },
      { heading: "Developer productivity", detail: "Teams using AI-assisted dev tools ship 3.5x faster. But code review bottleneck increased — 40% more PRs, same number of reviewers." },
      { heading: "Platform vision", detail: "Vercel aims to be the 'cloud for frontend' — deploy, observe, iterate. Acquired 2 monitoring startups in 2025 to close the observability gap." },
    ],
    quote: "The best developer experience is no developer experience — just describe what you want.",
  },
  {
    type: "podcast",
    title: "The State of Crypto x AI: Decentralized Intelligence | Vitalik Buterin",
    source: "The Twenty Minute VC",
    guest: "Vitalik Buterin",
    guestBio: "Co-founder of Ethereum",
    url: "https://open.spotify.com/episode/example5",
    date: "Today, 10:00 AM",
    points: [
      { heading: "Crypto-AI convergence", detail: "Decentralized compute networks now handle 12% of AI training workloads. Cost savings of 30-50% vs. centralized cloud for batch inference." },
      { heading: "On-chain verification", detail: "ZK proofs for AI outputs gaining traction. 3 major enterprises piloting verifiable AI for compliance — audit trail without revealing model weights." },
      { heading: "Token incentives", detail: "AI data labeling DAOs outperforming traditional vendors on quality metrics. Contributors earn $25-80/hr; 200K active participants globally." },
      { heading: "Ethereum roadmap", detail: "Danksharding live on mainnet; L2 fees dropped to $0.001. Focus shifting to 'the surge' — 100K TPS target by 2027." },
      { heading: "Philosophical stance", detail: "AI alignment requires decentralized governance. No single company should control systems smarter than humans. Open-source AI is a public good." },
    ],
    quote: "Decentralization isn't just about censorship resistance — it's about ensuring AI serves everyone.",
  },
  {
    type: "newsletter",
    title: "The New Playbook for B2B Go-to-Market in the AI Era",
    source: "Not Boring",
    author: "Packy McCormick",
    url: "https://notboring.co/p/example2",
    date: "Today, 10:00 AM",
    points: [
      { heading: "PLG is dead, long live PLG", detail: "Product-led growth evolved into 'AI-led growth.' Best companies let the AI agent sell — demo-to-close in 1 session. Conversion rates up 4x." },
      { heading: "Sales team transformation", detail: "AEs now manage 3x more accounts with AI copilots. Average deal cycle shortened from 90 to 45 days. SDR role being automated at 60% of startups." },
      { heading: "Content moat", detail: "AI-generated content flooding every channel. Differentiation through original research and proprietary data. Companies investing 2x more in data teams." },
      { heading: "Pricing innovation", detail: "Usage-based pricing now default for AI products. Outcome-based pricing (pay per resolved ticket) emerging. Average contract values up 35%." },
      { heading: "Community as GTM", detail: "Developer communities driving 40% of enterprise pipeline. Discord/Slack communities with 10K+ members converting at 8x rate of cold outbound." },
    ],
  },
];

// Generate a placeholder digest for a newly added feed
const generatePlaceholderDigest = (feed: Feed): DigestItem => {
  const now = new Date();
  const timeStr = `Today, ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  if (feed.type === "podcast") {
    return {
      type: "podcast",
      title: `Latest Episode from ${feed.name}`,
      source: feed.name,
      guest: "Featured Guest",
      guestBio: "Industry expert and thought leader",
      url: feed.url,
      date: timeStr,
      points: [
        { heading: "Key insight", detail: `New episode from ${feed.name} just dropped — refreshing to pull the latest content and generate a full summary.` },
        { heading: "What to expect", detail: "Once Cloud is enabled, this will be replaced with a real AI-generated summary of the episode transcript." },
        { heading: "Coming soon", detail: "Full bullet-point summaries, key quotes, timestamps, and action items — all auto-generated from the RSS feed." },
      ],
      quote: "Stay tuned — full summary coming soon.",
    };
  }
  return {
    type: "newsletter",
    title: `Latest from ${feed.name}`,
    source: feed.name,
    author: feed.name,
    url: feed.url,
    date: timeStr,
    points: [
      { heading: "New content", detail: `${feed.name} has a new post — refreshing to pull the latest content and generate a full summary.` },
      { heading: "What to expect", detail: "Once Cloud is enabled, this will be replaced with a real AI-generated summary of the article." },
      { heading: "Coming soon", detail: "Full analysis with key takeaways, data points, and strategic implications — all auto-generated from the RSS feed." },
    ],
  };
};

const Index = () => {
  const [feeds, setFeeds] = useState<Feed[]>(SAMPLE_FEEDS);
  const [digests, setDigests] = useState<DigestItem[]>(INITIAL_DIGESTS);
  const [activeTab, setActiveTab] = useState("digest");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Generate digests for any feeds that don't have one yet
      const existingSources = new Set(digests.map((d) => d.source));
      const newDigests = feeds
        .filter((f) => !existingSources.has(f.name))
        .map(generatePlaceholderDigest);

      if (newDigests.length > 0) {
        setDigests((prev) => [...newDigests, ...prev]);
      }
      setIsRefreshing(false);
      setActiveTab("digest");
    }, 1500);
  };

  const handleAddFeed = (name: string, type: "podcast" | "newsletter", url: string) => {
    setFeeds((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, type, url, active: true },
    ]);
  };

  const handleRemoveFeed = (id: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
  };

  const podcastCount = feeds.filter((f) => f.type === "podcast").length;
  const newsletterCount = feeds.filter((f) => f.type === "newsletter").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface-elevated">
        <div className="container max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-foreground leading-none">
                Daily Digest
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Podcasts & newsletters, synthesized
              </p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <StatsBar
          podcastCount={podcastCount}
          newsletterCount={newsletterCount}
          digestsToday={digests.length}
          lastRun="Today, 10:00 AM"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted">
            <TabsTrigger value="digest" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Today's Digest
            </TabsTrigger>
            <TabsTrigger value="feeds" className="gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              Manage Feeds
            </TabsTrigger>
          </TabsList>

          <TabsContent value="digest" className="mt-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {digests.map((d, i) => (
                <DigestCard key={`${d.source}-${i}`} {...d} />
              ))}
              <p className="text-center text-sm text-muted-foreground pt-6 pb-8">
                ✅ That's {digests.filter(d => d.type === "podcast").length} podcast episodes and{" "}
                {digests.filter(d => d.type === "newsletter").length} newsletters for today.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="feeds" className="mt-6">
            <div className="grid md:grid-cols-[1fr,320px] gap-8">
              <FeedList feeds={feeds} onRemove={handleRemoveFeed} />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Add a Feed
                </h3>
                <AddFeedForm onAdd={handleAddFeed} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
