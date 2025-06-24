import React from 'react';
import { FileText } from 'lucide-react';

interface AboutMeFormProps {
  data: string;
  onChange: (data: string) => void;
}

export const AboutMeForm: React.FC<AboutMeFormProps> = ({ data, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center mb-6">
        <FileText className="w-6 h-6 text-blue-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">About Me</h2>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tell us about yourself *
        </label>
        <textarea
          value={data}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="Write a compelling introduction about yourself, your background, interests, and what makes you unique. This will be the first thing people read about you on your portfolio."
          required
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            Write at least 100 characters for a compelling introduction
          </p>
          <p className="text-sm text-gray-500">
            {data.length}/500
          </p>
        </div>
      </div>
    </div>
  );
};