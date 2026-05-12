import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { NotFound } from "./components/NotFound";
import { InfluencerProfile } from "./components/InfluencerProfile";
import { InterestList } from "./components/InterestList";
import { StatisticsChart } from "./components/StatisticsChart";
import { SystemConsole } from "./components/SystemConsole";
import { ChatHistory } from "./components/ChatHistory";
import { RecommendationDetail } from "./components/RecommendationDetail";
import { MyPage } from "./components/MyPage";
import { HomePage } from "./components/HomePage";

export const router = createBrowserRouter([
  {
    path: "/home",
    Component: HomePage,
  },
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: InfluencerProfile, 
      },
      {
        path: "find",
        Component: InfluencerProfile,
      },
      {
        path: "interest",
        Component: InterestList,
      },
      {
        path: "Insights",
        Component: StatisticsChart,
      },
      {
        path: "chat-history",
        Component: ChatHistory,
      },
      {
        path: "my",
        Component: MyPage,
      },
      {
        path: "recommendation/:id",
        Component: RecommendationDetail,
      },
      {
        path: "system-console",
        Component: SystemConsole,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);