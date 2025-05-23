const REFRESH_INTERVAL = 10 * 60 * 1000;

let refreshTimer: NodeJS.Timeout | null = null;

export function setupTokenRefresh(store: any) {
  const { refreshAccessToken, accessToken, refreshToken } = store.getState();

  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  if (accessToken && refreshToken) {
    refreshTimer = setInterval(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {}
    }, REFRESH_INTERVAL);
  }
}

export function clearTokenRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
} 