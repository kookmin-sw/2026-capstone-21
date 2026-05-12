import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { InfluencerProvider } from "./context/InfluencerContext";
import { ChatWidget } from "./components/ChatWidget";

export default function App() {
  return (
    <AuthProvider>
      <InfluencerProvider>
        <RouterProvider router={router} />
        <ChatWidget />
        <Toaster />
      </InfluencerProvider>
    </AuthProvider>
  );
}
