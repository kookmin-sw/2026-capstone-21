import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { InfluencerProvider } from "./context/InfluencerContext";

declare global {
  interface Window {
    chatwootSDK: any;
    $chatwoot: any;
    chatwootSettings: any;
  }
}

function NewChatButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onReady = () => setVisible(true);
    window.addEventListener("chatwoot:ready", onReady);
    if (window.$chatwoot) setVisible(true);
    return () => window.removeEventListener("chatwoot:ready", onReady);
  }, []);

  if (!visible) return null;

  const handleNewChat = () => {
    if (window.$chatwoot) {
      window.$chatwoot.reset();
      const userId = localStorage.getItem("user_id");
      const userName = localStorage.getItem("user_name");
      if (userId) {
        setTimeout(() => {
          fetch(`${import.meta.env.VITE_API_BASE_URL}/chatwoot/hmac/${userId}`)
            .then((res) => res.json())
            .then((data) => {
              window.$chatwoot.setUser(userId, {
                name: userName || `user_${userId}`,
                identifier_hash: data.identifier_hash,
              });
              window.$chatwoot.toggle("open");
            })
            .catch(() => {
              window.$chatwoot.setUser(userId, { name: userName || `user_${userId}` });
              window.$chatwoot.toggle("open");
            });
        }, 500);
      }
    }
  };

  return (
    <button
      onClick={handleNewChat}
      className="fixed bottom-24 right-5 z-[9998] bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition"
      title="새 채팅 시작"
    >
      + 새 채팅
    </button>
  );
}

export default function App() {
  useEffect(() => {
    // Chatwoot 설정: 유저 식별을 위해 설정
    window.chatwootSettings = {
      hideMessageBubble: false,
      position: "right",
      locale: "ko",
      type: "standard",
    };

    // 챗봇 스크립트 로드 시작
    (function (d, t) {
      const BASE_URL = import.meta.env.VITE_CHAT_SERVER_URL;
      const g = d.createElement(t) as HTMLScriptElement;
      const s = d.getElementsByTagName(t)[0];

      g.src = BASE_URL + "/packs/js/sdk.js";
      g.defer = true;
      g.async = true;

      g.onload = function () {
        if (window.chatwootSDK) {
          window.chatwootSDK.run({
            websiteToken: "jiCv8RLjjRupHCDz7zsKy8Hi",
            baseUrl: BASE_URL,
          });
        }
      };

      if (s && s.parentNode) {
        s.parentNode.insertBefore(g, s);
      }
    })(document, "script");

    // Chatwoot ready 이벤트에서 로그인된 유저 설정
    window.addEventListener("chatwoot:ready", function () {
      const userId = localStorage.getItem("user_id");
      const userName = localStorage.getItem("user_name");
      if (userId && window.$chatwoot) {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/chatwoot/hmac/${userId}`)
          .then((res) => res.json())
          .then((data) => {
            window.$chatwoot.setUser(userId, {
              name: userName || `user_${userId}`,
              identifier_hash: data.identifier_hash,
            });
          })
          .catch(() => {
            window.$chatwoot.setUser(userId, {
              name: userName || `user_${userId}`,
            });
          });
      }
    });
  }, []);

  return (
    <AuthProvider>
      <InfluencerProvider>
        <RouterProvider router={router} />
        <NewChatButton />
        <Toaster />
      </InfluencerProvider>
    </AuthProvider>
  );
}
