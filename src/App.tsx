import { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink, Globe, ShieldCheck, TrendingUp } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

type Status = "VERIFIED" | "FAKE NEWS" | "NEEDS CONFIRMATION";

interface AuditResult {
  status: Status;
  confidence: number;
  summary: string;
  sources: string[];
}

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyNews = async (isLocal: boolean) => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const localInstructions = "cross-reference claims with the most relevant sources. If the news is International, use International sources (BBC, Sky, Reuters). If the news is about Pakistan, then use Local sources (Dawn, Geo, Dunya). Do not force local context on international news.";
      const specificInstructions = isLocal 
        ? "The user specifically requested to verify this as Local News (Pakistan). Prioritize checking Pakistani sources like Dawn, Geo, Dunya, Express Tribune, etc., but respect the news content if it turns out to be international." 
        : "The user specifically requested to verify this as International News. Prioritize checking International sources like BBC, Sky, Reuters, AP, etc.";

      const prompt = `Analyze the following news claim, tweet, or video context to verify its authenticity.
      
Claim: ${input}

Instructions:
${localInstructions}
${specificInstructions}

You must search the web to verify the claim.

Output a structured JSON response. Set the status to one of these EXACT string values:
- "VERIFIED" (If confirmed by reliable data)
- "FAKE NEWS" (If proven false)
- "NEEDS CONFIRMATION" (If there's no valid data yet, or no reliable sources confirm it. When using this, include 'Data suggests this news cannot be verified at this moment. Please wait for official confirmation.' somewhere in the summary)
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1, // Low temperature for factual accuracy
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                enum: ["VERIFIED", "FAKE NEWS", "NEEDS CONFIRMATION"]
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence level of this verdict, from 0 to 100."
              },
              summary: {
                type: Type.STRING,
                description: "A detailed but concise summary of the findings, explaining why it is verified, fake, or unconfirmed. Be objective and factual."
              },
              sources: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of exactly matched URLs or source names used to verify the claim."
              }
            },
            required: ["status", "confidence", "summary", "sources"]
          }
        }
      });

      if (!response.text) {
        throw new Error("No response received from AI.");
      }

      const data = JSON.parse(response.text.trim()) as AuditResult;
      setResult(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-slate-200 pb-24">
      {/* Background Decorative Blur */}
      <div className="absolute top-[-10%] select-none pointer-events-none left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[20%] select-none pointer-events-none right-[-10%] w-[40%] h-[60%] bg-indigo-50/50 rounded-full blur-[100px]"></div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Header / Logo */}
        <header className="flex flex-col items-center pt-16 pb-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center items-center mb-6"
          >
            <div className="relative flex items-center justify-center w-[4.5rem] h-[4.5rem] bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 z-10 transition-transform hover:scale-105">
              <Search className="w-8 h-8 text-slate-800 absolute -translate-x-1 filter drop-shadow-sm" />
              <ShieldCheck className="w-9 h-9 text-slate-300 absolute translate-x-2 translate-y-1 opacity-60" strokeWidth={1.5} />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold font-serif text-slate-900 tracking-tight text-center"
          >
            Haqeeqat AI
          </motion.h1>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-slate-500 text-[0.8rem] md:text-xs tracking-[0.2em] uppercase font-bold text-center !leading-relaxed"
          >
            Your daily dose of verified news.<br className="md:hidden" /> No hype. No noise.
          </motion.p>
        </header>

        {/* Hero Urdu Highlights */}
        <div className="relative mx-auto max-w-4xl mb-12">
          {/* subtle glow */}
          <div className="absolute inset-0 bg-blue-50/50 blur-3xl opacity-70 rounded-full mix-blend-multiply"></div>
          <motion.div 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="relative glass-panel rounded-3xl p-8 md:p-10 text-center"
          >
            <h2 className="font-urdu text-2xl md:text-[2.25rem] leading-[2.2] md:leading-[2.4] text-slate-800 font-bold" dir="rtl">
              کسی بھی چینل کی خبر، یوٹیوب کے فیک جرنلسٹس کی باتوں یا ٹویٹس کا تجزیہ چاہتے ہیں؟ تو صرف دو کلک کریں اور اپنی خبر کی تصدیق پائیں ایک منٹ سے بھی کم وقت میں!
            </h2>
          </motion.div>
        </div>

        {/* Interactive Search Section */}
        <main className="max-w-3xl mx-auto relative z-10">
          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className={`relative group rounded-[2rem] p-1.5 transition-all duration-500 ${input.length > 0 ? 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 shadow-2xl shadow-slate-300/30' : 'bg-slate-200 hover:bg-slate-300'}`}
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-[1.6rem] overflow-hidden flex flex-col shadow-inner">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a claim, tweet link, or video URL to verify..."
                className="w-full h-32 md:h-40 bg-transparent px-6 md:px-8 py-5 md:py-6 text-xl md:text-2xl outline-none resize-none placeholder:text-slate-300 font-serif leading-relaxed text-slate-800"
                disabled={loading}
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 flex flex-wrap justify-center gap-2.5 px-2"
          >
             <QuickChip label="Election News" onClick={() => setInput("Check the latest trending election facts and rumors.")} />
             <QuickChip label="Budget 2026" onClick={() => setInput("Verify details about the upcoming Budget 2026.")} />
             <QuickChip label="Viral Tweet Check" onClick={() => setInput("Fact-check the recent viral tweets spreading today.")} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8"
          >
            <button
              onClick={() => verifyNews(true)}
              disabled={loading || !input.trim()}
              className="group relative overflow-hidden flex flex-col items-center justify-center py-5 px-6 bg-slate-900 border border-slate-800 text-white rounded-[1.25rem] hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center text-sm font-bold tracking-widest uppercase mb-1.5 z-10">
                <span className="text-xl mr-2.5">🇵🇰</span> Verify Local
              </div>
              <span className="text-xs text-slate-400 font-medium z-10 tracking-wide">Pakistan News Sources</span>
            </button>

            <button
              onClick={() => verifyNews(false)}
              disabled={loading || !input.trim()}
              className="group flex flex-col items-center justify-center py-5 px-6 glass-panel rounded-[1.25rem] hover:bg-white hover:shadow-xl hover:border-white transition-all duration-300 disabled:opacity-50 hover:-translate-y-1 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              <div className="flex items-center text-sm font-bold tracking-widest uppercase text-slate-900 mb-1.5">
                <span className="text-xl mr-2.5">🌍</span> Verify International
              </div>
              <span className="text-xs text-slate-500 font-medium tracking-wide">Global News Sources</span>
            </button>
          </motion.div>

          {/* Loading State */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col items-center justify-center pt-16 pb-8 space-y-5 overflow-hidden"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm">
                    <Loader2 className="w-6 h-6 text-slate-800 animate-spin" />
                  </div>
                </div>
                <p className="text-slate-500 tracking-[0.2em] uppercase text-xs font-bold animate-pulse">Running Data Models...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 bg-red-50/80 backdrop-blur-md rounded-2xl border border-red-100 flex items-start text-red-800 mt-8 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1 font-serif">System Error</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <AnimatePresence>
            {result && !loading && (
              <ResultCard result={result} />
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}

function QuickChip({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 rounded-full text-[0.65rem] md:text-xs font-bold tracking-wider uppercase text-slate-600 bg-white/60 hover:bg-white backdrop-blur-md border border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:text-slate-900 transition-all active:scale-95"
    >
      <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 text-slate-400" />
      {label}
    </button>
  );
}

function CircularProgress({ percentage, colorClass }: { percentage: number, colorClass: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-full h-full drop-shadow-sm">
        <circle
          className="text-slate-100"
          strokeWidth="6"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
        <circle
          className={`trust-meter-circle ${colorClass}`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${colorClass.replace('text-', 'text-opacity-90 text-')}`}>{percentage}%</span>
        <span className="text-[0.55rem] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Trust</span>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: AuditResult }) {
  let themeConfig = {
    colorClass: "",
    glowClass: "",
    badgeClass: "",
    icon: <AlertCircle />,
    label: ""
  };

  if (result.status === "VERIFIED") {
    themeConfig = {
      colorClass: "text-emerald-500",
      glowClass: "shadow-[0_10px_50px_rgba(16,185,129,0.1)] border-emerald-100",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="w-8 h-8" />,
      label: "VERIFIED"
    };
  } else if (result.status === "FAKE NEWS") {
    themeConfig = {
      colorClass: "text-red-500",
      glowClass: "shadow-[0_10px_50px_rgba(239,68,68,0.1)] border-red-100",
      badgeClass: "bg-red-50 text-red-700 border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
      icon: <XCircle className="w-8 h-8" />,
      label: "FAKE NEWS"
    };
  } else {
    themeConfig = {
      colorClass: "text-amber-500",
      glowClass: "shadow-[0_10px_50px_rgba(245,158,11,0.1)] border-amber-100",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertCircle className="w-8 h-8" />,
      label: "NEEDS CONFIRMATION"
    };
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative overflow-hidden bg-white/80 backdrop-blur-2xl rounded-[2rem] border ${themeConfig.glowClass} mt-12 mb-10`}
    >
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${themeConfig.colorClass}`}></div>
      
      <div className="p-8 md:p-10 lg:p-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-8 pb-8 border-b border-slate-100 gap-8">
          <div className="flex items-center">
            <div className={`mr-5 p-3 rounded-2xl bg-white shadow-sm border border-slate-50 ${themeConfig.colorClass}`}>
              {themeConfig.icon}
            </div>
            <div>
              <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs font-bold tracking-[0.15em] uppercase ${themeConfig.badgeClass}`}>
                {themeConfig.label}
              </div>
            </div>
          </div>
          
          <CircularProgress percentage={result.confidence} colorClass={themeConfig.colorClass} />
        </div>

        <div className="prose max-w-none mb-10">
          <p className="text-xl md:text-2xl leading-relaxed text-slate-800 font-serif font-medium">
            {result.summary}
          </p>
        </div>

        {result.sources && result.sources.length > 0 && (
          <div className="pt-8">
            <h4 className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-6 font-bold flex items-center">
              <ExternalLink className="w-4 h-4 mr-2.5" />
              Verified Sources
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {result.sources.map((source, idx) => {
                let domain = "";
                try {
                   domain = new URL(source.startsWith('http') ? source : `https://${source}`).hostname.replace('www.', '');
                } catch(e) {
                   domain = source;
                }
                return (
                  <a 
                    key={idx}
                    href={source.startsWith('http') ? source : `https://www.google.com/search?q=${encodeURIComponent(source)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all group shadow-sm hover:shadow"
                  >
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mr-3.5 group-hover:scale-105 transition-transform shrink-0">
                      <Globe className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-sm font-bold text-slate-700 truncate">{domain}</p>
                       <p className="text-[10px] text-slate-400 truncate tracking-wide mt-0.5">{source}</p>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
