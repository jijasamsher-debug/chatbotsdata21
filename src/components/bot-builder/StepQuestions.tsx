import { useState } from 'react';
import { Plus, Trash2, GripVertical, MessageSquare, Image, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import { BotConfig, Question, FollowUpMessage, FollowUpCta } from '../../types';

interface StepQuestionsProps {
  config: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
}

const OptionsInput = ({ options, onChange }: { options: string[]; onChange: (opts: string[]) => void }) => {
  const [raw, setRaw] = useState(options.join(', '));

  return (
    <input
      type="text"
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
      }}
      onBlur={() => {
        const parsed = raw.split(',').map(o => o.trim()).filter(Boolean);
        onChange(parsed);
        setRaw(parsed.join(', '));
      }}
      placeholder="Options (comma separated, e.g. Yes, No, Maybe)"
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
    />
  );
};

const CtasEditor = ({ ctas, onChange }: { ctas: FollowUpCta[]; onChange: (ctas: FollowUpCta[]) => void }) => {
  const add = () => onChange([...ctas, { id: `cta_${Date.now()}`, text: '', url: '' }]);
  const update = (id: string, updates: Partial<FollowUpCta>) =>
    onChange(ctas.map(c => (c.id === id ? { ...c, ...updates } : c)));
  const remove = (id: string) => onChange(ctas.filter(c => c.id !== id));

  return (
    <div className="mt-1 pl-3 border-l border-purple-200 dark:border-purple-800 space-y-1.5">
      <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <LinkIcon className="w-3 h-3" /> CTAs (optional)
      </p>
      {ctas.map((cta) => (
        <div key={cta.id} className="flex gap-1.5">
          <input
            type="text"
            value={cta.text}
            onChange={(e) => update(cta.id, { text: e.target.value })}
            placeholder="Button text"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
          />
          <input
            type="url"
            value={cta.url}
            onChange={(e) => update(cta.id, { url: e.target.value })}
            placeholder="https://..."
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs dark:bg-gray-700 dark:text-white"
          />
          <button onClick={() => remove(cta.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline">
        <Plus className="w-3 h-3" /> Add CTA
      </button>
    </div>
  );
};

const FollowUpMessagesEditor = ({
  messages,
  onChange,
  label,
}: {
  messages: FollowUpMessage[];
  onChange: (msgs: FollowUpMessage[]) => void;
  label?: string;
}) => {
  const addMessage = () => {
    onChange([...messages, { id: `fm_${Date.now()}`, text: '', ctas: [] }]);
  };

  const updateMessage = (id: string, updates: Partial<FollowUpMessage>) => {
    onChange(messages.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMessage = (id: string) => {
    onChange(messages.filter(m => m.id !== id));
  };

  return (
    <div className="mt-2 pl-4 border-l-2 border-blue-200 dark:border-blue-800 space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        {label || 'Follow-up messages (sent after user answers)'}
      </p>
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={msg.text}
              onChange={(e) => updateMessage(msg.id, { text: e.target.value })}
              placeholder="Follow-up message text..."
              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => removeMessage(msg.id)}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <Image className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="url"
              value={msg.gifUrl || ''}
              onChange={(e) => updateMessage(msg.id, { gifUrl: e.target.value })}
              placeholder="GIF URL (optional, e.g. https://media.giphy.com/...)"
              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          {msg.gifUrl && (
            <div className="rounded-lg overflow-hidden max-w-[200px]">
              <img src={msg.gifUrl} alt="GIF preview" className="w-full h-auto rounded-lg" />
            </div>
          )}
          <CtasEditor
            ctas={msg.ctas || []}
            onChange={(ctas) => updateMessage(msg.id, { ctas })}
          />
        </div>
      ))}
      <button
        onClick={addMessage}
        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        <Plus className="w-3 h-3" />
        Add follow-up message
      </button>
    </div>
  );
};

export const StepQuestions = ({ config, updateConfig }: StepQuestionsProps) => {
  const [expandedFollowUps, setExpandedFollowUps] = useState<Record<string, boolean>>({});

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'text',
      required: false,
      followUpMessages: []
    };
    updateConfig({ questions: [...config.questions, newQuestion] });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    updateConfig({
      questions: config.questions.map(q => (q.id === id ? { ...q, ...updates } : q))
    });
  };

  const deleteQuestion = (id: string) => {
    updateConfig({ questions: config.questions.filter(q => q.id !== id) });
  };

  const toggleFollowUp = (id: string) => {
    setExpandedFollowUps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Questions</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Configure the questions to ask your visitors. Add follow-up messages after each answer.
      </p>

      <div className="space-y-4 mb-4">
        {config.questions.map((question) => (
          <div
            key={question.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
          >
            <div className="flex items-start gap-3">
              <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />

              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  placeholder="Question text (e.g., What is your email address?)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />

                <input
                  type="text"
                  value={question.columnHeader || ''}
                  onChange={(e) => updateQuestion(question.id, { columnHeader: e.target.value })}
                  placeholder="Column header (e.g., Email, Phone) - Optional"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />

                <div className="flex gap-3">
                  <select
                    value={question.type}
                    onChange={(e) =>
                      updateQuestion(question.id, { type: e.target.value as Question['type'] })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="text">Short Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone Number</option>
                    <option value="select">Dropdown</option>
                    <option value="multiselect">Multi Select (Checkboxes)</option>
                    <option value="date">Date Picker (Calendar)</option>
                    <option value="qualify">Qualify (CTA Buttons)</option>
                  </select>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Required</span>
                  </label>
                </div>

                <div className="flex gap-2 items-center">
                  <Image className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="url"
                    value={question.imageUrl || ''}
                    onChange={(e) => updateQuestion(question.id, { imageUrl: e.target.value })}
                    placeholder="Question image URL (optional, shown above the question)"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                {question.imageUrl && (
                  <div className="rounded-lg overflow-hidden max-w-[200px]">
                    <img src={question.imageUrl} alt="Question preview" className="w-full h-auto rounded-lg" />
                  </div>
                )}

                {(question.type === 'select' || question.type === 'multiselect' || question.type === 'qualify') && (
                  <OptionsInput
                    options={question.options || []}
                    onChange={(options) => updateQuestion(question.id, { options })}
                  />
                )}

                {question.type === 'multiselect' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                    ☑️ Users can pick multiple options via checkboxes. Selected values are saved as a comma-separated list.
                  </p>
                )}

                {question.type === 'qualify' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                    🎯 Options will appear as CTA buttons in the widget. When clicked, the selected option is sent as a text response.
                  </p>
                )}

                {question.type === 'date' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    📅 A calendar date picker will appear in the widget. The selected date is submitted as text. Great for appointment scheduling.
                  </p>
                )}

                {/* Follow-up messages toggle */}
                <button
                  onClick={() => toggleFollowUp(question.id)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Follow-up messages ({question.followUpMessages?.length || 0})
                  {expandedFollowUps[question.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {expandedFollowUps[question.id] && (
                  <>
                    <FollowUpMessagesEditor
                      messages={question.followUpMessages || []}
                      onChange={(msgs) => updateQuestion(question.id, { followUpMessages: msgs })}
                      label="Default follow-up messages (sent for any answer)"
                    />
                    {(question.type === 'select' || question.type === 'multiselect' || question.type === 'qualify') && (question.options || []).length > 0 && (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Per-option follow-ups (optional, sent in addition to the defaults)
                        </p>
                        {(question.options || []).map((opt) => (
                          <div key={opt} className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                              When user selects: <span className="text-blue-600 dark:text-blue-400">"{opt}"</span>
                            </p>
                            <FollowUpMessagesEditor
                              messages={(question.optionFollowUps || {})[opt] || []}
                              onChange={(msgs) =>
                                updateQuestion(question.id, {
                                  optionFollowUps: { ...(question.optionFollowUps || {}), [opt]: msgs },
                                })
                              }
                              label="Follow-up messages for this option"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => deleteQuestion(question.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="flex items-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Question
      </button>
    </div>
  );
};