import { 
  TrendingUp, 
  Users, 
  Globe, 
  Smartphone,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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

const trafficData = [
  { date: "3/17", clicks: 245, conversions: 12, revenue: 60000 },
  { date: "3/18", clicks: 312, conversions: 18, revenue: 90000 },
  { date: "3/19", clicks: 289, conversions: 15, revenue: 75000 },
  { date: "3/20", clicks: 378, conversions: 22, revenue: 110000 },
  { date: "3/21", clicks: 423, conversions: 28, revenue: 140000 },
  { date: "3/22", clicks: 512, conversions: 35, revenue: 175000 },
  { date: "3/23", clicks: 489, conversions: 31, revenue: 155000 },
];

const deviceData = [
  { name: "모바일", value: 68, color: "#8b5cf6" },
  { name: "데스크톱", value: 25, color: "#ec4899" },
  { name: "태블릿", value: 7, color: "#06b6d4" },
];

const platformData = [
  { platform: "Instagram", clicks: 8542, conversions: 287 },
  { platform: "YouTube", clicks: 6234, conversions: 198 },
  { platform: "TikTok", clicks: 5123, conversions: 165 },
  { platform: "Blog", clicks: 3421, conversions: 134 },
  { platform: "Twitter", clicks: 1243, conversions: 45 },
];

const topLocations = [
  { city: "서울", clicks: 12543, percentage: 42 },
  { city: "부산", clicks: 4231, percentage: 14 },
  { city: "대구", clicks: 3421, percentage: 11 },
  { city: "인천", clicks: 2987, percentage: 10 },
  { city: "광주", clicks: 2145, percentage: 7 },
];

export function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">분석</h1>
        <p className="text-gray-500 mt-1">상세한 성과 분석과 인사이트를 확인하세요</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">기간 선택</span>
            </div>
            <Tabs defaultValue="7days" className="w-auto">
              <TabsList>
                <TabsTrigger value="7days">최근 7일</TabsTrigger>
                <TabsTrigger value="30days">최근 30일</TabsTrigger>
                <TabsTrigger value="90days">최근 90일</TabsTrigger>
                <TabsTrigger value="custom">사용자 지정</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>성과 추이</CardTitle>
          <CardDescription>클릭, 전환, 수익의 일별 추이</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} />
              <YAxis yAxisId="left" stroke="#888888" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="clicks" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="클릭"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="conversions" 
                stroke="#ec4899" 
                strokeWidth={2}
                name="전환"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#06b6d4" 
                strokeWidth={2}
                name="수익 (원)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Device & Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>디바이스별 트래픽</CardTitle>
            <CardDescription>디바이스 유형별 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {deviceData.map((device) => (
                <div key={device.name} className="text-center">
                  <div 
                    className="w-3 h-3 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: device.color }}
                  />
                  <p className="text-sm font-medium text-gray-900">{device.value}%</p>
                  <p className="text-xs text-gray-500">{device.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>플랫폼별 성과</CardTitle>
            <CardDescription>소셜 미디어 플랫폼별 클릭과 전환</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="클릭" />
                <Bar dataKey="conversions" fill="#ec4899" radius={[4, 4, 0, 0]} name="전환" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Locations */}
      <Card>
        <CardHeader>
          <CardTitle>지역별 트래픽</CardTitle>
          <CardDescription>주요 도시별 클릭 분포</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topLocations.map((location, index) => (
              <div key={location.city} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{location.city}</p>
                      <p className="text-sm text-gray-500">
                        {location.clicks.toLocaleString()} 클릭
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {location.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                    style={{ width: `${location.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">평균 클릭률</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">6.8%</div>
            <p className="text-xs text-gray-500 mt-1">업계 평균 대비 +2.3%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">평균 세션 시간</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3m 42s</div>
            <p className="text-xs text-gray-500 mt-1">지난 주 대비 +15초</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">이탈률</CardTitle>
            <Globe className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">42.3%</div>
            <p className="text-xs text-gray-500 mt-1">지난 주 대비 -3.2%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}