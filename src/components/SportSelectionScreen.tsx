import { useNavigate } from "react-router-dom";
import { useSport, Sport } from "@/hooks/use-sport";

export default function SportSelectionScreen() {
  const { setSelectedSport } = useSport();
  const navigate = useNavigate();

  const handleSportSelect = (sport: Sport) => {
    setSelectedSport(sport);
    const path = sport === 'nfl' ? '/nfl' : '/six-nations';
    navigate(path);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            SELECT SPORT
          </h1>
          <p className="text-sm sm:text-base text-white/40 font-medium">
            Choose to start competing
          </p>
        </div>

        {/* Sport Logos */}
        <div className="grid grid-cols-2 gap-6 sm:gap-10 max-w-3xl w-full">
          {/* NFL */}
          <button
            onClick={() => handleSportSelect("nfl")}
            className="group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl"
          >
            {/* Animated glow on hover */}
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:via-blue-500/10 group-hover:to-purple-500/20 blur-2xl transition-all duration-700 rounded-3xl"></div>

            {/* Logo container */}
            <div className="relative aspect-square w-full bg-slate-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-800 group-hover:border-blue-500/50 transition-all duration-500 overflow-hidden group-active:scale-95">
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>

              {/* Logo */}
              <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
                <img
                  src="/nfl-logo.png"
                  alt="NFL"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 filter group-hover:brightness-110"
                />
              </div>
            </div>

            {/* Label */}
            <div className="mt-4 sm:mt-6">
              <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-400 transition-colors duration-300" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                NFL
              </h2>
            </div>
          </button>

          {/* 6 Nations */}
          <button
            onClick={() => handleSportSelect("six-nations")}
            className="group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl"
          >
            {/* Animated glow on hover */}
            <div className="absolute -inset-4 bg-gradient-to-br from-green-500/0 via-emerald-500/0 to-green-500/0 group-hover:from-green-500/20 group-hover:via-emerald-500/10 group-hover:to-green-500/20 blur-2xl transition-all duration-700 rounded-3xl"></div>

            {/* Logo container */}
            <div className="relative aspect-square w-full bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700 group-hover:border-green-500/50 transition-all duration-500 overflow-hidden group-active:scale-95">
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>

              {/* Logo */}
              <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
                <img
                  src="/6Nations.png"
                  alt="6 Nations"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 filter group-hover:brightness-110"
                />
              </div>
            </div>

            {/* Label */}
            <div className="mt-4 sm:mt-6">
              <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-green-400 transition-colors duration-300" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                6 NATIONS
              </h2>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
