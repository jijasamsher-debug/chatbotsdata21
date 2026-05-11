import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BotConfig, BotType, KnowledgeBase } from '../../types';
import { BookOpen, Plus } from 'lucide-react';

interface StepKnowledgeBaseProps {
  config: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
  botType: BotType;
}

export const StepKnowledgeBase = ({ config, updateConfig, botType }: StepKnowledgeBaseProps) => {
  const { user } = useAuth();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [user]);

  const fetchKnowledgeBases = async () => {
    if (!user) return;

    try {
      const kbQuery = query(collection(db, 'knowledgeBases'), where('ownerId', '==', user.uid));
      const kbSnapshot = await getDocs(kbQuery);
      const kbData = kbSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KnowledgeBase[];
      setKnowledgeBases(kbData);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    } finally {
      setLoading(false);
    }
  };

  if (botType !== 'smart') {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          Knowledge base is not available for this bot type
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Knowledge Base</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Connect a knowledge base to power AI responses (optional)
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Knowledge Base
            </label>
            <select
              value={config.knowledgeBaseId || ''}
              onChange={(e) => updateConfig({ knowledgeBaseId: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">None (AI will use general knowledge only)</option>
              {knowledgeBases.map(kb => (
                <option key={kb.id} value={kb.id}>
                  {kb.name} ({kb.articles.length} articles)
                </option>
              ))}
            </select>
          </div>

          {knowledgeBases.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No knowledge bases yet</p>
              <a
                href="/dashboard/knowledge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Knowledge Base
              </a>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                The selected knowledge base articles will be used to provide context for AI responses.
                You can manage knowledge bases in the Knowledge Base section.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
