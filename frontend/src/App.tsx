

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProgressBar } from './components/ProgressBar';
import { PersonalInfoForm } from './components/PersonalInfoForm';
import { AboutMeForm } from './components/AboutMeForm';
import { EducationForm } from './components/EducationForm';
import { ProjectsForm } from './components/ProjectsForm';
import { AchievementsForm } from './components/AchievementsForm';
import { SocialLinksForm } from './components/SocialLinksForm';
import { ReviewAndExport } from './components/ReviewAndExport';
import { EnhancedPortfolioGeneration } from './components/EnhancedPortfolioGeneration';
import { WelcomePage } from './components/WelcomePage';
import {
  PortfolioData,
  PersonalInfo,
  Education,
  Project,
  Achievement,
  SocialLinks,
} from './types/portfolio';

const INITIAL_PERSONAL_INFO: PersonalInfo = {
  name: '',
  age: '',
  location: '',
  email: '',
  phone: '',
};

const INITIAL_SOCIAL_LINKS: SocialLinks = {
  github: '',
  linkedin: '',
  twitter: '',
  website: '',
  other: '',
};

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(INITIAL_PERSONAL_INFO);
  const [aboutMe, setAboutMe] = useState('');
  const [education, setEducation] = useState<Education[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(INITIAL_SOCIAL_LINKS);

  const stepLabels = [
    'Personal Info',
    'About Me',
    'Education',
    'Projects',
    'Achievements',
    'Social Links',
    'Review & Save',
    'Generate Portfolio',
  ];

  const startPortfolioCreation = () => setShowWelcome(false);

  const backToWelcome = () => {
    setShowWelcome(true);
    setCurrentStep(0);
    setPersonalInfo(INITIAL_PERSONAL_INFO);
    setAboutMe('');
    setEducation([]);
    setProjects([]);
    setAchievements([]);
    setSocialLinks(INITIAL_SOCIAL_LINKS);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(personalInfo.name && personalInfo.age && personalInfo.location && personalInfo.email);
      case 1:
        return aboutMe.length >= 50;
      case 2:
        return true;
      case 3:
        return projects.length >= 1; // Ensure at least one project is added
      case 4:
        return true;
      case 5:
        return !!(socialLinks.github && socialLinks.linkedin);
      case 6:
        return true;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepValid(currentStep);

  const nextStep = () => {
    if (currentStep < stepLabels.length - 1 && canProceed) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generatePortfolioData = (): PortfolioData => ({
    personalInfo,
    aboutMe,
    education,
    projects,
    achievements,
    socialLinks,
    generatedAt: new Date().toISOString(),
  });

  const handleSave = async () => {
    const portfolioData = generatePortfolioData();

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        throw new Error('Failed to save portfolio');
      }

      const result = await response.json();
      alert('✅ Portfolio saved successfully!');
      console.log('[Portfolio Saved]:', result);
      
      // Move to the next step (Generate Portfolio) after saving
      if (currentStep === 6) {
        nextStep();
      }
    } catch (error) {
      console.error('❌ Error saving portfolio:', error);
      alert('❌ Failed to save portfolio. See console for details.');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoForm data={personalInfo} onChange={setPersonalInfo} />;
      case 1:
        return <AboutMeForm data={aboutMe} onChange={setAboutMe} />;
      case 2:
        return <EducationForm data={education} onChange={setEducation} />;
      case 3:
        return <ProjectsForm data={projects} onChange={setProjects} />;
      case 4:
        return <AchievementsForm data={achievements} onChange={setAchievements} />;
      case 5:
        return <SocialLinksForm data={socialLinks} onChange={setSocialLinks} />;
      case 6:
        return <ReviewAndExport data={generatePortfolioData()} onExport={handleSave} />;
      case 7:
        return <EnhancedPortfolioGeneration data={generatePortfolioData()} />;
      default:
        return null;
    }
  };

  if (showWelcome) return <WelcomePage onGetStarted={startPortfolioCreation} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <header className="bg-white shadow-soft border-b border-neutral-200">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl text-white mr-4 shadow-soft">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Portfolio Generator</h1>
                <p className="text-neutral-600">Create and save your professional portfolio</p>
              </div>
            </div>
            <button 
              onClick={backToWelcome} 
              className="btn-secondary btn-md"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="container-custom py-10">
        <ProgressBar currentStep={currentStep} totalSteps={stepLabels.length} stepLabels={stepLabels} />
        
        <div className="mt-10 mb-12">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center ${
              currentStep === 0
                ? 'opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-400 px-6 py-3 rounded-xl'
                : 'btn-secondary btn-lg'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="text-center bg-white py-2 px-4 rounded-full shadow-soft-sm">
            <p className="text-sm font-medium text-neutral-600">
              {currentStep + 1} / {stepLabels.length}
            </p>
          </div>

          {currentStep < stepLabels.length - 1 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed}
              className={canProceed ? 'btn-primary btn-lg' : 'opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-400 px-6 py-3 rounded-xl'}
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <div className="w-24"></div>
          )}
        </div>

        {!canProceed && currentStep !== stepLabels.length - 1 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-soft-sm">
            <p className="text-sm text-amber-800 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {currentStep === 0 && 'Please fill in all required fields (Name, Age, Location, Email)'}
              {currentStep === 1 && 'Please write at least 50 characters in your about me section'}
              {currentStep === 5 && 'Please provide your GitHub and LinkedIn profile URLs'}
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-16 py-8">
        <div className="container-custom text-center">
          <div className="flex items-center justify-center mb-3">
            <span className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent font-bold mr-2">
              Portfolio Generator
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-600 ml-2">Version 1.0</span>
          </div>
          <p className="text-neutral-500">&copy; 2025 Portfolio Generator</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
