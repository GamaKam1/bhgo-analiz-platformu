import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ExamResultTable } from '@/components/ExamResultTable';
import { ExamResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { AlertCircle, ChevronDown, Filter, ArrowUpDown, Check, X, FileText, Download, ArrowLeft, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '@/hooks/useSettings';
import { mapDbResultToExamResult } from '@/lib/dataMapper';
import { cn } from '@/lib/utils';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';

type SortOption = 'total_score' | 'total_net' | 'turkish_net' | 'math_net' | 'science_net' | 'social_net' | 'english_net' | 'religion_net';

const SORT_LABELS: Record<SortOption, string> = {
  total_score: 'Toplam Puan',
  total_net: 'Toplam Net',
  turkish_net: 'Türkçe Net',
  math_net: 'Matematik Net',
  science_net: 'Fen Bilimleri Net',
  social_net: 'İnkılap Net',
  english_net: 'İngilizce Net',
  religion_net: 'Din Kültürü Net',
};

import { offlineManager } from '@/lib/offlineManager';

interface SelectedStudent {
  studentNumber: string;
  studentName: string;
  studentClass?: string;
}

interface ExamResultsPageProps {
  onStudentDetailChange?: (isInDetail: boolean) => void;
}

export function ExamResultsPage({ onStudentDetailChange }: ExamResultsPageProps = {}) {
  const [exams, setExams] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student detail sub-view
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null);
  const [studentResults, setStudentResults] = useState<ExamResult[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Filters & Sorting
  const [classFilter, setClassFilter] = useState<string[]>([]); // Empty array means "All"
  const [isClassFilterOpen, setIsClassFilterOpen] = useState(false);
  const classFilterRef = useRef<HTMLDivElement>(null);

  const [sortOption, setSortOption] = useState<SortOption>('total_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { settings } = useSettings();

  useEffect(() => {
    fetchExams();
  }, [settings.tableName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (classFilterRef.current && !classFilterRef.current.contains(event.target as Node)) {
        setIsClassFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const allData = offlineManager.getLocalData();
      const examNameCol = settings.columnMapping.exam_name;

      const uniqueExams = Array.from(new Set(allData.map((item: any) => item[examNameCol]))).filter(Boolean) as string[];
      setExams(uniqueExams.sort());

    } catch (err: any) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleExamSelect = async (examName: string) => {
    setSelectedExam(examName);
    if (!examName) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setClassFilter([]); // Reset filter on new exam

    try {
      const allData = offlineManager.getLocalData();
      const examNameCol = settings.columnMapping.exam_name;

      const examData = allData.filter((item: any) => item[examNameCol] === examName);
      const mappedResults = examData.map(item => mapDbResultToExamResult(item, settings.columnMapping));
      setResults(mappedResults);

    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleClassFilter = (cls: string) => {
    setClassFilter(prev => {
      if (prev.includes(cls)) {
        return prev.filter(c => c !== cls);
      } else {
        return [...prev, cls];
      }
    });
  };

  // Handle student click - fetch all exams for that student
  const handleStudentClick = useCallback((studentNumber: string) => {
    setLoadingStudent(true);
    try {
      const allData = offlineManager.getLocalData();
      const studentNumCol = settings.columnMapping.student_number;
      const examDateCol = settings.columnMapping.exam_date;

      const studentData = allData.filter((item: any) =>
        String(item[studentNumCol]) === String(studentNumber)
      );

      // Sort by exam date descending
      studentData.sort((a: any, b: any) => {
        const dateA = new Date(a[examDateCol] || 0).getTime();
        const dateB = new Date(b[examDateCol] || 0).getTime();
        return dateB - dateA;
      });

      const mappedResults = studentData.map((item: any) => mapDbResultToExamResult(item, settings.columnMapping));
      setStudentResults(mappedResults);

      if (mappedResults.length > 0) {
        setSelectedStudent({
          studentNumber: mappedResults[0].student_number,
          studentName: mappedResults[0].student_name,
          studentClass: mappedResults[0].student_class,
        });
        onStudentDetailChange?.(true);
      }
    } catch (err: any) {
      console.error('Error fetching student results:', err);
    } finally {
      setLoadingStudent(false);
    }
  }, [settings.columnMapping, onStudentDetailChange]);

  // Go back from student detail to exam results
  const handleBackFromStudent = useCallback(() => {
    setSelectedStudent(null);
    setStudentResults([]);
    onStudentDetailChange?.(false);
  }, [onStudentDetailChange]);

  // Expose a way for parent to trigger back navigation
  // This is used by the Android back button handler
  (ExamResultsPage as any)._handleBack = selectedStudent ? handleBackFromStudent : null;

  // Derived state for classes based on current results
  const availableClasses = useMemo(() => {
    const classes = new Set(results.map(r => r.student_class).filter(Boolean) as string[]);
    return Array.from(classes).sort();
  }, [results]);

  // Filter and Sort Logic
  const processedResults = useMemo(() => {
    let filtered = [...results];

    // Filter by class (Multiple)
    if (classFilter.length > 0) {
      filtered = filtered.filter(r => r.student_class && classFilter.includes(r.student_class));
    }

    // Sort
    filtered.sort((a, b) => {
      const valA = a[sortOption] || 0;
      const valB = b[sortOption] || 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'desc' ? valB - valA : valA - valB;
      }
      return 0;
    });

    return filtered;
  }, [results, classFilter, sortOption, sortDirection]);

  // If a student is selected, show their detail view
  if (selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Back Button */}
          <button
            onClick={handleBackFromStudent}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            ← Sınav Sonuçlarına Dön
          </button>

          {/* Student Info Header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedStudent.studentName}</h2>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>No: <span className="font-mono font-bold text-slate-700">{selectedStudent.studentNumber}</span></span>
                  {selectedStudent.studentClass && (
                    <span>Sınıf: <span className="font-bold text-slate-700">{selectedStudent.studentClass}</span></span>
                  )}
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs font-bold">
                    {studentResults.length} Sınav
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Student's All Exam Results */}
          {loadingStudent ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Öğrenci sonuçları getiriliyor...</p>
            </div>
          ) : studentResults.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ExamResultTable results={studentResults} showStudentInfo={false} />
            </motion.div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Bu öğrenciye ait sınav sonucu bulunamadı.
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Sınav Sonuçları
          </h2>
          <p className="text-slate-500 mb-8 text-base">
            Seçilen sınavın tüm öğrenci sonuçlarını listeleyin, filtreleyin ve sıralayın.
          </p>

          <div className="relative mb-8">
            <select
              value={selectedExam}
              onChange={(e) => handleExamSelect(e.target.value)}
              disabled={loadingExams || loading}
              className="w-full appearance-none bg-white border-2 border-gray-200 text-slate-900 text-lg rounded-2xl py-4 pl-6 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">Sınav Seçiniz...</option>
              {exams.map((exam) => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {loadingExams ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              ) : (
                <ChevronDown className="w-6 h-6" />
              )}
            </div>
          </div>

          {/* Filters Bar */}
          {selectedExam && !loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between z-40 relative"
            >
              <div className="flex items-center gap-4 w-full md:w-auto relative" ref={classFilterRef}>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium whitespace-nowrap">
                  <Filter className="w-4 h-4" />
                  Sınıf:
                </div>

                <div className="relative w-full md:w-64">
                  <button
                    onClick={() => setIsClassFilterOpen(!isClassFilterOpen)}
                    className="w-full bg-slate-50 border border-gray-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 outline-none flex items-center justify-between"
                  >
                    <span className="truncate">
                      {classFilter.length === 0
                        ? 'Tüm Sınıflar'
                        : classFilter.length === availableClasses.length
                          ? 'Tüm Sınıflar'
                          : `${classFilter.length} Sınıf Seçildi`
                      }
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isClassFilterOpen ? "rotate-180" : "")} />
                  </button>

                  <AnimatePresence>
                    {isClassFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[100] max-h-60 overflow-y-auto p-2"
                      >
                        <div
                          className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer mb-1"
                          onClick={() => setClassFilter([])}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            classFilter.length === 0 ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                          )}>
                            {classFilter.length === 0 && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm font-medium text-slate-700">Tüm Sınıflar</span>
                        </div>

                        <div className="h-px bg-gray-100 my-1" />

                        {availableClasses.map(cls => (
                          <div
                            key={cls}
                            className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                            onClick={() => toggleClassFilter(cls)}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                              classFilter.includes(cls) ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                            )}>
                              {classFilter.includes(cls) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-slate-700">{cls}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium whitespace-nowrap">
                  <ArrowUpDown className="w-4 h-4" />
                  Sıralama:
                </div>
                <div className="flex gap-2 w-full">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-slate-50 border border-gray-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                  >
                    {Object.entries(SORT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2.5 bg-slate-50 border border-gray-200 rounded-lg hover:bg-slate-100 text-slate-600"
                    title={sortDirection === 'asc' ? 'Artan' : 'Azalan'}
                  >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
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

        {!loading && selectedExam && processedResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h3 className="text-lg font-semibold text-slate-700">
                <span className="text-slate-900 font-bold">{selectedExam}</span>
                {classFilter.length > 0 && <span className="text-slate-500 font-normal"> • {classFilter.join(', ')}</span>}
              </h3>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => exportToPDF(processedResults, `${selectedExam}_Sonuclari`, selectedExam, classFilter.length > 0 ? `Sınıflar: ${classFilter.join(', ')}` : 'Tüm Sınıflar')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => exportToExcel(processedResults, `${selectedExam}_Sonuclari`, selectedExam)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                  {processedResults.length} Öğrenci
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ExamResultTable results={processedResults} showStudentInfo={true} onStudentClick={handleStudentClick} />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
