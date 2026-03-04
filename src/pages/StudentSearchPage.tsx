import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { ExamResultTable } from '@/components/ExamResultTable';
import { ExamResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Search, Table, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/hooks/useSettings';
import { SettingsModal } from '@/components/SettingsModal';
import { mapDbResultToExamResult } from '@/lib/dataMapper';
import { BarChartComponent } from '@/components/BarChartComponent';
import { cn } from '@/lib/utils';

import { offlineManager } from '@/lib/offlineManager';

export function StudentSearchPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedNumber, setSearchedNumber] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const { settings, updateSettings, resetSettings, isOpen, setIsOpen } = useSettings();

  const handleSearch = async (studentNumber: string) => {
    setLoading(true);
    setError(null);
    setSearchedNumber(studentNumber);
    setHasSearched(true);
    setResults([]);

    try {
      const allData = offlineManager.getLocalData();

      if (allData.length === 0) {
        throw new Error('Cihazda kayıtlı veri bulunamadı. Lütfen ana ekrandan verileri güncelleyin.');
      }

      const studentNumCol = settings.columnMapping.student_number;

      // Filter local data
      const studentResults = allData.filter((item: any) =>
        String(item[studentNumCol]) === String(studentNumber)
      );

      // Sort by date (local)
      const examDateCol = settings.columnMapping.exam_date;
      studentResults.sort((a, b) => {
        const dateA = new Date(a[examDateCol] || 0).getTime();
        const dateB = new Date(b[examDateCol] || 0).getTime();
        return dateB - dateA;
      });

      const mappedResults = studentResults.map(item => mapDbResultToExamResult(item, settings.columnMapping));
      setResults(mappedResults);

    } catch (err: any) {
      setError(err.message || 'Sorgulama sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SettingsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
      />

      {/* Settings Button (Hidden here, controlled by parent or duplicated? 
          Actually, the original App.tsx had it in the header. 
          I'll keep the modal here but the button might need to be passed down or re-added locally if I want it on this page specific) 
          For now, I'll add a local settings button or assume the header in App.tsx handles it.
          Wait, the header is in App.tsx. I should probably move the header to App.tsx and keep the page content here.
      */}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-slate-500 hover:text-indigo-600 underline"
        >
          Veritabanı Ayarları
        </button>
      </div>

      <div className="mb-8 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Sınav Sonuçlarını Sorgula
          </h2>
          <p className="text-slate-500 mb-6 text-base">
            Öğrenci numaranızı girerek katıldığınız tüm LGS deneme sınavlarının detaylı sonuçlarına ulaşabilirsiniz.
          </p>
          <SearchForm onSearch={handleSearch} isLoading={loading} />

          <div className="mt-3 text-xs text-slate-400">
            Tablo: <span className="font-mono text-slate-600">{settings.tableName}</span> •
            Sütun: <span className="font-mono text-slate-600">{settings.columnMapping.student_number}</span>
          </div>


        </div>
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Sonuçlar getiriliyor...</p>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 text-red-800 max-w-3xl mx-auto"
          >
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg mb-1">Hata Oluştu</h3>
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {!loading && hasSearched && results.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 max-w-3xl mx-auto"
          >
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sonuç Bulunamadı</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              <span className="font-mono font-bold text-slate-700">{searchedNumber}</span> numaralı öğrenci için kayıtlı sınav sonucu bulunmamaktadır.
            </p>
          </motion.div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h3 className="text-lg font-semibold text-slate-700">
                <span className="text-slate-900 font-bold">{results[0].student_name}</span> için Sonuçlar
              </h3>

              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    viewMode === 'table'
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Table className="w-4 h-4" />
                  Tablo
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    viewMode === 'chart'
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <BarChart2 className="w-4 h-4" />
                  Grafik
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === 'table' ? (
                <motion.div
                  key="table-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExamResultTable results={results} />
                </motion.div>
              ) : (
                <motion.div
                  key="chart-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <BarChartComponent
                    results={[...results].reverse()}
                    title="Ders Bazlı Net Karşılaştırması"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
