
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Zap, Palette, ArrowRight, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageGenerator from "../components/ImageGenerator/ImageGenerator";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to true by default for convenience
  const [showAuth, setShowAuth] = useState(false);
  const { toast } = useToast();

  const handleSignUp = (e) => {
    e.preventDefault();
    toast({
      title: "Account Created!",
      description: "Welcome to AI Image Generator. Redirecting to generation page...",
    });
    setTimeout(() => {
      setIsLoggedIn(true);
      setShowAuth(false);
    }, 1500);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    toast({
      title: "Welcome Back!",
      description: "Successfully signed in. Redirecting...",
    });
    setTimeout(() => {
      setIsLoggedIn(true);
      setShowAuth(false);
    }, 1500);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setShowAuth(false);
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Header with sign out button */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">AI Image Generator</h1>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10"
          >
            Sign Out
          </Button>
        </div>
        
        {/* Image Generator Component */}
        <ImageGenerator />
      </div>
    );
  }

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white mb-2">Join AI Image Generator</h1>
            <p className="text-blue-200">Create stunning images with the power of AI</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardContent className="p-6">
              <Tabs defaultValue="signup" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/20">
                  <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/30">Sign Up</TabsTrigger>
                  <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/30">Sign In</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input id="name" placeholder="Enter your name" className="bg-white/20 border-white/30 text-white placeholder:text-gray-300" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" className="bg-white/20 border-white/30 text-white placeholder:text-gray-300" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input id="password" type="password" placeholder="Create a password" className="bg-white/20 border-white/30 text-white placeholder:text-gray-300" required />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-full transition-all duration-300 transform hover:scale-105">
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-white">Email</Label>
                      <Input id="signin-email" type="email" placeholder="Enter your email" className="bg-white/20 border-white/30 text-white placeholder:text-gray-300" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-white">Password</Label>
                      <Input id="signin-password" type="password" placeholder="Enter your password" className="bg-white/20 border-white/30 text-white placeholder:text-gray-300" required />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-full transition-all duration-300 transform hover:scale-105">
                      Sign In
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowAuth(false)}
                className="w-full mt-4 text-white hover:bg-white/20"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8 animate-fade-in">
              <Sparkles className="w-20 h-20 mx-auto mb-6 text-yellow-400 animate-bounce" />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent animate-fade-in">
              AI Image Generator
            </h1>
            <p className="text-2xl md:text-3xl mb-8 text-blue-200 animate-fade-in">
              Transform your imagination into stunning visuals
            </p>
            <p className="text-lg mb-12 text-gray-300 max-w-2xl mx-auto animate-fade-in">
              Create breathtaking images from simple text descriptions using cutting-edge artificial intelligence
            </p>
            <Button 
              onClick={() => setShowAuth(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-12 py-4 text-xl rounded-full transition-all duration-300 transform hover:scale-105 animate-fade-in"
            >
              Start Creating <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Unleash Your Creativity</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <CardTitle className="text-white text-2xl">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-center text-lg">
                Generate high-quality images in seconds with our advanced AI models
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="text-center">
              <Palette className="w-12 h-12 mx-auto mb-4 text-pink-400" />
              <CardTitle className="text-white text-2xl">Unlimited Styles</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-center text-lg">
                From photorealistic to artistic, create images in any style you can imagine
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
            <CardHeader className="text-center">
              <Star className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <CardTitle className="text-white text-2xl">Premium Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-center text-lg">
                Get crisp, detailed images perfect for any professional or personal use
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/5 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Users className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-gray-300">Happy Creators</div>
            </div>
            <div>
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-gray-300">Images Generated</div>
            </div>
            <div>
              <Star className="w-12 h-12 mx-auto mb-4 text-pink-400" />
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-gray-300">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Create Magic?</h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of creators who are already using AI to bring their ideas to life
        </p>
        <Button 
          onClick={() => setShowAuth(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-12 py-4 text-xl rounded-full transition-all duration-300 transform hover:scale-105"
        >
          Get Started Free
        </Button>
      </div>
    </div>
  );
};

export default Index;
