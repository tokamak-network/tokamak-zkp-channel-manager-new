/**
 * Stepper Component
 * 
 * Displays multi-step progress indicator
 */

import { cn } from '../utils/cn';

export interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 font-semibold',
                  isCompleted && 'bg-blue-600 border-blue-600 text-white',
                  isActive && 'bg-blue-100 border-blue-600 text-blue-600',
                  !isActive && !isCompleted && 'bg-gray-100 border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className={cn(
                'mt-2 text-sm',
                isActive && 'font-semibold text-blue-600',
                !isActive && 'text-gray-500'
              )}>
                {step}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2',
                  isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

