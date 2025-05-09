import { useAuthStore } from "@/store/auth-store";

// Token refresh interval in milliseconds (10 minutes)
const REFRESH_INTERVAL = 10 * 60 * 1000;

let refreshTimer: NodeJS.Timeout | null = null;

export function setupTokenRefresh() {
  const { refreshAccessToken, accessToken, refreshToken } = useAuthStore.getState();

  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  if (accessToken && refreshToken) {
    refreshTimer = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }, REFRESH_INTERVAL);
  }
}

export function clearTokenRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// Setup token refresh when the app starts
setupTokenRefresh(); 