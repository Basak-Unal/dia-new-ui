import { buildApiUrl } from '../config';
import { authAdapter } from "./AuthAdapter";

export const chatbotAdapter = {
  sendMessage: async (message: string): Promise<string> => {
    try {
      // Get logged-in user from AuthAdapter
      const session = authAdapter.getSession();
      if (!session) {
        throw new Error("Not signed in");
      }

      const userId = session.username; // adjust if your Session type uses another field

      // Use buildApiUrl to get the endpoint dynamically
      const API_GATEWAY_URL = buildApiUrl('chat'); // <-- This replaces hardcoding

      const response = await fetch(API_GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserID: userId,
          query: message,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Lambda error ${response.status}: ${text}`);
      }

      const data = await response.json();

      return data.Response || "No response from bot.";
    } catch (error) {
      console.error("Chatbot adapter error:", error);
      return "⚠️ Sorry, something went wrong talking to the chatbot.";
    }
  },
};
