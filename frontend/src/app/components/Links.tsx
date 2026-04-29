import { useState } from "react";
import { 
  Plus, 
  Search, 
  Copy, 
  ExternalLink, 
  BarChart2,
  Link as LinkIcon,
  QrCode,
  Share2,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

const affiliateLinks = [
  {
    id: 1,
    name: "스킨케어 세트 프로모션",
    shortUrl: "influlnk.io/sk2024",
    fullUrl: "https://beautykorea.com/products/skincare-set?ref=jieun_kim&aff=INF001",
    campaign: "여름 스킨케어 특집",
    clicks: 2847,
    conversions: 124,
    revenue: 620000,
    created: "2026-03-05",
  },
  {
    id: 2,
    name: "피트니스 앱 가입 링크",
    shortUrl: "influlnk.io/fit2024",
    fullUrl: "https://fitnessplus.com/signup?ref=jieun_kim&aff=INF001",
    campaign: "홈트레이닝 챌린지",
    clicks: 1523,
    conversions: 89,
    revenue: 445000,
    created: "2026-03-15",
  },
  {
    id: 3,
    name: "봄 신상 컬렉션",
    shortUrl: "influlnk.io/spring24",
    fullUrl: "https://stylehouse.com/collection/spring-2024?ref=jieun_kim&aff=INF001",
    campaign: "봄 신상 패션쇼",
    clicks: 0,
    conversions: 0,
    revenue: 0,
    created: "2026-03-20",
  },
  {
    id: 4,
    name: "건강보조제 특가",
    shortUrl: "influlnk.io/health24",
    fullUrl: "https://healthlife.com/products/supplements?ref=jieun_kim&aff=INF001",
    campaign: "건강 보조제 프로모션",
    clicks: 3421,
    conversions: 187,
    revenue: 935000,
    created: "2026-01-10",
  },
];

export function Links() {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("링크가 클립보드에 복사되었습니다");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const calculateConversionRate = (conversions: number, clicks: number) => {
    if (clicks === 0) return "0.0";
    return ((conversions / clicks) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">어필리에이트 링크</h1>
          <p className="text-gray-500 mt-1">맞춤 링크를 생성하고 성과를 추적하세요</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          새 링크 생성
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 링크 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{affiliateLinks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 클릭</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {affiliateLinks.reduce((sum, link) => sum + link.clicks, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 전환</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {affiliateLinks.reduce((sum, link) => sum + link.conversions, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 수익</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₩{affiliateLinks.reduce((sum, link) => sum + link.revenue, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="링크 또는 캠페인 검색..." 
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Links List */}
      <div className="space-y-4">
        {affiliateLinks.map((link) => (
          <Card key={link.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{link.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{link.campaign}</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    생성일: {link.created}
                  </Badge>
                </div>

                {/* URLs */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">단축 URL</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {link.shortUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(link.shortUrl, link.id)}
                    >
                      {copiedId === link.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">원본 URL</p>
                      <p className="text-sm text-gray-700 truncate">
                        {link.fullUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(link.fullUrl, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-4 gap-6 flex-1">
                    <div>
                      <p className="text-xs text-gray-500">클릭 수</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {link.clicks.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">전환 수</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {link.conversions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">전환율</p>
                      <p className="text-lg font-bold text-purple-600 mt-1">
                        {calculateConversionRate(link.conversions, link.clicks)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">수익</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        ₩{link.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      QR
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      공유
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      통계
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
