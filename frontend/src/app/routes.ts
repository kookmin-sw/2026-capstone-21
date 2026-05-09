import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { NotFound } from "./components/NotFound";
import { InfluencerProfile } from "./components/InfluencerProfile";
import { InterestList } from "./components/InterestList";
import { StatisticsChart } from "./components/StatisticsChart";
import { SystemConsole } from "./components/SystemConsole";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true, // 사용자가 "/" 경로로 들어왔을 때 기본으로 보여줄 페이지
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
