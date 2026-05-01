import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInfluencers } from '../context/InfluencerContext';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onShowSignup: () => void;
}

export function LoginModal({
  onClose,
  onSuccess,
  onShowSignup,
}: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loginError, setLoginError] = useState(false);

  const { login } = useAuth();
  const { refreshFavorites } = useInfluencers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoginError(false);

    const result = await login(email, password);

    if (result === 'success') {
      await refreshFavorites();
      onSuccess();
    } else {
      setLoginError(true);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setLoginError(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setLoginError(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 px-8 py-12 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl">
                D
              </div>
              <span className="text-2xl font-bold">링크디매치</span>
            </div>

            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="text-white/80 mt-2">Login to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  loginError ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-3 border rounded-lg ${
                  loginError ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter your password"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-sm text-center">
                이메일 또는 비밀번호가 올바르지 않습니다.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg"
            >
              Login
            </button>

            <div className="text-center">
              <span className="text-sm text-slate-600">
                Don&apos;t have an account?
              </span>{' '}
              <button
                type="button"
                onClick={onShowSignup}
                className="text-purple-600 font-semibold"
              >
                Sign up
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}