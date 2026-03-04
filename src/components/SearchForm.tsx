import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  onSearch: (studentNumber: string) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [value, setValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            className={cn(
              "w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm",
              "text-lg text-gray-900 placeholder-gray-400",
              "focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            placeholder="Öğrenci Numarası (örn: 12345)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className={cn(
            "absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl font-medium",
            "hover:bg-indigo-700 active:transform active:scale-95 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          )}
        >
          {isLoading ? 'Aranıyor...' : 'Sorgula'}
        </button>
      </form>
    </div>
  );
}
