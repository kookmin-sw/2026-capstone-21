import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const campaigns = [
  {
    id: 1,
    name: "여름 스킨케어 특집",
    brand: "뷰티코리아",
    status: "active",
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    budget: 5000000,
    spent: 3200000,
    clicks: 12543,
    conversions: 456,
    revenue: 2280000,
    commission: 15,
    image: "https://images.unsplash.com/photo-1622782914767-404fb9ab3f57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NpYWwlMjBtZWRpYSUyMGVuZ2FnZW1lbnR8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: 2,
    name: "홈트레이닝 챌린지",
    brand: "피트니스플러스",
    status: "active",
    startDate: "2026-03-15",
    endDate: "2026-05-15",
    budget: 3000000,
    spent: 1500000,
    clicks: 8732,
    conversions: 234,
    revenue: 1170000,
    commission: 20,
    image: "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXRpbmclMjBhbmFseXRpY3MlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: 3,
    name: "봄 신상 패션쇼",
    brand: "스타일하우스",
    status: "pending",
    startDate: "2026-04-01",
    endDate: "2026-05-31",
    budget: 8000000,
    spent: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    commission: 12,
    image: "https://images.unsplash.com/photo-1645848810565-ff3c1de0da09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmZsdWVuY2VyJTIwbWFya2V0aW5nJTIwY29udGVudCUyMGNyZWF0b3J8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
  {
    id: 4,
    name: "건강 보조제 프로모션",
    brand: "헬스라이프",
    status: "completed",
    startDate: "2026-01-01",
    endDate: "2026-02-28",
    budget: 4000000,
    spent: 4000000,
    clicks: 15234,
    conversions: 678,
    revenue: 3390000,
    commission: 18,
    image: "https://images.unsplash.com/photo-1622782914767-404fb9ab3f57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2NpYWwlMjBtZWRpYSUyMGVuZ2FnZW1lbnR8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  },
];

export function Campaigns() {
  const [activeTab, setActiveTab] = useState("all");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      active: { variant: "default", label: "진행 중" },
      pending: { variant: "secondary", label: "대기 중" },
      completed: { variant: "outline", label: "완료" },
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === "all") return true;
    return campaign.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">캠페인 관리</h1>
          <p className="text-gray-500 mt-1">어필리에이트 캠페인을 관리하고 추적하세요</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          새 캠페인
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="캠페인 또는 브랜드 검색..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="active">진행 중</TabsTrigger>
          <TabsTrigger value="pending">대기 중</TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Campaign Image */}
                  <img 
                    src={campaign.image}
                    alt={campaign.name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />

                  {/* Campaign Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-gray-600 mt-1">{campaign.brand}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{campaign.startDate} ~ {campaign.endDate}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            상세 보기
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">예산</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          ₩{campaign.budget.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">집행액</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          ₩{campaign.spent.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">클릭 수</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {campaign.clicks.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">전환 수</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {campaign.conversions.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">수익</p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <p className="text-sm font-medium text-green-600">
                            ₩{campaign.revenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {campaign.status === "active" && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>예산 사용률</span>
                          <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
