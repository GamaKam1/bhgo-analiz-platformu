import React from 'react';
import { ExamResult } from '@/types';
import { Calendar, Trophy, Medal, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExamResultCardProps {
  result: ExamResult;
}

export function ExamResultCard({ result }: ExamResultCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="bg-slate-50 p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold text-slate-900">{result.exam_name}</h3>
            {result.student_class && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded">
                {result.student_class}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{result.exam_date ? format(new Date(result.exam_date), 'd MMMM yyyy', { locale: tr }) : 'Tarih Belirtilmemiş'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-lg border border-indigo-100">
            {result.total_score.toFixed(2)} Puan
          </div>
          {result.percentile !== undefined && (
            <div className="text-xs font-medium text-slate-500">
              Yüzdelik: <span className="text-indigo-600 font-bold">%{result.percentile}</span>
            </div>
          )}
        </div>
      </div>

      {/* Totals Summary (New Section) */}
      {(result.total_correct !== undefined || result.total_wrong !== undefined || result.total_net !== undefined) && (
        <div className="px-6 py-3 bg-indigo-50/30 border-b border-gray-100 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Genel Toplam:</span>
          <div className="flex gap-4">
            {result.total_correct !== undefined && <span className="text-green-700 font-medium">{result.total_correct} Doğru</span>}
            {result.total_wrong !== undefined && <span className="text-red-700 font-medium">{result.total_wrong} Yanlış</span>}
            {result.total_net !== undefined && <span className="text-indigo-700 font-bold">{result.total_net} Net</span>}
          </div>
        </div>
      )}

      {/* Rankings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-100 bg-white">
        <RankItem label="Sınıf" value={result.rank_class} icon={<Medal className="w-4 h-4" />} />
        <RankItem label="Okul" value={result.rank_school} icon={<Trophy className="w-4 h-4" />} />
        <RankItem label="İlçe" value={result.rank_district} icon={<BarChart3 className="w-4 h-4" />} />
        <RankItem label="Genel" value={result.rank_general} icon={<Trophy className="w-4 h-4 text-amber-500" />} highlight />
      </div>

      {/* Subject Breakdown */}
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ders Bazlı Sonuçlar</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SubjectRow title="Türkçe" correct={result.turkish_correct} wrong={result.turkish_wrong} net={result.turkish_net} color="bg-red-50 text-red-700 border-red-100" />
          <SubjectRow title="Matematik" correct={result.math_correct} wrong={result.math_wrong} net={result.math_net} color="bg-blue-50 text-blue-700 border-blue-100" />
          <SubjectRow title="Fen Bilimleri" correct={result.science_correct} wrong={result.science_wrong} net={result.science_net} color="bg-green-50 text-green-700 border-green-100" />
          <SubjectRow title="T.C. İnkılap" correct={result.social_correct} wrong={result.social_wrong} net={result.social_net} color="bg-orange-50 text-orange-700 border-orange-100" />
          <SubjectRow title="İngilizce" correct={result.english_correct} wrong={result.english_wrong} net={result.english_net} color="bg-purple-50 text-purple-700 border-purple-100" />
          <SubjectRow title="Din Kültürü" correct={result.religion_correct} wrong={result.religion_wrong} net={result.religion_net} color="bg-teal-50 text-teal-700 border-teal-100" />
        </div>
      </div>
    </div>
  );
}

function RankItem({ label, value, icon, highlight }: { label: string, value?: number, icon: React.ReactNode, highlight?: boolean }) {
  if (value === undefined || value === null) return null;
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 rounded-xl border",
      highlight ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"
    )}>
      <span className={cn("text-xs font-medium uppercase tracking-wide mb-1 flex items-center gap-1", highlight ? "text-amber-700" : "text-gray-500")}>
        {icon} {label}
      </span>
      <span className={cn("text-xl font-bold", highlight ? "text-amber-900" : "text-gray-900")}>
        {value}.
      </span>
    </div>
  );
}

function SubjectRow({ title, correct, wrong, net, color }: { title: string, correct: number, wrong: number, net: number, color: string }) {
  return (
    <div className={cn("flex items-center justify-between p-3 rounded-xl border", color)}>
      <span className="font-semibold">{title}</span>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex flex-col items-end">
          <span className="font-bold text-lg">{net}</span>
          <span className="text-[10px] opacity-70 uppercase">Net</span>
        </div>
        <div className="h-8 w-px bg-current opacity-20"></div>
        <div className="flex flex-col text-xs opacity-80">
          <span>{correct} D</span>
          <span>{wrong} Y</span>
        </div>
      </div>
    </div>
  );
}
