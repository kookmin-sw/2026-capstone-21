import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SignupModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onShowLogin: () => void;
}

export function SignupModal({
  onClose,
  onSuccess,
  onShowLogin,
}: SignupModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mallName, setMallName] = useState('');
  const [mallUrl, setMallUrl] = useState('');

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [signupError, setSignupError] = useState('');

  const { signup } = useAuth();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isEmailValid = emailRegex.test(email);
  const showEmailError = emailTouched && !isEmailValid && email.length > 0;

  const hasMinLength = password.length >= 8;
  const hasMaxLength = password.length <= 50;
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isPasswordValid =
    hasMinLength && hasMaxLength && hasLowercase && hasNumber && hasSpecialChar;

  const showPasswordError =
    passwordTouched && !isPasswordValid && password.length > 0;

  const passwordErrors: string[] = [];
  if (showPasswordError) {
    if (!hasMinLength) passwordErrors.push('8자 이상');
    if (!hasMaxLength) passwordErrors.push('50자 이하');
    if (!hasLowercase) passwordErrors.push('영문 소문자 포함');
    if (!hasNumber) passwordErrors.push('숫자 포함');
    if (!hasSpecialChar) passwordErrors.push('특수문자 포함');
  }

  const isFormValid = name.trim().length > 0 && isEmailValid && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!isFormValid) return;

    try {
      await signup(email, password, name, mallName || undefined, mallUrl || undefined);
      onSuccess();
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.message === 'password-invalid') {
        setSignupError('비밀번호는 8~50자, 영문 소문자+숫자+특수문자 조합이 필수입니다.');
      } else if (error.message === 'email-duplicate') {
        setSignupError('이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.');
      } else {
        setSignupError('회원가입에 실패했습니다. 입력 정보를 다시 확인해주세요.');
      }
    }
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
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
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

            <h2 className="text-3xl font-bold">Join Us</h2>
            <p className="text-white/80 mt-2">
              Create your account to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSignupError('');
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSignupError('');
                }}
                onBlur={() => setEmailTouched(true)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  showEmailError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-purple-500 focus:border-transparent'
                }`}
                placeholder="Enter your email"
                required
              />
              {showEmailError && (
                <p className="text-red-500 text-sm mt-1">
                  올바른 이메일 형식으로 입력하세요
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSignupError('');
                }}
                onBlur={() => setPasswordTouched(true)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  showPasswordError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-purple-500 focus:border-transparent'
                }`}
                placeholder="Create a strong password"
                required
              />
              {showPasswordError && (
                <div className="mt-2 space-y-1">
                  <p className="text-red-500 text-sm font-medium">
                    비밀번호 조건: 8~50자, 영문 소문자+숫자+특수문자 조합 필수
                  </p>
                  <ul className="text-xs space-y-0.5 ml-2">
                    <li className={hasMinLength ? 'text-green-600' : 'text-red-500'}>
                      {hasMinLength ? '✓' : '✗'} 8자 이상
                    </li>
                    <li className={hasMaxLength ? 'text-green-600' : 'text-red-500'}>
                      {hasMaxLength ? '✓' : '✗'} 50자 이하
                    </li>
                    <li className={hasLowercase ? 'text-green-600' : 'text-red-500'}>
                      {hasLowercase ? '✓' : '✗'} 영문 소문자 포함
                    </li>
                    <li className={hasNumber ? 'text-green-600' : 'text-red-500'}>
                      {hasNumber ? '✓' : '✗'} 숫자 포함
                    </li>
                    <li className={hasSpecialChar ? 'text-green-600' : 'text-red-500'}>
                      {hasSpecialChar ? '✓' : '✗'} 특수문자 포함
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {signupError && (
              <p className="text-red-500 text-sm text-center">{signupError}</p>
            )}

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500 mb-3">쇼핑몰 정보 (선택)</p>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="mallName"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    쇼핑몰 이름
                  </label>
                  <input
                    type="text"
                    id="mallName"
                    value={mallName}
                    onChange={(e) => setMallName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="예: 마이브랜드"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mallUrl"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    쇼핑몰 URL
                  </label>
                  <input
                    type="url"
                    id="mallUrl"
                    value={mallUrl}
                    onChange={(e) => setMallUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="예: https://mybrand.com"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-3.5 rounded-lg font-semibold transition-all ${
                isFormValid
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              Create Account
            </button>

            <div className="text-center">
              <span className="text-slate-600 text-sm">
                Already have an account?{' '}
              </span>
              <button
                type="button"
                onClick={onShowLogin}
                className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
              >
                Login
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}