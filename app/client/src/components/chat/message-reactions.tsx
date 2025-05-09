import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Bookmark, Copy, Share2 } from "lucide-react";

interface ReactionState {
  liked: boolean;
  disliked: boolean;
  saved: boolean;
}

export function MessageReactions() {
  const [reactions, setReactions] = useState<ReactionState>({
    liked: false,
    disliked: false,
    saved: false,
  });
  const [copied, setCopied] = useState(false);

  const toggleReaction = (reaction: keyof ReactionState) => {
    setReactions((prev) => {
      const newReactions = { ...prev };

      // If toggling like/dislike, ensure they're mutually exclusive
      if (reaction === "liked" && prev.disliked) {
        newReactions.disliked = false;
      } else if (reaction === "disliked" && prev.liked) {
        newReactions.liked = false;
      }

      newReactions[reaction] = !prev[reaction];
      return newReactions;
    });
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 ml-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 rounded-full",
                reactions.liked && "text-blue-500"
              )}
              onClick={() => toggleReaction("liked")}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Like</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 rounded-full",
                reactions.disliked && "text-red-500"
              )}
              onClick={() => toggleReaction("disliked")}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Dislike</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 rounded-full",
                reactions.saved && "text-yellow-500"
              )}
              onClick={() => toggleReaction("saved")}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Save</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleCopy}
            >
              <Copy className="h-3.5 w-3.5" />
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded"
                  >
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Copy</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Share</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
