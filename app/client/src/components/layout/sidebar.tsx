import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore, type Chat } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  Trash2Icon,
  MessageSquarePlusIcon,
  HistoryIcon,
  SearchIcon,
  Loader2Icon,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ChatSearch } from "@/components/chat/chat-search";
import { useAuthStore } from "@/store/auth-store";

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function ChatItem({ chat, isActive, onClick, onDelete }: ChatItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  // Use the first user message as the chat name if available
  const firstUserMessage = chat.messages && chat.messages.length > 0
    ? chat.messages.find((msg) => msg.role === "user")?.content
    : null;
  const displayTitle = firstUserMessage || chat.title;

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
        isActive ? "bg-accent/70 text-accent-foreground" : "transparent"
      )}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        className="flex-1 overflow-hidden text-left"
        onClick={onClick}
      >
        <div className="truncate">{displayTitle}</div>
        <div className="text-xs text-muted-foreground">
          {formatDate(chat.updatedAt)}
        </div>
      </button>
      {showDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-70 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2Icon className="h-4 w-4" />
          <span className="sr-only">Delete chat</span>
        </Button>
      )}
    </div>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { chats, currentChatId, createChat, setCurrentChat, deleteChat, loadChatHistory, loadChatHistoryDetail, isLoading } = useChatStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingDeleteChatId, setPendingDeleteChatId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      loadChatHistory(accessToken);
    }
  }, [accessToken, loadChatHistory]);

  const handleChatSelect = async (chatId: string) => {
    setCurrentChat(chatId);
    if (accessToken) {
      await loadChatHistoryDetail(accessToken, chatId);
    }
  };

  return (
    <>
      {/* Mobile version (Sheet) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 left-4 z-40 rounded-full shadow-lg md:hidden bg-primary text-primary-foreground"
          >
            <HistoryIcon className="h-5 w-5" />
            <span className="sr-only">Chat history</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Chat History</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Button
                className="flex-1 justify-start gap-2"
                onClick={createChat}
              >
                <PlusIcon className="h-4 w-4" />
                New Chat
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsSearchOpen(true)}
              >
                <SearchIcon className="h-4 w-4" />
                <span className="sr-only">Search chats</span>
              </Button>
            </div>
            <div className="flex-1 overflow-auto px-4 py-2">
              {isLoading ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2">
                  <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Loading chats...</div>
                </div>
              ) : chats.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center">
                  <MessageSquarePlusIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm font-medium">No chats yet</div>
                  <div className="text-xs text-muted-foreground">
                    Start a new chat to get news and information.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat: Chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === currentChatId}
                      onClick={() => handleChatSelect(chat.id)}
                      onDelete={() => setPendingDeleteChatId(chat.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop version */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-[300px] flex-col border-r bg-white dark:bg-zinc-900 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-md md:flex",
          className
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Chat History</h2>
        </div>
        <div className="flex flex-col h-full">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Button
              className="flex-1 justify-start gap-2"
              onClick={createChat}
            >
              <PlusIcon className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsSearchOpen(true)}
            >
              <SearchIcon className="h-4 w-4" />
              <span className="sr-only">Search chats</span>
            </Button>
          </div>
          <div className="flex-1 overflow-auto px-4 py-2">
            {isLoading ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2">
                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Loading chats...</div>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center">
                <MessageSquarePlusIcon className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm font-medium">No chats yet</div>
                <div className="text-xs text-muted-foreground">
                  Start a new chat to get news and information.
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat: Chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === currentChatId}
                    onClick={() => handleChatSelect(chat.id)}
                    onDelete={() => setPendingDeleteChatId(chat.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-[500px] h-[70vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search Chats
            </DialogTitle>
          </DialogHeader>
          <ChatSearch
            onSelect={(chatId) => setCurrentChat(chatId)}
            onClose={() => setIsSearchOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pendingDeleteChatId} onOpenChange={() => setPendingDeleteChatId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat?</DialogTitle>
          </DialogHeader>
          <div>Are you sure you want to delete this chat? This action cannot be undone.</div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPendingDeleteChatId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (pendingDeleteChatId) {
                  setIsDeleting(true);
                  await deleteChat(pendingDeleteChatId);
                  setIsDeleting(false);
                  setPendingDeleteChatId(null);
                }
              }}
            >
              {isDeleting ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
