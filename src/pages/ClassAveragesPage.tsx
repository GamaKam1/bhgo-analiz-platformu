import { useState, useEffect, useRef, useMemo } from 'react';
import { TransposedExamResultTable } from '@/components/TransposedExamResultTable';
import { ExamResultTable } from '@/components/ExamResultTable';
import { ExamResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { AlertCircle, ChevronDown, Check, X, FileText, Download, Table, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/hooks/useSettings';
import { mapDbResultToExamResult } from '@/lib/dataMapper';
import { cn } from '@/lib/utils';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';
import { BarChartComponent } from '@/components/BarChartComponent';

import { offlineManager } from '@/lib/offlineManager';

export function ClassAveragesPage() {
  const [exams, setExams] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [resultsByClass, setResultsByClass] = useState<Record<string, ExamResult[]>>({});
  const [examComparisonResults, setExamComparisonResults] = useState<ExamResult[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [comparisonViewMode, setComparisonViewMode] = useState<'table' | 'chart'>('table');
  const [classViewModes, setClassViewModes] = useState<Record<string, 'table' | 'chart'>>({});
  const [tableOrientation, setTableOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { settings } = useSettings();

  useEffect(() => {
    fetchFilterOptions();
  }, [settings.tableName]);

  const fetchFilterOptions = async () => {
    setLoadingData(true);
    try {
      const allData = offlineManager.getLocalData();

      if (allData.length === 0) {
        // We don't throw here to allow page load, but options will be empty
        console.warn('No local data for filters');
      }

      const examNameCol = settings.columnMapping.exam_name;
      const classNameCol = settings.columnMapping.student_class;

      const uniqueExams = Array.from(new Set(allData.map((item: any) => item[examNameCol]))).filter(Boolean) as string[];
      const uniqueClasses = Array.from(new Set(allData.map((item: any) => item[classNameCol]))).filter(Boolean) as string[];

      setExams(uniqueExams.sort());
      setClasses(uniqueClasses.sort());

    } catch (err: any) {
      console.error('Error fetching filter options:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleExamSelect = async (examName: string) => {
    setSelectedExam(examName);
    setSelectedClasses([]);
    if (!examName) {
      setExamComparisonResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setExamComparisonResults([]);

    try {
      const allData = offlineManager.getLocalData();
      const examNameCol = settings.columnMapping.exam_name;

      const examData = allData.filter((item: any) => item[examNameCol] === examName);
      const mappedResults = examData.map(item => mapDbResultToExamResult(item, settings.columnMapping));
      const averagedResults = calculateClassAverages(mappedResults);
      setExamComparisonResults(averagedResults);

    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = async (className: string) => {
    let newSelectedClasses: string[];
    if (selectedClasses.includes(className)) {
      newSelectedClasses = selectedClasses.filter(c => c !== className);
    } else {
      newSelectedClasses = [...selectedClasses, className].sort();
    }

    setSelectedClasses(newSelectedClasses);
    setSelectedExam('');

    if (newSelectedClasses.length === 0) {
      setResultsByClass({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allData = offlineManager.getLocalData();
      const classNameCol = settings.columnMapping.student_class;
      const newResultsByClass: Record<string, ExamResult[]> = {};

      newSelectedClasses.forEach(cls => {
        const classData = allData.filter((item: any) => item[classNameCol] === cls);
        const mappedResults = classData.map(item => mapDbResultToExamResult(item, settings.columnMapping));
        // Ortalamaları hesaplayıp PDF/Excel için isim ve sınıf bilgilerini güncelliyoruz
        newResultsByClass[cls] = calculateExamAverages(mappedResults, cls).map(avg => ({
          ...avg,
          student_class: cls, // Sınıf sütununda sınıfın adı gözüksün (önceden "15 Öğrenci" yazıyordu)
          student_name: `${avg.student_class} (Ortalama)` // Öğrenci sayısı + Ortalama bilgisi (Örn: "15 Öğrenci (Ortalama)")
        }));
      });

      setResultsByClass(newResultsByClass);

    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const filteredComparisonResults = useMemo(() => {
    if (gradeFilter === 'all') return examComparisonResults;
    return examComparisonResults.filter(item => {
      const clsName = item.exam_name; // For comparison view, calculateClassAverages uses class name as exam_name
      return clsName && clsName.startsWith(gradeFilter);
    });
  }, [examComparisonResults, gradeFilter]);

  const calculateClassAverages = (items: ExamResult[]): ExamResult[] => {
    const groupedByClass: Record<string, ExamResult[]> = {};

    items.forEach(item => {
      const cls = item.student_class || 'Belirsiz';
      if (!groupedByClass[cls]) {
        groupedByClass[cls] = [];
      }
      groupedByClass[cls].push(item);
    });

    return Object.keys(groupedByClass).map(cls => {
      const classItems = groupedByClass[cls];
      return calculateAverageItem(classItems, cls, cls); // Use class name as exam name for display
    }).sort((a, b) => a.exam_name.localeCompare(b.exam_name, 'tr', { numeric: true }));
  };

  const calculateExamAverages = (items: ExamResult[], className: string): ExamResult[] => {
    const groupedByExam: Record<string, ExamResult[]> = {};

    items.forEach(item => {
      const exam = item.exam_name || 'Belirsiz';
      if (!groupedByExam[exam]) {
        groupedByExam[exam] = [];
      }
      groupedByExam[exam].push(item);
    });

    return Object.keys(groupedByExam).map(exam => {
      const examItems = groupedByExam[exam];
      return calculateAverageItem(examItems, exam, exam);
    }).sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
  };

  const calculateAverageItem = (items: ExamResult[], label: string, displayKey: string): ExamResult => {
    const count = items.length;
    const avg = (key: keyof ExamResult) => {
      const sum = items.reduce((acc, item) => {
        const val = item[key];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);
      return Number((sum / count).toFixed(2));
    };

    return {
      id: `avg-${label}`,
      student_number: '',
      student_name: 'Ortalama',
      student_class: `${count} Öğrenci`,
      exam_name: displayKey,
      exam_date: items[0]?.exam_date || new Date().toISOString(),

      total_score: avg('total_score'),
      percentile: avg('percentile'),

      total_correct: avg('total_correct'),
      total_wrong: avg('total_wrong'),
      total_net: avg('total_net'),

      turkish_correct: avg('turkish_correct'),
      turkish_wrong: avg('turkish_wrong'),
      turkish_net: avg('turkish_net'),

      math_correct: avg('math_correct'),
      math_wrong: avg('math_wrong'),
      math_net: avg('math_net'),

      science_correct: avg('science_correct'),
      science_wrong: avg('science_wrong'),
      science_net: avg('science_net'),

      social_correct: avg('social_correct'),
      social_wrong: avg('social_wrong'),
      social_net: avg('social_net'),

      english_correct: avg('english_correct'),
      english_wrong: avg('english_wrong'),
      english_net: avg('english_net'),

      religion_correct: avg('religion_correct'),
      religion_wrong: avg('religion_wrong'),
      religion_net: avg('religion_net'),
    } as ExamResult;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Sınıf Ortalamaları
          </h2>
          <p className="text-slate-500 mb-8 text-base">
            Sınav veya sınıf bazında ortalama başarı durumlarını karşılaştırın.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <select
                value={selectedExam}
                onChange={(e) => handleExamSelect(e.target.value)}
                disabled={loadingData || loading || selectedClasses.length > 0}
                className={cn(
                  "w-full appearance-none bg-white border-2 text-slate-900 text-lg rounded-2xl py-4 pl-6 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer disabled:opacity-50 disabled:bg-gray-50",
                  selectedClasses.length > 0 ? "border-gray-100 text-gray-400" : "border-gray-200"
                )}
              >
                <option value="">Sınav Seçiniz...</option>
                {exams.map((exam) => (
                  <option key={exam} value={exam}>{exam}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                {loadingData ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => !loading && !selectedExam && setIsClassDropdownOpen(!isClassDropdownOpen)}
                disabled={loadingData || loading || !!selectedExam}
                className={cn(
                  "w-full text-left bg-white border-2 text-slate-900 text-lg rounded-2xl py-4 pl-6 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer disabled:opacity-50 disabled:bg-gray-50 flex items-center justify-between",
                  selectedExam ? "border-gray-100 text-gray-400" : "border-gray-200"
                )}
              >
                <span className="truncate">
                  {selectedClasses.length > 0
                    ? selectedClasses.join(', ')
                    : "Sınıf Seçiniz..."
                  }
                </span>
                <ChevronDown className={cn("w-6 h-6 text-slate-400 transition-transform", isClassDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isClassDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto p-2"
                  >
                    {classes.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => handleClassToggle(cls)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-left",
                          selectedClasses.includes(cls)
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <span>{cls}</span>
                        {selectedClasses.includes(cls) && <Check className="w-5 h-5" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setTableOrientation('horizontal')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  tableOrientation === 'horizontal' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Yatay Tablo
              </button>
              <button
                onClick={() => setTableOrientation('vertical')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  tableOrientation === 'vertical' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Dikey Tablo
              </button>
            </div>
            {(selectedExam || selectedClasses.length > 0) && (
              <button
                onClick={() => { setSelectedExam(''); setSelectedClasses([]); setResultsByClass({}); setExamComparisonResults([]); }}
                className="text-sm text-red-500 hover:text-red-700 underline flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Seçimi Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Hesaplanıyor...</p>
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

        {!loading && selectedExam && examComparisonResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h3 className="text-lg font-semibold text-slate-700">
                <span className="text-slate-900 font-bold">
                  {selectedExam} - Sınıf Karşılaştırması
                </span>
              </h3>

              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                  <button
                    onClick={() => setComparisonViewMode('table')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      comparisonViewMode === 'table' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                    title="Tablo Görünümü"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setComparisonViewMode('chart')}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      comparisonViewMode === 'chart' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                    title="Grafik Görünümü"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => exportToPDF(filteredComparisonResults, `${selectedExam}_Sinif_Karsilastirmasi`, selectedExam, 'Sınıf Ortalamaları Karşılaştırması')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => exportToExcel(filteredComparisonResults, `${selectedExam}_Sinif_Karsilastirmasi`, selectedExam)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                  {filteredComparisonResults.length} Sınıf
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-2 pb-2">
              {[
                { id: 'all', label: 'Tüm Sınıflar' },
                { id: '5', label: '5. Sınıflar' },
                { id: '6', label: '6. Sınıflar' },
                { id: '7', label: '7. Sınıflar' },
                { id: '8', label: '8. Sınıflar' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setGradeFilter(btn.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm border",
                    gradeFilter === btn.id
                      ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/10"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {comparisonViewMode === 'table' ? (
                <motion.div
                  key={`table-${gradeFilter}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {tableOrientation === 'horizontal' ? (
                    <ExamResultTable results={filteredComparisonResults} />
                  ) : (
                    <TransposedExamResultTable results={filteredComparisonResults} />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`chart-${gradeFilter}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <BarChartComponent
                    results={filteredComparisonResults}
                    title={`${selectedExam} - Sınıf Karşılaştırması`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!loading && selectedClasses.length > 0 && (
          <div className="space-y-12">
            {selectedClasses.length > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                <div className="mb-3 sm:mb-0">
                  <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Table className="w-5 h-5 text-indigo-600" />
                    Toplu İndirme Seçenekleri
                  </h3>
                  <p className="text-xs text-indigo-600/70 mt-1">Seçilen tüm sınıfların ortalamalarını tek bir belgede listeleyin.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const allResults = selectedClasses.flatMap(cls => resultsByClass[cls] || []);
                      exportToPDF(allResults, `Secili_Siniflar_Ortalamalari`, 'Seçili Sınıf Ortalamaları', `${selectedClasses.length} Sınıfın Sınav Performansları`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Toplu PDF
                  </button>
                  <button
                    onClick={() => {
                      const allResults = selectedClasses.flatMap(cls => resultsByClass[cls] || []);
                      exportToExcel(allResults, `Secili_Siniflar_Ortalamalari`, 'Seçili Sınıf Ortalamaları');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Toplu Excel
                  </button>
                </div>
              </div>
            )}

            {selectedClasses.map((cls) => (
              resultsByClass[cls] && resultsByClass[cls].length > 0 && (
                <div key={cls} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                    <h3 className="text-lg font-semibold text-slate-700">
                      <span className="text-slate-900 font-bold">
                        {cls} - Sınav Performansı
                      </span>
                    </h3>

                    <div className="flex items-center gap-3">
                      <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                        <button
                          onClick={() => setClassViewModes(prev => ({ ...prev, [cls]: 'table' }))}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            (classViewModes[cls] || 'table') === 'table' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                          title="Tablo Görünümü"
                        >
                          <Table className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setClassViewModes(prev => ({ ...prev, [cls]: 'chart' }))}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            classViewModes[cls] === 'chart' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                          title="Grafik Görünümü"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => exportToPDF(resultsByClass[cls], `${cls}_Sinav_Performansi`, cls, 'Sınıf Bazlı Sınav Ortalamaları')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => exportToExcel(resultsByClass[cls], `${cls}_Sinav_Performansi`, cls)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100"
                      >
                        <Download className="w-4 h-4" />
                        Excel
                      </button>
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                        {resultsByClass[cls].length} Sınav
                      </span>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {(classViewModes[cls] || 'table') === 'table' ? (
                      <motion.div
                        key={`${cls}-table`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {tableOrientation === 'horizontal' ? (
                          <ExamResultTable results={resultsByClass[cls]} />
                        ) : (
                          <TransposedExamResultTable results={resultsByClass[cls]} />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`${cls}-chart`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <BarChartComponent
                          results={[...resultsByClass[cls]].reverse()}
                          title={`${cls} - Sınav Performans Grafiği`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
