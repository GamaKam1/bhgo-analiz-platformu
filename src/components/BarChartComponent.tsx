import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { ExamResult } from '@/types';
import { useMemo } from 'react';

interface BarChartComponentProps {
    results: ExamResult[];
    title?: string;
}

export function BarChartComponent({ results, title }: BarChartComponentProps) {
    const chartData = useMemo(() => {
        const subjects = [
            { key: 'turkish_net', label: 'Türkçe' },
            { key: 'math_net', label: 'Matematik' },
            { key: 'science_net', label: 'Fen Bil.' },
            { key: 'social_net', label: 'İnkılap' },
            { key: 'english_net', label: 'İngilizce' },
            { key: 'religion_net', label: 'Din Kült.' },
        ];

        // Map each subject to its values in different exams
        return subjects.map(subject => {
            const entry: any = { name: subject.label };
            results.forEach(result => {
                const examName = result.exam_name || 'Bilinmeyen Sınav';
                entry[examName] = result[subject.key as keyof ExamResult] || 0;
            });
            return entry;
        });
    }, [results]);

    const exams = useMemo(() => {
        return Array.from(new Set(results.map(r => r.exam_name || 'Bilinmeyen Sınav')));
    }, [results]);

    // Vibrant color palette for different bars
    const colors = [
        '#4f46e5', // Indigo 600
        '#0891b2', // Cyan 600
        '#059669', // Emerald 600
        '#d97706', // Amber 600
        '#dc2626', // Red 600
        '#7c3aed', // Violet 600
        '#2563eb', // Blue 600
    ];

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {title && (
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
                    {title}
                </h4>
            )}

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            domain={[0, 20]}
                            ticks={[0, 5, 10, 15, 20]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '30px' }}
                        />
                        {exams.map((exam, index) => (
                            <Bar
                                key={exam}
                                dataKey={exam}
                                fill={colors[index % colors.length]}
                                radius={[4, 4, 0, 0]}
                                barSize={exams.length > 3 ? 15 : 25}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
