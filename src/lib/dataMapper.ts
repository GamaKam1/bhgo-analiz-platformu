import { ExamResult } from '@/types';
import { AppSettings } from '@/hooks/useSettings';

export function mapDbResultToExamResult(data: any, mapping: AppSettings['columnMapping']): ExamResult {
  const getVal = (key: keyof typeof mapping) => {
    const dbColumn = mapping[key];
    return data[dbColumn];
  };

  const getNum = (key: keyof typeof mapping) => {
    const val = getVal(key);
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  return {
    id: data.id || Math.random().toString(36).substr(2, 9),
    student_number: String(getVal('student_number') || ''),
    student_name: String(getVal('student_name') || ''),
    student_class: String(getVal('student_class') || ''), // Added
    exam_name: String(getVal('exam_name') || 'İsimsiz Sınav'),
    exam_date: String(getVal('exam_date') || new Date().toISOString()),
    
    total_score: getNum('total_score'),
    percentile: getNum('percentile'), // Added

    total_correct: getNum('total_correct'), // Added
    total_wrong: getNum('total_incorrect'), // Added (mapped from total_incorrect setting)
    total_net: getNum('total_net'), // Added
    
    rank_class: getNum('rank_class') || undefined,
    rank_school: getNum('rank_school') || undefined,
    rank_district: getNum('rank_district') || undefined,
    rank_city: getNum('rank_city') || undefined,
    rank_general: getNum('rank_general') || undefined,
    
    turkish_correct: getNum('turkish_correct'),
    turkish_wrong: getNum('turkish_wrong'),
    turkish_net: getNum('turkish_net'),
    
    math_correct: getNum('math_correct'),
    math_wrong: getNum('math_wrong'),
    math_net: getNum('math_net'),
    
    science_correct: getNum('science_correct'),
    science_wrong: getNum('science_wrong'),
    science_net: getNum('science_net'),
    
    social_correct: getNum('social_correct'),
    social_wrong: getNum('social_wrong'),
    social_net: getNum('social_net'),
    
    english_correct: getNum('english_correct'),
    english_wrong: getNum('english_wrong'),
    english_net: getNum('english_net'),
    
    religion_correct: getNum('religion_correct'),
    religion_wrong: getNum('religion_wrong'),
    religion_net: getNum('religion_net'),
  };
}
