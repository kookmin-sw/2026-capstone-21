import { useEffect, useState } from "react";
import { TrendingUp, Users, Globe, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

/* =========================
   TYPES
========================= */
type DailyTrend = {
  date: string;
  count: number;
};

type CategoryDistribution = {
  category_name: string;
  count: number;
};

/* =========================
   API BASE
========================= */
const BASE_URL = "http://localhost:8000/insights";

/* =========================
   COMPONENT
========================= */
export function Analytics() {
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDistribution[]>([]);
  const [totalSelections, setTotalSelections] = useState<number>(0);
  const [totalInfluencers, setTotalInfluencers] = useState<number>(0);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    // 1. daily trends
    fetch(`${BASE_URL}/daily-trends`)
      .then(res => res.json())
      .then(setDailyTrends)
      .catch(console.error);

    // 2. category distribution
    fetch(`${BASE_URL}/category-distribution`)
      .then(res => res.json())
      .then(setCategoryData)
      .catch(console.error);

    // 3. total selections
    fetch(`${BASE_URL}/total-selections`)
      .then(res => res.json())
      .then(data => setTotalSelections(data.total))
      .catch(console.error);

    // 4. total influencers
    fetch(`${BASE_URL}/total-influencers`)
      .then(res => res.json())
      .then(data => setTotalInfluencers(data.total))
      .catch(console.error);
  }, []);

  /* =========================
     COLORS
  ========================= */
  const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981"];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500 mt-1">DB 기반 실시간 인사이트</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Selections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSelections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Influencers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInfluencers}</div>
          </CardContent>
        </Card>
      </div>

      {/* DAILY TREND */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trends</CardTitle>
          <CardDescription>일별 선택 수</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CATEGORY DISTRIBUTION */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>카테고리별 관심도</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="category_name"
                outerRadius={120}
                label
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

        </CardContent>
      </Card>

      {/* CATEGORY LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.map((item, index) => (
              <div key={item.category_name} className="flex justify-between">
                <span>{item.category_name}</span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
