import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { InfluencerProvider } from "./context/InfluencerContext";

export default function App() {
  useEffect(() => {
    // 챗봇 스크립트 로드 시작
    (function (d, t) {
      const BASE_URL = import.meta.env.VITE_CHAT_SERVER_URL;
      const g = d.createElement(t) as HTMLScriptElement;
      const s = d.getElementsByTagName(t)[0];

      g.src = BASE_URL + "/packs/js/sdk.js";
      g.defer = true;
      g.async = true;

      g.onload = function () {
        if ((window as any).chatwootSDK) {
          (window as any).chatwootSDK.run({
            websiteToken: "jiCv8RLjjRupHCDz7zsKy8Hi",
            baseUrl: BASE_URL,
          });
        }
      };

      if (s && s.parentNode) {
        s.parentNode.insertBefore(g, s);
      }
    })(document, "script");
  }, []);

  return (
    <AuthProvider>
      <InfluencerProvider>
        <RouterProvider router={router} />
        <Toaster />
      </InfluencerProvider>
    </AuthProvider>
  );
}
