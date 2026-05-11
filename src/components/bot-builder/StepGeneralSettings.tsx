import { BotConfig } from '../../types';
import { Image } from 'lucide-react';

interface StepGeneralSettingsProps {
  botName: string;
  setBotName: (name: string) => void;
  config: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
}

export const StepGeneralSettings = ({ botName, setBotName, config, updateConfig }: StepGeneralSettingsProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">General Settings</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Configure basic settings for your chatbot
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bot Name
          </label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Support Bot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Welcome Message
          </label>
          <textarea
            value={config.welcomeMessage}
            onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Hi there! How can I help you today?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <Image className="w-4 h-4" />
            Welcome Message GIF URL (Optional)
          </label>
          <input
            type="url"
            value={config.welcomeGifUrl || ''}
            onChange={(e) => updateConfig({ welcomeGifUrl: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="https://media.giphy.com/media/.../giphy.gif"
          />
          {config.welcomeGifUrl && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
              <img src={config.welcomeGifUrl} alt="Welcome GIF preview" className="w-full h-auto rounded-lg" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Popup Message
          </label>
          <input
            type="text"
            value={config.popupMessage}
            onChange={(e) => updateConfig({ popupMessage: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Have a question? Chat with us!"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <Image className="w-4 h-4" />
            Popup Message GIF URL (Optional)
          </label>
          <input
            type="url"
            value={config.popupGifUrl || ''}
            onChange={(e) => updateConfig({ popupGifUrl: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="https://media.giphy.com/media/.../giphy.gif"
          />
          {config.popupGifUrl && (
            <div className="mt-2 rounded-lg overflow-hidden max-w-[200px]">
              <img src={config.popupGifUrl} alt="Popup GIF preview" className="w-full h-auto rounded-lg" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Popup Delay (seconds)
          </label>
          <input
            type="number"
            value={config.popupDelay}
            onChange={(e) => updateConfig({ popupDelay: parseInt(e.target.value) || 0 })}
            min="0"
            max="60"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Time before showing the popup message (0 to disable)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Leads Table Name
          </label>
          <input
            type="text"
            value={config.leadsTableName || botName || ''}
            onChange={(e) => updateConfig({ leadsTableName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Support Leads, Contact Form"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            This name will appear in your leads dashboard
          </p>
        </div>
      </div>
    </div>
  );
};
