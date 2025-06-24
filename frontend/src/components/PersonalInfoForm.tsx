import React from 'react';
import { User, MapPin, Mail, Phone } from 'lucide-react';
import { PersonalInfo } from '../types/portfolio';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="card p-8">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white mr-3">
          <User className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800">Personal Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Full Name <span className="text-primary-600">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="form-input"
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Age <span className="text-primary-600">*</span>
          </label>
          <input
            type="number"
            value={data.age}
            onChange={(e) => handleChange('age', e.target.value)}
            className="form-input"
            placeholder="Your age"
            min="16"
            max="100"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1 text-primary-600" />
            Location <span className="text-primary-600">*</span>
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="form-input"
            placeholder="City, Country"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1 text-primary-600" />
            Email <span className="text-primary-600">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="form-input"
            placeholder="your.email@example.com"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1 text-primary-600" />
            Phone Number
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="form-input"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>
    </div>
  );
};
