import { useState } from 'react';
import { Plus, Trash2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { BotConfig, PageRule, Question, ThankYouCta } from '../../types';

const OptionsInput = ({ options, onChange }: { options: string[]; onChange: (opts: string[]) => void }) => {
  const [raw, setRaw] = useState(options.join(', '));

  return (
    <input
      type="text"
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        const parsed = raw.split(',').map(o => o.trim()).filter(Boolean);
        onChange(parsed);
        setRaw(parsed.join(', '));
      }}
      placeholder="Options (comma separated, e.g. Yes, No, Maybe)"
      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
    />
  );
};
import { Link } from 'react-router-dom';

interface StepPageRulesProps {
  config: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
  isPremiumUser?: boolean;
}

export const StepPageRules = ({ config, updateConfig, isPremiumUser = false }: StepPageRulesProps) => {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  if (!isPremiumUser) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/50 rounded-full mb-4">
          <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Feature</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Page Rules let you set custom questions and messages for specific pages. Upgrade to a paid plan to unlock this feature.
        </p>
        <Link
          to="/dashboard/upgrade"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  const addRule = () => {
    const newRule: PageRule = {
      id: `rule_${Date.now()}`,
      urlPattern: '',
      welcomeMessage: '',
      popupMessage: ''
    };
    updateConfig({ pageRules: [...config.pageRules, newRule] });
    setExpandedRuleId(newRule.id);
  };

  const updateRule = (id: string, updates: Partial<PageRule>) => {
    updateConfig({
      pageRules: config.pageRules.map(r => (r.id === id ? { ...r, ...updates } : r))
    });
  };

  const deleteRule = (id: string) => {
    updateConfig({ pageRules: config.pageRules.filter(r => r.id !== id) });
    if (expandedRuleId === id) setExpandedRuleId(null);
  };

  const toggleCustomQuestions = (rule: PageRule) => {
    if (rule.questions) {
      // Switch back to default
      updateRule(rule.id, { questions: undefined });
    } else {
      // Switch to custom — copy from default questions
      updateRule(rule.id, { questions: config.questions.map(q => ({ ...q, id: `${q.id}_${Date.now()}` })) });
    }
  };

  const updateRuleQuestion = (ruleId: string, questionId: string, updates: Partial<Question>) => {
    const rule = config.pageRules.find(r => r.id === ruleId);
    if (!rule?.questions) return;
    updateRule(ruleId, {
      questions: rule.questions.map(q => (q.id === questionId ? { ...q, ...updates } : q))
    });
  };

  const addRuleQuestion = (ruleId: string) => {
    const rule = config.pageRules.find(r => r.id === ruleId);
    if (!rule?.questions) return;
    const newQ: Question = {
      id: `q_${Date.now()}`,
      text: '',
      columnHeader: '',
      type: 'text',
      required: true
    };
    updateRule(ruleId, { questions: [...rule.questions, newQ] });
  };

  const deleteRuleQuestion = (ruleId: string, questionId: string) => {
    const rule = config.pageRules.find(r => r.id === ruleId);
    if (!rule?.questions) return;
    updateRule(ruleId, { questions: rule.questions.filter(q => q.id !== questionId) });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Rules</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Customize bot behavior and questions for specific pages
      </p>

      <div className="space-y-4 mb-4">
        {config.pageRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id;
          const hasCustomQuestions = !!rule.questions;

          return (
            <div
              key={rule.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden"
            >
              {/* Rule header */}
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {rule.urlPattern || 'New Rule'}
                  </span>
                  {hasCustomQuestions && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full whitespace-nowrap">
                      Custom Questions
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteRule(rule.id); }}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL Pattern</label>
                    <input
                      type="text"
                      value={rule.urlPattern}
                      onChange={(e) => updateRule(rule.id, { urlPattern: e.target.value })}
                      placeholder="/pricing, /contact, *.example.com/products/*"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Welcome Message (optional)</label>
                    <input
                      type="text"
                      value={rule.welcomeMessage || ''}
                      onChange={(e) => updateRule(rule.id, { welcomeMessage: e.target.value })}
                      placeholder="Leave empty to use default"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Popup Message (optional)</label>
                    <input
                      type="text"
                      value={rule.popupMessage || ''}
                      onChange={(e) => updateRule(rule.id, { popupMessage: e.target.value })}
                      placeholder="Leave empty to use default"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Thank You Message (optional)</label>
                    <input
                      type="text"
                      value={rule.customThankYouMessage || ''}
                      onChange={(e) => updateRule(rule.id, { customThankYouMessage: e.target.value })}
                      placeholder="Leave empty to use default from theme"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Thank You CTA Text (optional)</label>
                    <input
                      type="text"
                      value={rule.thankYouCtaText || ''}
                      onChange={(e) => updateRule(rule.id, { thankYouCtaText: e.target.value })}
                      placeholder="e.g. Visit Our Website"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Thank You CTA URL (optional)</label>
                    <input
                      type="text"
                      value={rule.thankYouCtaUrl || ''}
                      onChange={(e) => updateRule(rule.id, { thankYouCtaUrl: e.target.value })}
                      placeholder="e.g. https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  {/* Multiple Thank You CTAs for Page Rule */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Additional Thank You CTAs (optional)</label>
                    <div className="space-y-2">
                      {(rule.thankYouCtas || []).map((cta) => (
                        <div key={cta.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                          <input
                            type="text"
                            value={cta.text}
                            onChange={(e) => {
                              const updated = (rule.thankYouCtas || []).map(c =>
                                c.id === cta.id ? { ...c, text: e.target.value } : c
                              );
                              updateRule(rule.id, { thankYouCtas: updated });
                            }}
                            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                            placeholder="Button text"
                          />
                          <input
                            type="url"
                            value={cta.url}
                            onChange={(e) => {
                              const updated = (rule.thankYouCtas || []).map(c =>
                                c.id === cta.id ? { ...c, url: e.target.value } : c
                              );
                              updateRule(rule.id, { thankYouCtas: updated });
                            }}
                            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                            placeholder="https://example.com"
                          />
                          <button
                            onClick={() => {
                              const updated = (rule.thankYouCtas || []).filter(c => c.id !== cta.id);
                              updateRule(rule.id, { thankYouCtas: updated });
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newCta: ThankYouCta = { id: `cta_${Date.now()}`, text: '', url: '' };
                          updateRule(rule.id, { thankYouCtas: [...(rule.thankYouCtas || []), newCta] });
                        }}
                        className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add CTA
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Thank You GIF URL (optional)</label>
                    <input
                      type="url"
                      value={rule.thankYouGifUrl || ''}
                      onChange={(e) => updateRule(rule.id, { thankYouGifUrl: e.target.value })}
                      placeholder="https://media.giphy.com/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                    />
                    {rule.thankYouGifUrl && (
                      <img src={rule.thankYouGifUrl} alt="Thank you GIF preview" className="mt-1 max-h-16 rounded" />
                    )}
                  </div>

                  {/* Questions toggle */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-900 dark:text-white">Questions for this page</label>
                      <button
                        onClick={() => toggleCustomQuestions(rule)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          hasCustomQuestions
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {hasCustomQuestions ? 'Using Custom Questions' : 'Using Default Questions'}
                      </button>
                    </div>

                    {!hasCustomQuestions && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        This rule uses the default bot questions. Click the button above to set custom questions for this page.
                      </p>
                    )}

                    {hasCustomQuestions && rule.questions && (
                      <div className="space-y-3">
                        {rule.questions.map((q, idx) => (
                          <div key={q.id} className="flex items-start gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            <span className="text-xs text-gray-400 mt-2 w-5">{idx + 1}.</span>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={q.text}
                                onChange={(e) => updateRuleQuestion(rule.id, q.id, { text: e.target.value })}
                                placeholder="Question text"
                                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={q.columnHeader || ''}
                                  onChange={(e) => updateRuleQuestion(rule.id, q.id, { columnHeader: e.target.value })}
                                  placeholder="Column header"
                                  className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                />
                                <select
                                  value={q.type}
                                  onChange={(e) => updateRuleQuestion(rule.id, q.id, { type: e.target.value as Question['type'] })}
                                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                                >
                                  <option value="text">Text</option>
                                  <option value="email">Email</option>
                                  <option value="phone">Phone</option>
                                  <option value="select">Select</option>
                                </select>
                              </div>
                              {q.type === 'select' && (
                                <OptionsInput
                                  options={q.options || []}
                                  onChange={(options) => updateRuleQuestion(rule.id, q.id, { options })}
                                />
                              )}
                            </div>
                            <button
                              onClick={() => deleteRuleQuestion(rule.id, q.id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addRuleQuestion(rule.id)}
                          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Question
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {config.pageRules.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No page-specific rules configured. The default settings will apply to all pages.
        </div>
      )}

      <button
        onClick={addRule}
        className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Page Rule
      </button>
    </div>
  );
};
