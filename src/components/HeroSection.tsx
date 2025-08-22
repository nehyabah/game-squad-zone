import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Target } from "lucide-react";
import heroImage from "@/assets/nfl-hero-banner.jpg";

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-br from-background via-background to-secondary overflow-hidden min-h-[500px] lg:min-h-[600px] flex items-center">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/70" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              Create Your
              <span className="text-primary block bg-gradient-primary bg-clip-text text-transparent">NFL Squad</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl leading-relaxed">
              Invite friends with simple join codes, pick exactly 3 NFL games, and compete for glory. The ultimate social fantasy experience starts here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Create Squad
              </Button>
              <Button variant="game" size="lg" className="w-full sm:w-auto">
                Join Squad
              </Button>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="grid gap-4 sm:gap-6 mt-8 lg:mt-0">
            <Card className="shadow-hover border-0 bg-gradient-card">
              <CardContent className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">Squad Up</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Create private squads and invite friends with a simple join code.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-hover border-0 bg-gradient-card">
              <CardContent className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">Pick 3 Games</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Simple format - select exactly 3 NFL games against the spread.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-hover border-0 bg-gradient-card">
              <CardContent className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 sm:mb-2 text-sm sm:text-base">Compete & Win</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Climb the leaderboard and prove you're the ultimate NFL expert.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;