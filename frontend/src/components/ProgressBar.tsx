import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-4">
        {stepLabels.map((label, index) => (
          <div
            key={index}
            className={`flex items-center ${index < stepLabels.length - 1 ? 'flex-1' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                index < currentStep
                  ? 'bg-primary-500 text-white'
                  : index === currentStep
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white ring-4 ring-primary-200'
                  : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            {index < stepLabels.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm text-neutral-600 font-medium">
          Step {currentStep + 1} of {totalSteps}: <span className="text-primary-600">{stepLabels[currentStep]}</span>
        </p>
      </div>
    </div>
  );
};
