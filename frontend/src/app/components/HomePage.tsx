import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Users, TrendingUp, Sparkles, LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isAdmin = localStorage.getItem("role") === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/home')} className="flex items-center gap-2 cursor-pointer">
            <img src="/logo_black.png" alt="LinkD-Match" className="h-10" />
            <span className="text-2xl font-bold text-white">LinkD-Match</span>
          </button>
          <div className="flex items-center gap-4">
            {isAdmin && <button onClick={() => navigate('/system-console')} className="text-white/80 hover:text-white transition-colors px-4 py-2">System Console</button>}
            <button onClick={() => navigate('/recommend')} className="text-white/80 hover:text-white transition-colors px-4 py-2">Recommendation</button>
            <button onClick={() => navigate('/interest')} className="text-white/80 hover:text-white transition-colors px-4 py-2">My Picks</button>
            <button onClick={() => navigate('/Insights')} className="text-white/80 hover:text-white transition-colors px-4 py-2">Data Insights</button>
            <button onClick={() => navigate('/my')} className="flex items-center gap-2 px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors"><UserCircle className="w-5 h-5" />My</button>
            <div className="w-px h-8 bg-white/20 mx-2" />
            <button onClick={logout} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition"><LogOut className="w-4 h-4 text-white" /></button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-sm text-white/90">Influencer Marketing Platform</span>
            </div>
            <h1 className="font-bold text-white leading-tight" style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}>
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">브랜드에 맞는 완벽한<br />인플루언서를 만나보세요.</span>
            </h1>
            <p className="text-xl text-white/70 leading-relaxed max-w-xl">브랜드 가치에 공감하는 인플루언서를 탐색하세요. 데이터 기반 분석부터 맞춤형 검색까지 해결할 수 있습니다.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/recommend')} className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2">
                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=1000&fit=crop" alt="Influencer collaboration" className="w-full h-[600px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-32 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">Why LinkD Match?</h2>
            <p className="text-xl text-white/60">Everything you need for successful influencer partnerships</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: '편리한 탐색', description: '원하는 인플루언서를 찾아보세요. 원하는 필터를 적용하여 자유롭게 검색할 수 있습니다.' },
              { icon: BarChart3, title: '자유로운 커스터마이징', description: '원하는 인플루언서를 기록하세요. 관심 목록에 저장하고 메모할 수 있습니다.' },
              { icon: TrendingUp, title: '자세한 분석', description: '원하는 인플루언서를 분석하세요. 인기 있는 인플루언서 순위를 확인하고 비교할 수 있습니다.' },
            ].map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.1 }} className="group p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-8">
            <h2 className="text-5xl font-bold text-white">Ready to grow your brand?</h2>
            <p className="text-xl text-white/70">Join hundreds of brands already achieving remarkable results</p>
            <button onClick={() => navigate('/recommend')} className="px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all inline-flex items-center gap-3">
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
