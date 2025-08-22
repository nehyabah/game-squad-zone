import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Key } from "lucide-react";
import { nflApi } from "@/services/nflApi";
import { toast } from "@/hooks/use-toast";

interface ApiKeyInputProps {
  onApiKeySet?: () => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your NFL API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Set the API key and test it
      nflApi.setApiKey(apiKey);
      
      // Test the API key by trying to fetch teams
      await nflApi.getTeams();
      
      toast({
        title: "API Key saved!",
        description: "Successfully connected to NFL API",
      });
      
      onApiKeySet?.();
    } catch (error) {
      toast({
        title: "Invalid API Key",
        description: "Please check your API key and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto border border-primary/20 bg-primary/5">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <Key className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-lg">NFL API Key Required</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your API key from api-sports.io to get real NFL team logos and data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              placeholder="Enter your NFL API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={handleSaveKey} 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect API"}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center">
          <p>Don't have an API key? <a href="https://api-sports.io/documentation/american-football/v1" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get one here</a></p>
          <p className="mt-1">Your key is stored locally and securely</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;