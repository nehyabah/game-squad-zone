import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ArrowRight, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.tsx";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = () => {
    login(); // This will redirect to OAuth provider
  };

  const features = [
    {
      icon: Users,
      title: "Squad Building",
      description: "Create your perfect team with smart roster management",
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      icon: TrendingUp,
      title: "Live Tracking",
      description: "Real-time scores and performance insights",
      gradient: "from-emerald-500 to-teal-400"
    },
    {
      icon: Sparkles,
      title: "Premium Tools",
      description: "Advanced features for the competitive edge",
      gradient: "from-purple-500 to-pink-400"
    }
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        {/* Solid background color instead of image */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      
      {/* Light overlay for subtle contrast */}
      <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
      
      {/* Gradient overlay for additional depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-600/5" />
      
      {/* Animated gradient orbs */}
      <div className={`absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-primary/15 to-blue-500/15 rounded-full blur-3xl transition-all duration-[3000ms] ${mounted ? 'scale-110 opacity-60' : 'scale-100 opacity-40'}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-48 h-48 md:w-80 md:h-80 bg-gradient-to-r from-purple-500/12 to-pink-500/12 rounded-full blur-3xl transition-all duration-[4000ms] delay-500 ${mounted ? 'scale-125 opacity-50' : 'scale-100 opacity-35'}`} />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-full transition-all duration-[${6000 + i * 1000}ms] ease-in-out ${mounted ? 'animate-pulse' : ''}`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 12}%`,
              animationDelay: `${i * 800}ms`
            }}
          />
        ))}
      </div>
      
      <div className="relative w-full max-w-7xl grid lg:grid-cols-5 gap-8 lg:gap-16">
        {/* Left side - Branding & Features */}
        <div className="hidden lg:flex lg:col-span-3 flex-col justify-center space-y-12 px-8">
          {/* Enhanced Hero Section */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="relative">
                <h1 className={`text-6xl xl:text-7xl font-black tracking-tight transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                  <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent drop-shadow-sm">
                    Squad
                  </span>
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                    Pot
                  </span>
                </h1>
                <div className={`absolute -top-4 -right-4 transition-all duration-1500 delay-700 ${mounted ? 'rotate-12 scale-100 opacity-100' : 'rotate-0 scale-0 opacity-0'}`}>
                  <Sparkles className="w-8 h-8 text-primary/60 animate-pulse" />
                </div>
              </div>
              
              <div className={`transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <p className="text-xl xl:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
                  The future of fantasy sports is here. Build winning squads with 
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-semibold"> cutting-edge tools </span>
                  and compete at the highest level.
                </p>
              </div>
              
            </div>
          </div>
          
          {/* Enhanced Features Grid */}
          <div className="grid grid-cols-1 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group relative overflow-hidden p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 ${mounted ? `translate-x-0 opacity-100` : `translate-x-8 opacity-0`}`}
                style={{ transitionDelay: `${800 + index * 200}ms` }}
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative flex items-center gap-6">
                  <div className={`relative p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white drop-shadow-sm" />
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-500`} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Authentication */}
        <div className="lg:col-span-2 w-full max-w-md mx-auto lg:max-w-none">
          {/* Compact Mobile Header */}
          <div className="lg:hidden mb-6 text-center space-y-2">
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Squad
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Pot
              </span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Build winning squads
            </p>
          </div>

          <Card className={`border-0 shadow-2xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <CardContent className="p-6 lg:p-8 space-y-6 lg:space-y-8 relative overflow-hidden">
              {/* Card background glow - more subtle with image background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-blue-500/3 opacity-50" />
              {/* Compact Welcome Header */}
              <div className="relative text-center space-y-2 lg:space-y-3">
                <div className="relative inline-block">
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">Welcome back</h2>
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500 rounded-full opacity-60" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-base lg:text-lg">
                  Ready to <span className="text-primary font-semibold">dominate</span>?
                </p>
              </div>


              {/* Compact Login Button */}
              <Button 
                onClick={handleLogin}
                disabled={loading}
                className="relative w-full h-14 lg:h-16 text-base lg:text-lg font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 hover:from-primary/90 hover:via-blue-600/90 hover:to-purple-600/90 shadow-2xl hover:shadow-primary/25 transition-all duration-500 rounded-xl lg:rounded-2xl group overflow-hidden"
                size="lg"
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-2 lg:gap-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 lg:w-6 lg:h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform duration-300" />
                      <span>Enter the Arena</span>
                      <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </Button>
              
              {/* Compact Auth Info */}
              <div className="relative text-center">
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400">
                  New to SquadPot? Account created automatically
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;