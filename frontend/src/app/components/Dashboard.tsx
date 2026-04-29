import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  MousePointerClick,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const revenueData = [
  { month: "1월", revenue: 12000 },
  { month: "2월", revenue: 19000 },
  { month: "3월", revenue: 15000 },
  { month: "4월", revenue: 25000 },
  { month: "5월", revenue: 32000 },
  { month: "6월", revenue: 28000 },
  { month: "7월", revenue: 38000 },
];

const conversionData = [
  { day: "월", conversions: 45 },
  { day: "화", conversions: 52 },
  { day: "수", conversions: 38 },
  { day: "목", conversions: 65 },
  { day: "금", conversions: 78 },
  { day: "토", conversions: 95 },
  { day: "일", conversions: 88 },
];

const topCampaigns = [
  { 
    id: 1, 
    name: "뷰티 스킨케어 브랜드", 
    clicks: 1243, 
    conversions: 89, 
    revenue: 445000,
    image: "https://images.unsplash.com/photo-1622782914767-404fb9ab3f57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NpYWwlMjBtZWRpYSUyMGVuZ2FnZW1lbnR8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  { 
    id: 2, 
    name: "피트니스 앱 프로모션", 
    clicks: 987, 
    conversions: 64, 
    revenue: 320000,
    image: "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXRpbmclMjBhbmFseXRpY3MlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  { 
    id: 3, 
    name: "패션 브랜드 컬렉션", 
    clicks: 2103, 
    conversions: 134, 
    revenue: 670000,
    image: "https://images.unsplash.com/photo-1645848810565-ff3c1de0da09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmZsdWVuY2VyJTIwbWFya2V0aW5nJTIwY29udGVudCUyMGNyZWF0b3J8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-1">인플루언서 마케팅 성과를 한눈에 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 수익</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₩1,435,000</div>
            <div className="flex items-center mt-1 text-sm">
              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-gray-500 ml-1">지난 달 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 클릭</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24,563</div>
            <div className="flex items-center mt-1 text-sm">
              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+8.2%</span>
              <span className="text-gray-500 ml-1">지난 주 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전환율</CardTitle>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">4.8%</div>
            <div className="flex items-center mt-1 text-sm">
              <ArrowDown className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-red-600 font-medium">-0.3%</span>
              <span className="text-gray-500 ml-1">지난 주 대비</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">활성 캠페인</CardTitle>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="flex items-center mt-1 text-sm">
              <span className="text-gray-500">8개 진행 중</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>수익 추이</CardTitle>
            <CardDescription>최근 7개월 간 월별 수익</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Chart */}
        <Card>
          <CardHeader>
            <CardTitle>전환 통계</CardTitle>
            <CardDescription>최근 7일 간 일별 전환</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar dataKey="conversions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle>상위 성과 캠페인</CardTitle>
          <CardDescription>가장 높은 수익을 올린 캠페인</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCampaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <img 
                  src={campaign.image} 
                  alt={campaign.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{campaign.clicks.toLocaleString()} 클릭</span>
                    <span>•</span>
                    <span>{campaign.conversions} 전환</span>
                    <span>•</span>
                    <span className="font-medium text-green-600">
                      ₩{campaign.revenue.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(campaign.conversions / campaign.clicks) * 100} 
                    className="mt-2 h-1.5"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
