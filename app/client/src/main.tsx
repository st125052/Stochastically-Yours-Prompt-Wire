import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { useThemeStore } from "@/store/theme-store";

// Handle potential localStorage corruption
try {
  // Try to parse the chat store data
  const storedData = localStorage.getItem("promptwire-chats");
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      // Check for invalid date formats in the stored data
      // Assuming the storedData is an array of chat objects with a 'date' property
      // Adjust this logic as per your actual data structure
      const hasInvalidDate = Array.isArray(parsed)
        ? parsed.some(
            (chat) =>
              chat.date &&
              (typeof chat.date !== "string" ||
                Number.isNaN(Date.parse(chat.date)))
          )
        : false;
      if (hasInvalidDate) {
        console.warn("Invalid date format detected, clearing localStorage");
        localStorage.removeItem("promptwire-chats");
      }
    } catch (e) {
      // If we can't parse it, clear the storage to avoid app crashes
      console.warn("Invalid storage data detected, clearing localStorage");
      localStorage.removeItem("promptwire-chats");
    }
  }
} catch (e) {
  // If there's any error, clear localStorage
  console.error("Error accessing localStorage:", e);
  try {
    localStorage.clear();
  } catch (clearError) {
    console.error("Failed to clear localStorage:", clearError);
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element");
}

// Apply theme class based on theme store state
const theme = useThemeStore.getState().mode;
if (theme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
