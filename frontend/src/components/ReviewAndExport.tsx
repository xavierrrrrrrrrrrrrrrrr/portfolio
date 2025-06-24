import React, { useState } from 'react';
import { Save, Eye, Github, Star, Calendar, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { PortfolioData } from '../types/portfolio';

interface ReviewAndExportProps {
  data: PortfolioData;
  onExport: () => void;
}

export const ReviewAndExport: React.FC<ReviewAndExportProps> = ({ data, onExport }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [portfolioId, setPortfolioId] = useState<string>('');

  const savePortfolio = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Generate a unique portfolio ID
      const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real application, this would be an API call to your backend
      // For now, we'll simulate saving to localStorage as a demo
      const portfolioWithId = {
        ...data,
        id,
        savedAt: new Date().toISOString()
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage (in production, this would be your database)
      localStorage.setItem(`portfolio_${id}`, JSON.stringify(portfolioWithId));
      
      // Also maintain a list of all portfolios
      const existingPortfolios = JSON.parse(localStorage.getItem('all_portfolios') || '[]');
      existingPortfolios.push({
        id,
        name: data.personalInfo.name,
        email: data.personalInfo.email,
        savedAt: portfolioWithId.savedAt
      });
      localStorage.setItem('all_portfolios', JSON.stringify(existingPortfolios));
      
      setPortfolioId(id);
      setSaveStatus('success');
      onExport();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadBackup = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${data.personalInfo.name.replace(/\s+/g, '_')}_portfolio_backup.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm bg-opacity-95">
      <div className="flex items-center mb-6">
        <Eye className="w-6 h-6 text-blue-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Review & Save Portfolio</h2>
      </div>

      <div className="space-y-8">
        {/* Personal Info Summary */}
        <div className="border-l-4 border-blue-500 pl-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{data.personalInfo.name}</h3>
          <p className="text-gray-600 mb-2">{data.personalInfo.age} years old • {data.personalInfo.location}</p>
          <p className="text-gray-600">{data.personalInfo.email}</p>
          {data.personalInfo.phone && <p className="text-gray-600">{data.personalInfo.phone}</p>}
        </div>

        {/* About Me */}
        {data.aboutMe && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">About Me</h3>
            <p className="text-gray-600 line-clamp-3">{data.aboutMe}</p>
          </div>
        )}

        {/* Education Summary */}
        {data.education.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Education ({data.education.length})</h3>
            <div className="space-y-2">
              {data.education.slice(0, 2).map((edu, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{edu.degree} in {edu.field}</p>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                  </div>
                  <p className="text-sm text-gray-500">{edu.startYear} - {edu.endYear}</p>
                </div>
              ))}
              {data.education.length > 2 && (
                <p className="text-sm text-gray-500">+{data.education.length - 2} more</p>
              )}
            </div>
          </div>
        )}

        {/* Projects Summary */}
        {data.projects.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Projects ({data.projects.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.projects.slice(0, 4).map((project, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">{project.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.technologies.slice(0, 3).map((tech, techIndex) => (
                      <span key={techIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="text-xs text-gray-500">+{project.technologies.length - 3}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {project.githubUrl && (
                      <Github className="w-4 h-4 text-gray-500" />
                    )}
                    {project.liveUrl && (
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {data.projects.length > 4 && (
              <p className="text-sm text-gray-500 mt-2">+{data.projects.length - 4} more projects</p>
            )}
          </div>
        )}

        {/* No GitHub Repos Summary - Removed */}

        {/* Achievements Summary */}
        {data.achievements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Achievements ({data.achievements.length})</h3>
            <div className="space-y-2">
              {data.achievements.slice(0, 3).map((achievement, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{achievement.title}</p>
                    {achievement.organization && (
                      <p className="text-sm text-gray-600">{achievement.organization}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{new Date(achievement.date).toLocaleDateString()}</p>
                </div>
              ))}
              {data.achievements.length > 3 && (
                <p className="text-sm text-gray-500">+{data.achievements.length - 3} more</p>
              )}
            </div>
          </div>
        )}

        {/* Save Status */}
        {saveStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-green-800 font-medium">Portfolio Saved Successfully!</p>
                <p className="text-green-700 text-sm">Portfolio ID: {portfolioId}</p>
                <p className="text-green-600 text-sm mt-1">
                  Your portfolio data has been securely saved and can be accessed anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <div>
                <p className="text-red-800 font-medium">Error Saving Portfolio</p>
                <p className="text-red-600 text-sm">
                  There was an issue saving your portfolio. Please try again or download a backup.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <button
            onClick={savePortfolio}
            disabled={isSaving || saveStatus === 'success'}
            className={`w-full flex items-center justify-center px-6 py-4 rounded-lg font-medium text-lg transition-all duration-200 ${
              saveStatus === 'success'
                ? 'bg-green-500 text-white cursor-default'
                : isSaving
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 shadow-md hover:shadow-lg'
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving Portfolio...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Portfolio Saved Successfully
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Portfolio
              </>
            )}
          </button>

          {saveStatus !== 'success' && (
            <button
              onClick={downloadBackup}
              className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Download Backup (JSON)
            </button>
          )}

          <p className="text-sm text-gray-500 text-center">
            {saveStatus === 'success' 
              ? 'Your portfolio has been saved securely and can be accessed anytime.'
              : 'Your portfolio data will be saved securely on our servers.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};