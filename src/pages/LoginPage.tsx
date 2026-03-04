import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
    onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const CORRECT_PASSWORD = 'bhgo700758';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Minimal delay for better UX feel
        setTimeout(() => {
            if (password === CORRECT_PASSWORD) {
                onLogin();
            } else {
                setError(true);
                setIsLoading(false);
                // Reset error after animation
                setTimeout(() => setError(false), 3000);
            }
        }, 400);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 pt-[env(safe-area-inset-top)]">
            <div className="max-w-md w-full">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-xl shadow-indigo-100 mb-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10" />
                        <Lock className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        BHGO Analiz
                    </h1>
                    <p className="text-slate-500 font-medium">Lütfen devam etmek için şifrenizi girin</p>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 p-8 border border-white relative overflow-hidden"
                >
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-50 rounded-full blur-3xl opacity-60" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                                Giriş Şifresi
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoFocus
                                    className={`w-full h-14 pl-12 pr-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all duration-300 font-medium tracking-widest
                    ${error
                                            ? 'border-red-100 ring-4 ring-red-50/50 bg-red-50/10'
                                            : 'border-transparent group-focus-within:border-indigo-100 group-focus-within:bg-white group-focus-within:ring-4 group-focus-within:ring-indigo-50/30'
                                        }`}
                                />
                                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300
                  ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 text-red-500 text-sm font-semibold px-1"
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    Hatalı şifre girdiniz. Lütfen tekrar deneyin.
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-3 border-emerald-500 border-t-emerald-600 rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Giriş Yap</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Footer info */}
                <p className="text-center mt-8 text-slate-400 text-sm font-medium">
                    Mobil uygulama üzerinden doğrudan giriş yapabilirsiniz.
                </p>
            </div>
        </div>
    );
}
