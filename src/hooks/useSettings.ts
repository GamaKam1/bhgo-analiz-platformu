import { useState, useEffect } from 'react';

export interface AppSettings {
  tableName: string;
  columnMapping: {
    student_number: string;
    student_name: string;
    student_class: string; // Added
    exam_name: string;
    exam_date: string;
    total_score: string;
    percentile: string; // Added

    total_correct: string; // Added
    total_incorrect: string; // Added
    total_net: string; // Added

    rank_class: string;
    rank_school: string;
    rank_district: string;
    rank_city: string;
    rank_general: string;

    turkish_correct: string;
    turkish_wrong: string;
    turkish_net: string;

    math_correct: string;
    math_wrong: string;
    math_net: string;

    science_correct: string;
    science_wrong: string;
    science_net: string;

    social_correct: string;
    social_wrong: string;
    social_net: string;

    english_correct: string;
    english_wrong: string;
    english_net: string;

    religion_correct: string;
    religion_wrong: string;
    religion_net: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  tableName: 'exam_results',
  columnMapping: {
    student_number: 'student_number',
    student_name: 'student_name',
    student_class: 'student_class', // Added
    exam_name: 'exam_name',
    exam_date: 'exam_date',
    total_score: 'score', // Database column is 'score'
    percentile: 'percentile', // Added

    total_correct: 'total_correct', // Added
    total_incorrect: 'total_incorrect', // Added
    total_net: 'total_net', // Added

    rank_class: 'rank_class',
    rank_school: 'rank_school',
    rank_district: 'rank_district',
    rank_city: 'rank_city',
    rank_general: 'rank_general',

    turkish_correct: 'turkish_correct',
    turkish_wrong: 'turkish_incorrect', // Database column is 'turkish_incorrect'
    turkish_net: 'turkish_net',

    math_correct: 'math_correct',
    math_wrong: 'math_incorrect',
    math_net: 'math_net',

    science_correct: 'science_correct',
    science_wrong: 'science_incorrect',
    science_net: 'science_net',

    social_correct: 'social_correct',
    social_wrong: 'social_incorrect',
    social_net: 'social_net',

    english_correct: 'english_correct',
    english_wrong: 'english_incorrect',
    english_net: 'english_net',

    religion_correct: 'religion_correct',
    religion_wrong: 'religion_incorrect',
    religion_net: 'religion_net',
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('lgs_app_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);

        // Migration: If old default 'total_score' is found, update to 'score'
        if (parsed.columnMapping && parsed.columnMapping.total_score === 'total_score') {
          parsed.columnMapping.total_score = 'score';

          // Also update subject wrong columns if they match old defaults
          const subjects = ['turkish', 'math', 'science', 'social', 'english', 'religion'];
          subjects.forEach(sub => {
            const key = `${sub}_wrong`;
            if (parsed.columnMapping[key] === `${sub}_wrong`) {
              parsed.columnMapping[key] = `${sub}_incorrect`;
            }
          });

          localStorage.setItem('lgs_app_settings', JSON.stringify(parsed));
        }

        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('lgs_app_settings', JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('lgs_app_settings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    isOpen,
    setIsOpen
  };
}
