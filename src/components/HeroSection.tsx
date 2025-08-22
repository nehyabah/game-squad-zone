import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Target } from "lucide-react";
import heroImage from "@/assets/nfl-hero-banner.jpg";

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-br from-background to-muted overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Create Your
              <span className="text-primary block">NFL Squad</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg">
              Invite friends, pick 3 games, and compete for glory. The ultimate NFL fantasy experience starts here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg">
                Create Squad
              </Button>
              <Button variant="game" size="lg">
                Join Squad
              </Button>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="grid gap-6">
            <Card className="shadow-hover border-0 bg-gradient-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Squad Up</h3>
                  <p className="text-muted-foreground">Create private squads and invite friends with a simple join code.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-hover border-0 bg-gradient-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Pick 3 Games</h3>
                  <p className="text-muted-foreground">Simple format - select exactly 3 NFL games against the spread.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-hover border-0 bg-gradient-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Compete & Win</h3>
                  <p className="text-muted-foreground">Climb the leaderboard and prove you're the ultimate NFL expert.</p>
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