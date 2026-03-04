import React, { useState } from 'react';
import { X, Save, RotateCcw, Settings } from 'lucide-react';
import { AppSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onReset: () => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave, onReset }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'subjects'>('general');

  // Sync local state when settings prop changes
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleInputChange = (key: keyof AppSettings['columnMapping'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      columnMapping: {
        ...prev.columnMapping,
        [key]: value
      }
    }));
  };

  const handleTableNameChange = (value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      tableName: value
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <Settings className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Veritabanı Ayarları</h2>
                    <p className="text-sm text-slate-500">Tablo ve sütun isimlerini eşleştirin</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6">
                <button
                  onClick={() => setActiveTab('general')}
                  className={cn(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'general' 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  Genel Ayarlar
                </button>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className={cn(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === 'subjects' 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  Ders Sütunları
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'general' ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 mb-6">
                      Supabase veritabanınızdaki tablo adını ve temel sütun isimlerini buraya girin.
                      Eğer sütun isimleriniz varsayılan ile aynıysa değiştirmenize gerek yoktur.
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-semibold text-slate-700">Tablo Adı</label>
                        <input
                          type="text"
                          value={localSettings.tableName}
                          onChange={(e) => handleTableNameChange(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          placeholder="exam_results"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Öğrenci No Sütunu" value={localSettings.columnMapping.student_number} onChange={(v) => handleInputChange('student_number', v)} />
                        <InputGroup label="Öğrenci Adı Sütunu" value={localSettings.columnMapping.student_name} onChange={(v) => handleInputChange('student_name', v)} />
                        <InputGroup label="Sınıf Sütunu" value={localSettings.columnMapping.student_class} onChange={(v) => handleInputChange('student_class', v)} />
                        <InputGroup label="Sınav Adı Sütunu" value={localSettings.columnMapping.exam_name} onChange={(v) => handleInputChange('exam_name', v)} />
                        <InputGroup label="Sınav Tarihi Sütunu" value={localSettings.columnMapping.exam_date} onChange={(v) => handleInputChange('exam_date', v)} />
                        <InputGroup label="Toplam Puan Sütunu" value={localSettings.columnMapping.total_score} onChange={(v) => handleInputChange('total_score', v)} />
                        <InputGroup label="Yüzdelik Dilim Sütunu" value={localSettings.columnMapping.percentile} onChange={(v) => handleInputChange('percentile', v)} />
                      </div>

                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Genel Toplamlar</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <InputGroup label="Toplam Doğru" value={localSettings.columnMapping.total_correct} onChange={(v) => handleInputChange('total_correct', v)} />
                          <InputGroup label="Toplam Yanlış" value={localSettings.columnMapping.total_incorrect} onChange={(v) => handleInputChange('total_incorrect', v)} />
                          <InputGroup label="Toplam Net" value={localSettings.columnMapping.total_net} onChange={(v) => handleInputChange('total_net', v)} />
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Sıralama Sütunları</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputGroup label="Sınıf Sıralaması" value={localSettings.columnMapping.rank_class} onChange={(v) => handleInputChange('rank_class', v)} />
                          <InputGroup label="Okul Sıralaması" value={localSettings.columnMapping.rank_school} onChange={(v) => handleInputChange('rank_school', v)} />
                          <InputGroup label="İlçe Sıralaması" value={localSettings.columnMapping.rank_district} onChange={(v) => handleInputChange('rank_district', v)} />
                          <InputGroup label="İl Sıralaması" value={localSettings.columnMapping.rank_city} onChange={(v) => handleInputChange('rank_city', v)} />
                          <InputGroup label="Genel Sıralama" value={localSettings.columnMapping.rank_general} onChange={(v) => handleInputChange('rank_general', v)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <SubjectMappingSection title="Türkçe" prefix="turkish" mapping={localSettings.columnMapping} onChange={handleInputChange} color="text-red-600 bg-red-50" />
                    <SubjectMappingSection title="Matematik" prefix="math" mapping={localSettings.columnMapping} onChange={handleInputChange} color="text-blue-600 bg-blue-50" />
                    <SubjectMappingSection title="Fen Bilimleri" prefix="science" mapping={localSettings.columnMapping} onChange={handleInputChange} color="text-green-600 bg-green-50" />
                    <SubjectMappingSection title="T.C. İnkılap" prefix="social" mapping={localSettings.columnMapping} onChange={handleInputChange} color="text-orange-600 bg-orange-50" />
                    <SubjectMappingSection title="İngilizce" prefix="english" mapping={localSettings.columnMapping} onChange={handleInputChange} color="text-purple-600 bg-purple-50" />
                    <SubjectMappingSection title="Din Kültürü" prefix="religion" mapping={localSettings.columnMapping} onChange={handleInputChange} color="text-teal-600 bg-teal-50" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-slate-50 rounded-b-2xl flex items-center justify-between">
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Varsayılanlara Dön
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Save className="w-4 h-4" />
                    Ayarları Kaydet
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InputGroup({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-mono text-slate-700"
        placeholder="Sütun adı..."
      />
    </div>
  );
}

function SubjectMappingSection({ title, prefix, mapping, onChange, color }: { 
  title: string, 
  prefix: string, 
  mapping: AppSettings['columnMapping'], 
  onChange: (key: any, val: string) => void,
  color: string
}) {
  return (
    <div className="space-y-3">
      <h3 className={cn("text-sm font-bold px-3 py-1.5 rounded-lg inline-block", color)}>{title}</h3>
      <div className="grid grid-cols-3 gap-4">
        <InputGroup label="Doğru" value={mapping[`${prefix}_correct` as keyof typeof mapping]} onChange={(v) => onChange(`${prefix}_correct`, v)} />
        <InputGroup label="Yanlış" value={mapping[`${prefix}_wrong` as keyof typeof mapping]} onChange={(v) => onChange(`${prefix}_wrong`, v)} />
        <InputGroup label="Net" value={mapping[`${prefix}_net` as keyof typeof mapping]} onChange={(v) => onChange(`${prefix}_net`, v)} />
      </div>
    </div>
  );
}
