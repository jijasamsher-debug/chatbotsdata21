import { BotConfig, ThankYouCta } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';

interface StepThemeProps {
  config: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
}

export const StepTheme = ({ config, updateConfig }: StepThemeProps) => {
  const { user } = useAuth();
  const canRemoveWatermark = user?.subscription?.plan === 'growth' || user?.subscription?.plan === 'growth_yearly';
  const updateTheme = (updates: Partial<BotConfig['theme']>) => {
    updateConfig({ theme: { ...config.theme, ...updates } });
  };

  const fontOptions = [
    { value: 'sans-serif', label: 'Sans-serif (Modern)' },
    { value: 'serif', label: 'Serif (Classic)' },
    { value: 'monospace', label: 'Monospace (Code)' },
    { value: '"Comic Sans MS", cursive', label: 'Rounded (Friendly)' }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Theme & Design</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Customize the appearance of your chatbot
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Widget Template
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateTheme({ template: 'standard' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                (config.theme.template || 'standard') === 'standard'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Standard</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Classic chatbot design</div>
            </button>
            <button
              onClick={() => updateTheme({ template: 'modernui' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.theme.template === 'modernui'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white mb-1">Modern UI</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Modern with animations</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Auto-Open Delay (seconds)
          </label>
          <input
            type="number"
            min="0"
            value={config.theme.autoOpenDelay || 0}
            onChange={(e) => updateTheme({ autoOpenDelay: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Set to 0 to disable auto-open. Widget will auto-open once per session.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Popup Message Animation
          </label>
          <select
            value={config.theme.popupAnimation || 'bounce'}
            onChange={(e) => updateTheme({ popupAnimation: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="bounce">Bounce</option>
            <option value="fade">Fade In</option>
            <option value="slide">Slide Up</option>
            <option value="none">No Animation</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Animation style for the popup notification bubble
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Widget Animation
          </label>
          <select
            value={config.theme.widgetAnimation || 'fade'}
            onChange={(e) => updateTheme({ widgetAnimation: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="fade">Fade In</option>
            <option value="slide">Slide Up</option>
            <option value="scale">Scale / Pop</option>
            <option value="none">No Animation</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Animation when the chat widget opens
          </p>
        </div>

        {config.theme.template === 'modernui' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bot Name
              </label>
              <input
                type="text"
                value={config.theme.botName || ''}
                onChange={(e) => updateTheme({ botName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Inaya"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bot Subtitle
              </label>
              <input
                type="text"
                value={config.theme.botSubtitle || ''}
                onChange={(e) => updateTheme({ botSubtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Customer Support Assistant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Logo URL
              </label>
              <input
                type="url"
                value={config.theme.logoUrl || ''}
                onChange={(e) => updateTheme({ logoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bot Avatar URL
              </label>
              <input
                type="url"
                value={config.theme.botAvatarUrl || ''}
                onChange={(e) => updateTheme({ botAvatarUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CTA Message
              </label>
              <input
                type="text"
                value={config.theme.ctaMessage || ''}
                onChange={(e) => updateTheme({ ctaMessage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Get trending gift options for your Company?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CTA Button Text
              </label>
              <input
                type="text"
                value={config.theme.ctaText || ''}
                onChange={(e) => updateTheme({ ctaText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., YES, LET'S GO"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thank You Message
              </label>
              <input
                type="text"
                value={config.theme.thankYouMessage || ''}
                onChange={(e) => updateTheme({ thankYouMessage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Thank you! We'll get back to you soon."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Can be overridden per page in Page Rules
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thank You GIF URL (Optional)
              </label>
              <input
                type="url"
                value={config.theme.thankYouGifUrl || ''}
                onChange={(e) => updateTheme({ thankYouGifUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://media.giphy.com/..."
              />
              {config.theme.thankYouGifUrl && (
                <img src={config.theme.thankYouGifUrl} alt="Thank you GIF preview" className="mt-2 max-h-24 rounded-lg" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thank You CTA Text (Optional)
                </label>
                <input
                  type="text"
                  value={config.theme.thankYouCtaText || ''}
                  onChange={(e) => updateTheme({ thankYouCtaText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Visit Website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thank You CTA URL (Optional)
                </label>
                <input
                  type="url"
                  value={config.theme.thankYouCtaUrl || ''}
                  onChange={(e) => updateTheme({ thankYouCtaUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Multiple Thank You CTAs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Thank You CTAs (Optional)
              </label>
              <div className="space-y-3">
                {(config.theme.thankYouCtas || []).map((cta) => (
                  <div key={cta.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <input
                      type="text"
                      value={cta.text}
                      onChange={(e) => {
                        const updated = (config.theme.thankYouCtas || []).map(c =>
                          c.id === cta.id ? { ...c, text: e.target.value } : c
                        );
                        updateTheme({ thankYouCtas: updated });
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Button text"
                    />
                    <input
                      type="url"
                      value={cta.url}
                      onChange={(e) => {
                        const updated = (config.theme.thankYouCtas || []).map(c =>
                          c.id === cta.id ? { ...c, url: e.target.value } : c
                        );
                        updateTheme({ thankYouCtas: updated });
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="https://example.com"
                    />
                    <button
                      onClick={() => {
                        const updated = (config.theme.thankYouCtas || []).filter(c => c.id !== cta.id);
                        updateTheme({ thankYouCtas: updated });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newCta: ThankYouCta = { id: `cta_${Date.now()}`, text: '', url: '' };
                    updateTheme({ thankYouCtas: [...(config.theme.thankYouCtas || []), newCta] });
                  }}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  Add another CTA button
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="removePoweredBy"
                  checked={canRemoveWatermark ? (config.theme.removePoweredBy || false) : false}
                  onChange={(e) => updateTheme({ removePoweredBy: e.target.checked })}
                  disabled={!canRemoveWatermark}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="removePoweredBy" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Remove "Powered by" watermark
                </label>
              </div>
              {!canRemoveWatermark && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Available only on Growth plan.</p>
              )}
            </div>
          </>
        )}

        {config.theme.template === 'standard' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thank You Message
              </label>
              <input
                type="text"
                value={config.theme.thankYouMessage || ''}
                onChange={(e) => updateTheme({ thankYouMessage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Thank you! We'll get back to you soon."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Can be overridden per page in Page Rules
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thank You GIF URL (Optional)
              </label>
              <input
                type="url"
                value={config.theme.thankYouGifUrl || ''}
                onChange={(e) => updateTheme({ thankYouGifUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://media.giphy.com/..."
              />
              {config.theme.thankYouGifUrl && (
                <img src={config.theme.thankYouGifUrl} alt="Thank you GIF preview" className="mt-2 max-h-24 rounded-lg" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thank You CTA Text (Optional)
                </label>
                <input
                  type="text"
                  value={config.theme.thankYouCtaText || ''}
                  onChange={(e) => updateTheme({ thankYouCtaText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Visit Website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thank You CTA URL (Optional)
                </label>
                <input
                  type="url"
                  value={config.theme.thankYouCtaUrl || ''}
                  onChange={(e) => updateTheme({ thankYouCtaUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Multiple Thank You CTAs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Thank You CTAs (Optional)
              </label>
              <div className="space-y-3">
                {(config.theme.thankYouCtas || []).map((cta) => (
                  <div key={cta.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <input
                      type="text"
                      value={cta.text}
                      onChange={(e) => {
                        const updated = (config.theme.thankYouCtas || []).map(c =>
                          c.id === cta.id ? { ...c, text: e.target.value } : c
                        );
                        updateTheme({ thankYouCtas: updated });
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Button text"
                    />
                    <input
                      type="url"
                      value={cta.url}
                      onChange={(e) => {
                        const updated = (config.theme.thankYouCtas || []).map(c =>
                          c.id === cta.id ? { ...c, url: e.target.value } : c
                        );
                        updateTheme({ thankYouCtas: updated });
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="https://example.com"
                    />
                    <button
                      onClick={() => {
                        const updated = (config.theme.thankYouCtas || []).filter(c => c.id !== cta.id);
                        updateTheme({ thankYouCtas: updated });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newCta: ThankYouCta = { id: `cta_${Date.now()}`, text: '', url: '' };
                    updateTheme({ thankYouCtas: [...(config.theme.thankYouCtas || []), newCta] });
                  }}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  Add another CTA button
                </button>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Primary Color
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={config.theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={config.theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="#2563eb"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Typing Animation Speed (ms)
          </label>
          <input
            type="number"
            min="10"
            max="200"
            value={config.theme.typingSpeed || 50}
            onChange={(e) => updateTheme({ typingSpeed: parseInt(e.target.value) || 50 })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Speed per character in milliseconds. Lower = faster. Default: 50ms
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Font Family
          </label>
          <select
            value={config.theme.fontFamily}
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {fontOptions.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
