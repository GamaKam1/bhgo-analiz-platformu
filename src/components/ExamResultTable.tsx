import React, { Fragment } from 'react';
import { ExamResult } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExamResultTableProps {
  results: ExamResult[];
  showStudentInfo?: boolean;
  onStudentClick?: (studentNumber: string) => void;
}

export function ExamResultTable({ results, showStudentInfo = false, onStudentClick }: ExamResultTableProps) {
  if (results.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="overflow-auto pb-2 custom-scrollbar max-h-[70vh]">
        <table className="w-full border-collapse text-sm text-left relative">
          <thead>
            {/* Group Headers */}
            <tr className="sticky top-0 z-30 bg-slate-50 border-b border-gray-200">
              <th className="p-3 border-r border-gray-200 min-w-[200px] sticky left-0 top-0 bg-slate-50 z-40 font-bold text-slate-700">
                {showStudentInfo ? 'Öğrenci Bilgisi' : 'Sınav Bilgisi'}
              </th>
              <th colSpan={3} className="p-2 border-r border-gray-200 text-center font-semibold text-slate-600 bg-slate-50">Genel</th>
              <th colSpan={5} className="p-2 border-r border-gray-200 text-center font-semibold text-slate-600 bg-slate-50">Sıralamalar</th>
              <th colSpan={3} className="p-2 border-r border-gray-200 text-center font-semibold text-indigo-700 bg-indigo-50/50">Toplam</th>

              <SubjectHeader title="Türkçe" color="text-red-700 bg-red-50/50" />
              <SubjectHeader title="Matematik" color="text-blue-700 bg-blue-50/50" />
              <SubjectHeader title="Fen Bilimleri" color="text-green-700 bg-green-50/50" />
              <SubjectHeader title="T.C. İnkılap" color="text-orange-700 bg-orange-50/50" />
              <SubjectHeader title="İngilizce" color="text-purple-700 bg-purple-50/50" />
              <SubjectHeader title="Din Kültürü" color="text-teal-700 bg-teal-50/50" />
            </tr>

            {/* Column Headers */}
            <tr className="sticky top-[41px] z-30 bg-white border-b border-gray-200 text-xs text-slate-500">
              <th className="p-3 border-r border-gray-200 sticky left-0 top-[41px] bg-white z-40 font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                {showStudentInfo ? 'Öğrenci Adı / No' : 'Sınav Adı'}
              </th>

              {/* Genel */}
              <th className="p-2 min-w-[100px] border-r border-gray-100 font-medium">Tarih</th>
              <th className="p-2 min-w-[80px] border-r border-gray-100 font-medium text-center">Puan</th>
              <th className="p-2 min-w-[80px] border-r border-gray-100 font-medium text-center">Yüzdelik</th>

              {/* Sıralamalar */}
              <th className="p-2 min-w-[60px] border-r border-gray-100 font-medium text-center">Sınıf</th>
              <th className="p-2 min-w-[60px] border-r border-gray-100 font-medium text-center">Okul</th>
              <th className="p-2 min-w-[60px] border-r border-gray-100 font-medium text-center">İlçe</th>
              <th className="p-2 min-w-[60px] border-r border-gray-100 font-medium text-center">İl</th>
              <th className="p-2 min-w-[60px] border-r border-gray-100 font-medium text-center">Genel</th>

              {/* Toplam */}
              <SubHeader label="D" bgColor="bg-indigo-50/30" />
              <SubHeader label="Y" bgColor="bg-indigo-50/30" />
              <SubHeader label="N" highlight bgColor="bg-indigo-50/60" />

              {/* Türkçe */}
              <SubHeader label="D" bgColor="bg-red-50/30" />
              <SubHeader label="Y" bgColor="bg-red-50/30" />
              <SubHeader label="N" highlight bgColor="bg-red-100/50" />

              {/* Matematik */}
              <SubHeader label="D" bgColor="bg-blue-50/30" />
              <SubHeader label="Y" bgColor="bg-blue-50/30" />
              <SubHeader label="N" highlight bgColor="bg-blue-100/50" />

              {/* Fen Bilimleri */}
              <SubHeader label="D" bgColor="bg-green-50/30" />
              <SubHeader label="Y" bgColor="bg-green-50/30" />
              <SubHeader label="N" highlight bgColor="bg-green-100/50" />

              {/* İnkılap */}
              <SubHeader label="D" bgColor="bg-orange-50/30" />
              <SubHeader label="Y" bgColor="bg-orange-50/30" />
              <SubHeader label="N" highlight bgColor="bg-orange-100/50" />

              {/* İngilizce */}
              <SubHeader label="D" bgColor="bg-purple-50/30" />
              <SubHeader label="Y" bgColor="bg-purple-50/30" />
              <SubHeader label="N" highlight bgColor="bg-purple-100/50" />

              {/* Din Kültürü */}
              <SubHeader label="D" bgColor="bg-teal-50/30" />
              <SubHeader label="Y" bgColor="bg-teal-50/30" />
              <SubHeader label="N" highlight bgColor="bg-teal-100/50" />
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr
                key={result.id || idx}
                className={cn(
                  "hover:bg-slate-50 transition-colors border-b border-gray-100 group",
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                )}
              >
                <td className={cn(
                  "p-3 border-r border-gray-200 sticky left-0 z-10 font-medium text-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap transition-colors",
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                )}>
                  <div className="flex flex-col">
                    {showStudentInfo ? (
                      <div
                        className={cn(
                          onStudentClick ? "cursor-pointer group/student" : ""
                        )}
                        onClick={() => onStudentClick?.(result.student_number)}
                      >
                        <span className={cn(
                          onStudentClick ? "text-indigo-700 group-hover/student:text-indigo-900 group-hover/student:underline transition-colors" : ""
                        )}>{result.student_name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-normal">
                          <span>{result.student_number}</span>
                          {result.student_class && <span>• {result.student_class}</span>}
                        </div>
                      </div>
                    ) : (
                      <>
                        <span>{result.exam_name}</span>
                        {result.student_class && <span className="text-[10px] text-slate-400 font-normal">{result.student_class}</span>}
                      </>
                    )}
                  </div>
                </td>

                {/* Genel */}
                <td className="p-2 border-r border-gray-100 whitespace-nowrap text-slate-600">
                  {result.exam_date ? format(new Date(result.exam_date), 'd MMM yyyy', { locale: tr }) : '-'}
                </td>
                <td className="p-2 border-r border-gray-100 text-center font-bold text-indigo-600 bg-indigo-50/10">
                  {result.total_score?.toFixed(2)}
                </td>
                <td className="p-2 border-r border-gray-100 text-center font-medium text-slate-700">
                  {result.percentile ? `%${result.percentile}` : '-'}
                </td>

                {/* Sıralamalar */}
                <RankCell value={result.rank_class} />
                <RankCell value={result.rank_school} />
                <RankCell value={result.rank_district} />
                <RankCell value={result.rank_city} />
                <RankCell value={result.rank_general} highlight />

                {/* Toplam */}
                <StatCell value={result.total_correct} bgColor="bg-indigo-50/30" />
                <StatCell value={result.total_wrong} isWrong bgColor="bg-indigo-50/30" />
                <StatCell value={result.total_net} isNet netBgColor="bg-indigo-50/60" />

                {/* Türkçe */}
                <StatCell value={result.turkish_correct} bgColor="bg-red-50/30" />
                <StatCell value={result.turkish_wrong} isWrong bgColor="bg-red-50/30" />
                <StatCell value={result.turkish_net} isNet netBgColor="bg-red-100/50" />

                {/* Matematik */}
                <StatCell value={result.math_correct} bgColor="bg-blue-50/30" />
                <StatCell value={result.math_wrong} isWrong bgColor="bg-blue-50/30" />
                <StatCell value={result.math_net} isNet netBgColor="bg-blue-100/50" />

                {/* Fen */}
                <StatCell value={result.science_correct} bgColor="bg-green-50/30" />
                <StatCell value={result.science_wrong} isWrong bgColor="bg-green-50/30" />
                <StatCell value={result.science_net} isNet netBgColor="bg-green-100/50" />

                {/* İnkılap */}
                <StatCell value={result.social_correct} bgColor="bg-orange-50/30" />
                <StatCell value={result.social_wrong} isWrong bgColor="bg-orange-50/30" />
                <StatCell value={result.social_net} isNet netBgColor="bg-orange-100/50" />

                {/* İngilizce */}
                <StatCell value={result.english_correct} bgColor="bg-purple-50/30" />
                <StatCell value={result.english_wrong} isWrong bgColor="bg-purple-50/30" />
                <StatCell value={result.english_net} isNet netBgColor="bg-purple-100/50" />

                {/* Din */}
                <StatCell value={result.religion_correct} bgColor="bg-teal-50/30" />
                <StatCell value={result.religion_wrong} isWrong bgColor="bg-teal-50/30" />
                <StatCell value={result.religion_net} isNet netBgColor="bg-teal-100/50" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectHeader({ title, color }: { title: string, color: string }) {
  return (
    <th colSpan={3} className={cn("p-2 border-r border-gray-200 text-center font-semibold", color)}>
      {title}
    </th>
  );
}

function SubHeader({ label, highlight, bgColor }: { label: string, highlight?: boolean, bgColor?: string }) {
  return (
    <th className={cn(
      "p-2 min-w-[40px] border-r border-gray-100 font-medium text-center",
      highlight ? cn("text-slate-900 border-b-2 border-slate-200", bgColor || "bg-gray-50") : bgColor
    )}>
      {label}
    </th>
  );
}

function RankCell({ value, highlight }: { value?: number, highlight?: boolean }) {
  return (
    <td className={cn(
      "p-2 border-r border-gray-100 text-center text-slate-600",
      highlight && value ? "font-bold text-amber-600 bg-amber-50/30" : ""
    )}>
      {value || '-'}
    </td>
  );
}

function StatCell({ value, isWrong, isNet, bgColor, netBgColor }: { value?: number, isWrong?: boolean, isNet?: boolean, bgColor?: string, netBgColor?: string }) {
  if (value === undefined || value === null) return <td className={cn("p-2 border-r border-gray-100 text-center text-slate-300", isNet ? (netBgColor || "bg-gray-50/50") : bgColor)}>-</td>;

  return (
    <td className={cn(
      "p-2 border-r border-gray-100 text-center",
      isWrong ? "text-red-500 text-xs" : "",
      isNet ? cn("font-bold text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]", netBgColor || "bg-gray-50/50") : cn("text-slate-600 text-xs", bgColor)
    )}>
      {value}
    </td>
  );
}
