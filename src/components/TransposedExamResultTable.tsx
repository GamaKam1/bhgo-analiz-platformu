import React from 'react';
import { ExamResult } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TransposedExamResultTableProps {
    results: ExamResult[];
}

export function TransposedExamResultTable({ results }: TransposedExamResultTableProps) {
    if (results.length === 0) return null;

    const renderMetricRow = (
        label: string,
        valueKey: keyof ExamResult,
        formatFn?: (val: any) => React.ReactNode,
        rowClass?: string
    ) => {
        // Hide rank rows and percentile if they are completely empty
        const hasValue = results.some(r => r[valueKey] !== undefined && r[valueKey] !== null);
        if (!hasValue && (valueKey.startsWith('rank_') || valueKey === 'percentile')) return null;

        return (
            <tr className={cn("border-b border-gray-100 hover:bg-slate-50 transition-colors bg-white", rowClass)}>
                <td className="p-3 border-r border-gray-200 sticky left-0 bg-white z-10 font-semibold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap text-sm">
                    {label}
                </td>
                {results.map((result, idx) => (
                    <td key={result.id || idx} className="p-3 border-r border-gray-100 text-center text-sm">
                        {result[valueKey] !== undefined && result[valueKey] !== null
                            ? (formatFn ? formatFn(result[valueKey]) : result[valueKey] as React.ReactNode)
                            : '-'}
                    </td>
                ))}
            </tr>
        );
    };

    const renderSubjectRow = (
        label: string,
        prefix: 'total' | 'turkish' | 'math' | 'science' | 'social' | 'english' | 'religion',
        bgColorClass: string
    ) => {
        return (
            <tr className="border-b border-gray-100 hover:bg-slate-50 transition-colors bg-white">
                <td className={cn("p-3 border-r border-gray-200 sticky left-0 z-10 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap text-sm bg-white", bgColorClass)}>
                    {label}
                </td>
                {results.map((result, idx) => {
                    const correct = result[`${prefix}_correct` as keyof ExamResult];
                    const wrong = result[`${prefix}_wrong` as keyof ExamResult];
                    const net = result[`${prefix}_net` as keyof ExamResult];

                    if (correct === undefined && wrong === undefined && net === undefined) {
                        return <td key={result.id || idx} className="p-3 border-r border-gray-100 text-center text-slate-300">-</td>;
                    }

                    return (
                        <td key={result.id || idx} className={cn("p-2 border-r border-gray-100 text-center min-w-[100px]", bgColorClass.replace('text-', 'bg-').replace('700', '50/30'))}>
                            <div className="flex flex-col items-center justify-center gap-1">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-emerald-600 font-medium">{correct ?? '-'} D</span>
                                    <span className="text-red-500 font-medium">{wrong ?? '-'} Y</span>
                                </div>
                                <div className={cn("font-bold text-slate-800 px-2 py-0.5 rounded text-sm w-full", bgColorClass.replace('text-', 'bg-').replace('700', '100/50'))}>
                                    {net ?? '-'} N
                                </div>
                            </div>
                        </td>
                    );
                })}
            </tr>
        );
    };

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="overflow-auto pb-2 custom-scrollbar max-h-[70vh]">
                <table className="w-full border-collapse text-sm text-left relative">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200">
                            <th className="p-3 border-r border-gray-200 min-w-[160px] sticky left-0 top-0 bg-slate-50 z-30 font-bold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">
                                Ders / Metrik
                            </th>
                            {results.map((result, idx) => (
                                <th key={result.id || idx} className="p-3 border-r border-gray-200 text-center font-semibold text-slate-700 min-w-[140px] bg-slate-50 align-top">
                                    <div className="flex flex-col items-center">
                                        <span className="max-w-[140px] whitespace-normal text-center">{result.exam_name || result.student_name}</span>
                                        {result.exam_date && (
                                            <span className="text-[10px] text-slate-400 font-normal mt-1">
                                                {format(new Date(result.exam_date), 'd MMM yyyy', { locale: tr })}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderMetricRow('Puan', 'total_score', (val) => <span className="font-bold text-indigo-600">{(val as number).toFixed(2)}</span>, "bg-indigo-50/10")}
                        {renderMetricRow('Yüzdelik Dilim', 'percentile', (val) => <span className="font-medium text-slate-700">%{(val as number)}</span>)}

                        {renderMetricRow('Sınıf Sıralaması', 'rank_class')}
                        {renderMetricRow('Okul Sıralaması', 'rank_school')}
                        {renderMetricRow('İlçe Sıralaması', 'rank_district')}
                        {renderMetricRow('İl Sıralaması', 'rank_city')}
                        {renderMetricRow('Genel Sıralaması', 'rank_general', (val) => <span className="font-bold text-amber-600">{val as number}</span>, "bg-amber-50/30")}

                        {/* Divider */}
                        <tr className="bg-slate-50">
                            <td colSpan={results.length + 1} className="h-2 border-y border-gray-200 bg-slate-50 p-0 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></td>
                        </tr>

                        {renderSubjectRow('Toplam', 'total', 'text-indigo-700')}
                        {renderSubjectRow('Türkçe', 'turkish', 'text-red-700')}
                        {renderSubjectRow('Matematik', 'math', 'text-blue-700')}
                        {renderSubjectRow('Fen Bilimleri', 'science', 'text-green-700')}
                        {renderSubjectRow('T.C. İnkılap', 'social', 'text-orange-700')}
                        {renderSubjectRow('İngilizce', 'english', 'text-purple-700')}
                        {renderSubjectRow('Din Kültürü', 'religion', 'text-teal-700')}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
