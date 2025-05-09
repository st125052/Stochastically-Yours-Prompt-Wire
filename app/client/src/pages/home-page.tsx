import { useAuthStore } from "@/store/auth-store";
import { ChatWindow } from "@/components/chat/chat-window";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <ChatWindow />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <motion.div
        className="text-center max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="shiny-text text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500 dark:from-white dark:to-gray-500">
          AI-Powered News Assistant
        </h1>
        <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Stay informed with PromptWire's AI assistant. Get the latest financial news, analysis,
          and answers to your questions with verified sources.
        </p>
        <div className="mt-10 flex items-center justify-center gap-6">
          <Button
            size="lg"
            className="px-8 py-6 text-lg"
            onClick={() => navigate("/register")}
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
        </div>
        <div className="mt-20 relative">
          <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 opacity-40 dark:opacity-50 blur-lg" />
          <div className="relative rounded-lg overflow-hidden border border-zinc-300 dark:border-white/30 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-black/30">
            <div className="p-6 flex flex-col space-y-4">
              <div className="h-10 flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-red-500 rounded-full" />
                  <div className="h-3 w-3 bg-yellow-500 rounded-full" />
                  <div className="h-3 w-3 bg-green-500 rounded-full" />
                </div>
                <div className="text-sm font-mono bg-zinc-200 dark:bg-zinc-800 rounded px-2 py-1">PromptWire</div>
              </div>

              <div className="flex justify-start">
                <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg px-4 py-3 max-w-[80%]">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">What can you tell me about the latest financial news?</p>
                  <p className="text-xs text-right mt-1 text-zinc-500">9:32 AM</p>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-blue-600 rounded-lg px-4 py-3 max-w-[80%]">
                  <p className="text-sm text-white">
                    Recent market analysis shows significant shifts in global financial markets.
                    Here are the key market insights:
                  </p>
                  <ul className="mt-2 text-sm list-disc pl-5 space-y-1 text-white">
                    <li>Global markets show increased volatility amid economic uncertainty</li>
                    <li>Tech sector leads market gains with AI-driven growth</li>
                    <li>Central banks maintain cautious stance on interest rates</li>
                  </ul>
                  <div className="mt-3 text-xs border-t border-blue-500 pt-2">
                    <div className="font-medium text-white">Sources:</div>
                    <p className="text-blue-300 underline">bloomberg.com/markets</p>
                    <p className="text-blue-300 underline">reuters.com/business</p>
                  </div>
                  <p className="text-xs text-right mt-1 text-blue-300">9:33 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
