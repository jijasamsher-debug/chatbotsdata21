import { Bot } from 'lucide-react';
import { BotType } from '../../types';

interface StepChooseTypeProps {
  botType: BotType;
  setBotType: (type: BotType) => void;
}

export const StepChooseType = ({ botType, setBotType }: StepChooseTypeProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose Bot Type</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Create your lead generation chatbot
      </p>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setBotType('leads')}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            botType === 'leads'
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
            <Bot className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Leads Generator</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Collect visitor information through a conversational form. Perfect for capturing leads with
            customizable questions.
          </p>
        </button>
      </div>
    </div>
  );
};
