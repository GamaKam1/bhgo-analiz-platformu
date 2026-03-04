export interface ExamResult {
  id: string | number;
  student_number: string;
  student_name: string;
  student_class?: string; // Added
  exam_name: string;
  exam_date: string;
  
  // Scores
  total_score: number;
  percentile?: number; // Added
  
  // Totals
  total_correct?: number; // Added
  total_wrong?: number; // Added
  total_net?: number; // Added

  // Rankings
  rank_class?: number;
  rank_school?: number;
  rank_district?: number;
  rank_city?: number;
  rank_general?: number;
  
  // Subject Details (LGS specific)
  turkish_correct: number;
  turkish_wrong: number;
  turkish_net: number;
  
  math_correct: number;
  math_wrong: number;
  math_net: number;
  
  science_correct: number;
  science_wrong: number;
  science_net: number;
  
  social_correct: number;
  social_wrong: number;
  social_net: number;
  
  english_correct: number;
  english_wrong: number;
  english_net: number;
  
  religion_correct: number;
  religion_wrong: number;
  religion_net: number;
}

// Helper to map generic DB columns to our interface if needed
// This assumes the DB columns match these names roughly. 
// You might need to adjust the SQL query or this interface based on the actual table structure.
