import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeTransitionIndicator } from "@/components/ui/theme-transition-indicator";

export function Layout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col antialiased">
      <Header />
      {isAuthenticated && <Sidebar />}
      <main
        className={`flex flex-1 flex-col bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-gray-900 dark:to-gray-950 ${
          isAuthenticated ? "md:pl-[300px]" : ""
        }`}
      >
        <div className="container flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <Toaster />
      <ThemeTransitionIndicator />
    </div>
  );
}
