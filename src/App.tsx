/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GraduationCap, Database, Search, BarChart3, ArrowRight, FileText, RefreshCw, CloudOff, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentSearchPage } from './pages/StudentSearchPage';
import { ClassAveragesPage } from './pages/ClassAveragesPage';
import { ExamResultsPage } from './pages/ExamResultsPage';
import { LoginPage } from './pages/LoginPage';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { offlineManager } from './lib/offlineManager';
import { useSettings } from './hooks/useSettings';
import logo from './assets/logo.png';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from './lib/utils';

type View = 'home' | 'student-search' | 'class-averages' | 'exam-results';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const { settings } = useSettings();
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(offlineManager.getLastSync());
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInStudentDetail, setIsInStudentDetail] = useState(false);
  const examResultsBackRef = useRef<(() => void) | null>(null);

  // Auth State
  const isNative = Capacitor.isNativePlatform();
  const [isAuthenticated, setIsAuthenticated] = useState(isNative || !!localStorage.getItem('bhgo_authenticated'));

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('bhgo_authenticated', 'true');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  useEffect(() => {
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // If in student detail view within exam-results, go back to exam list first
      if (currentView === 'exam-results' && isInStudentDetail) {
        // Trigger back from student detail
        const handleBack = (ExamResultsPage as any)._handleBack;
        if (handleBack) {
          handleBack();
        }
      } else if (currentView !== 'home') {
        setCurrentView('home');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [currentView, isInStudentDetail]);

  const handleStudentDetailChange = useCallback((inDetail: boolean) => {
    setIsInStudentDetail(inDetail);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncProgress(0);
    try {
      await offlineManager.syncAllData(settings, (progress) => {
        setSyncProgress(progress);
      });
      setLastSync(new Date().toISOString());
    } catch (err: any) {
      setSyncError(err.message || 'Senkronizasyon başarısız oldu.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            <div className="bg-indigo-600 p-0.5 rounded-lg overflow-hidden flex items-center justify-center w-10 h-10">
              <img src={logo} alt="BHGO Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">BHGO Sınav Analiz Platformu</h1>
              <p className="text-xs text-slate-500 font-medium">Made by Salih OSOYDAN</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <Database className="w-3 h-3" />
              <span>Supabase Bağlantısı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full py-8 md:py-12"
            >
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                  Bolvadin Hasan Gemici Ortaokulu
                </h2>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                  Sınav analiz platformuna hoş geldiniz. Aşağıdaki menülerden istediğiniz işlemi seçebilirsiniz.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-3xl mb-8">
                <MenuCard
                  title="Öğrenci Sorgula"
                  description="Öğrenci numarası ile bireysel sınav sonuçlarını ve gelişim raporlarını görüntüleyin."
                  icon={<Search className="w-6 h-6 text-white" />}
                  color="bg-indigo-600"
                  onClick={() => setCurrentView('student-search')}
                />
                <MenuCard
                  title="Sınav Sonuçları"
                  description="Tüm sınav sonuçlarını listeleyin, sınıf bazlı filtreleme ve detaylı sıralama yapın."
                  icon={<FileText className="w-6 h-6 text-white" />}
                  color="bg-violet-600"
                  onClick={() => setCurrentView('exam-results')}
                />
                <MenuCard
                  title="Sınıf Ortalamaları"
                  description="Sınav bazında sınıfların ortalama net ve puanlarını karşılaştırmalı olarak inceleyin."
                  icon={<BarChart3 className="w-6 h-6 text-white" />}
                  color="bg-emerald-600"
                  onClick={() => setCurrentView('class-averages')}
                />
              </div>

              {/* Compact Offline Sync Card */}
              <div className="w-full max-w-3xl">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm overflow-hidden relative">
                  {syncing && (
                    <div className="absolute top-0 left-0 h-1 bg-indigo-600 transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                  )}

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        lastSync ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {lastSync ? <CheckCircle2 className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Cihaz Verileri</h3>
                        <p className="text-xs text-slate-500">
                          {lastSync
                            ? `Son güncelleme: ${format(new Date(lastSync), 'd MMM HH:mm', { locale: tr })}`
                            : 'Veriler henüz cihaza indirilmedi.'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                        syncing
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      )}
                    >
                      <RefreshCw className={cn("w-4 h-4", syncing ? "animate-spin" : "")} />
                      {syncing ? `%${syncProgress}` : 'Güncelle'}
                    </button>
                  </div>

                  {syncError && (
                    <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {syncError}
                    </div>
                  )}

                  {!lastSync && !syncing && (
                    <div className="mt-3 p-2 bg-amber-50 text-amber-700 text-xs rounded-lg flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Çevrimdışı kullanım için önce verileri güncellemelisiniz.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'student-search' && (
            <motion.div
              key="student-search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <button
                  onClick={() => setCurrentView('home')}
                  className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4"
                >
                  ← Ana Menüye Dön
                </button>
              </div>
              <StudentSearchPage />
            </motion.div>
          )}

          {currentView === 'exam-results' && (
            <motion.div
              key="exam-results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <button
                  onClick={() => setCurrentView('home')}
                  className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4"
                >
                  ← Ana Menüye Dön
                </button>
              </div>
              <ExamResultsPage onStudentDetailChange={handleStudentDetailChange} />
            </motion.div>
          )}

          {currentView === 'class-averages' && (
            <motion.div
              key="class-averages"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <button
                  onClick={() => setCurrentView('home')}
                  className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-4"
                >
                  ← Ana Menüye Dön
                </button>
              </div>
              <ClassAveragesPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function MenuCard({ title, description, icon, color, onClick }: {
  title: string,
  description: string,
  icon: React.ReactNode,
  color: string,
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-100 transition-all duration-300 text-left flex flex-row items-center gap-4 w-full"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 line-clamp-2 md:line-clamp-none">
          {description}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0">
        İncele <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

export default App;


