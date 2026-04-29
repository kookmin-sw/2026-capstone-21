import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Youtube, 
  Twitter,
  Globe,
  Briefcase,
  DollarSign,
  CreditCard,
  Settings,
  Bell,
  Shield
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

const socialAccounts = [
  { 
    platform: "Instagram", 
    handle: "@jieun_kim", 
    followers: "125K",
    icon: Instagram,
    color: "text-pink-600"
  },
  { 
    platform: "YouTube", 
    handle: "지은의 일상", 
    followers: "89K",
    icon: Youtube,
    color: "text-red-600"
  },
  { 
    platform: "TikTok", 
    handle: "@jieunkim", 
    followers: "210K",
    icon: Globe,
    color: "text-gray-900"
  },
  { 
    platform: "Blog", 
    handle: "jieun-blog.com", 
    followers: "45K",
    icon: Globe,
    color: "text-blue-600"
  },
];

const paymentHistory = [
  { date: "2026-03-01", amount: 1280000, status: "완료", method: "은행 계좌" },
  { date: "2026-02-01", amount: 950000, status: "완료", method: "은행 계좌" },
  { date: "2026-01-01", amount: 1120000, status: "완료", method: "은행 계좌" },
];

export function Profile() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">프로필</h1>
        <p className="text-gray-500 mt-1">계정 정보와 설정을 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="https://images.unsplash.com/photo-1645848810565-ff3c1de0da09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmZsdWVuY2VyJTIwbWFya2V0aW5nJTIwY29udGVudCUyMGNyZWF0b3J8ZW58MXx8fHwxNzc0MjgwNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" />
                  <AvatarFallback>JK</AvatarFallback>
                </Avatar>
                <h3 className="mt-4 font-bold text-gray-900">김지은</h3>
                <p className="text-sm text-gray-500">@jieun_kim</p>
                <Badge className="mt-2" variant="secondary">
                  프리미엄 인플루언서
                </Badge>
                
                <div className="w-full mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <p className="text-xs text-gray-500 mt-1">캠페인</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">24.5K</p>
                      <p className="text-xs text-gray-500 mt-1">클릭</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">₩1.4M</p>
                      <p className="text-xs text-gray-500 mt-1">수익</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6">프로필 사진 변경</Button>
              </div>
            </CardContent>
          </Card>

          {/* Social Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>소셜 미디어</CardTitle>
              <CardDescription>연결된 계정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {socialAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <div 
                    key={account.platform}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${account.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {account.platform}
                        </p>
                        <p className="text-xs text-gray-500">{account.handle}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {account.followers}
                    </span>
                  </div>
                );
              })}
              <Button variant="outline" className="w-full mt-2">
                계정 연결 추가
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal">개인 정보</TabsTrigger>
              <TabsTrigger value="payment">결제 정보</TabsTrigger>
              <TabsTrigger value="notifications">알림 설정</TabsTrigger>
              <TabsTrigger value="security">보안</TabsTrigger>
            </TabsList>

            {/* Personal Info */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>개인 정보</CardTitle>
                  <CardDescription>기본 프로필 정보를 관리하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">이름</Label>
                      <Input id="firstName" defaultValue="지은" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">성</Label>
                      <Input id="lastName" defaultValue="김" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        id="email" 
                        type="email" 
                        defaultValue="jieun.kim@email.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        id="phone" 
                        type="tel" 
                        defaultValue="010-1234-5678"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">위치</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        id="location" 
                        defaultValue="서울, 대한민국"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">소개</Label>
                    <Textarea 
                      id="bio" 
                      rows={4}
                      defaultValue="뷰티, 라이프스타일, 건강을 주제로 콘텐츠를 만드는 인플루언서입니다. 진정성 있는 브랜드 협업을 지향합니다."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline">취소</Button>
                    <Button>저장</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Info */}
            <TabsContent value="payment">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>은행 계좌 정보</CardTitle>
                    <CardDescription>수익금을 받을 계좌 정보</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">은행명</Label>
                      <Input id="bankName" defaultValue="KB국민은행" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">계좌번호</Label>
                      <Input id="accountNumber" defaultValue="123-456-789012" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountHolder">예금주</Label>
                      <Input id="accountHolder" defaultValue="김지은" />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline">취소</Button>
                      <Button>저장</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>결제 내역</CardTitle>
                    <CardDescription>최근 수익금 지급 내역</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentHistory.map((payment, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                ₩{payment.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {payment.date} • {payment.method}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>알림 설정</CardTitle>
                  <CardDescription>받고 싶은 알림을 선택하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>새 캠페인 제안</Label>
                      <p className="text-sm text-gray-500">브랜드의 새 캠페인 제안 알림</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>성과 리포트</Label>
                      <p className="text-sm text-gray-500">주간/월간 성과 리포트</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>수익금 입금</Label>
                      <p className="text-sm text-gray-500">수익금 지급 알림</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>마케팅 이메일</Label>
                      <p className="text-sm text-gray-500">프로모션 및 업데이트 소식</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>링크 클릭 알림</Label>
                      <p className="text-sm text-gray-500">어필리에이트 링크 클릭 실시간 알림</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>보안 설정</CardTitle>
                  <CardDescription>계정 보안을 강화하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">현재 비밀번호</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">새 비밀번호</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>2단계 인증 (2FA)</Label>
                        <p className="text-sm text-gray-500">추가 보안 레이어 활성화</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline">취소</Button>
                    <Button>비밀번호 변경</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
