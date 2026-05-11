import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Plus, CreditCard as Edit, Trash2, X, Save } from 'lucide-react';
import { KnowledgeBase as KBType, Article } from '../types';

export const KnowledgeBase = () => {
  const { user } = useAuth();
  const [knowledgeBases, setKnowledgeBases] = useState<KBType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKB, setEditingKB] = useState<KBType | null>(null);
  const [kbName, setKbName] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);

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
      })) as KBType[];
      setKnowledgeBases(kbData);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewKBModal = () => {
    setEditingKB(null);
    setKbName('');
    setArticles([]);
    setShowModal(true);
  };

  const openEditKBModal = (kb: KBType) => {
    setEditingKB(kb);
    setKbName(kb.name);
    setArticles(kb.articles);
    setShowModal(true);
  };

  const addArticle = () => {
    const newArticle: Article = {
      id: `article_${Date.now()}`,
      title: '',
      content: '',
      tags: []
    };
    setArticles([...articles, newArticle]);
  };

  const updateArticle = (id: string, updates: Partial<Article>) => {
    setArticles(articles.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteArticle = (id: string) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  const saveKnowledgeBase = async () => {
    if (!user || !kbName.trim()) return;

    try {
      const id = editingKB?.id || `kb_${Date.now()}`;
      const kbData = {
        ownerId: user.uid,
        name: kbName,
        articles
      };

      await setDoc(doc(db, 'knowledgeBases', id), kbData);
      setShowModal(false);
      fetchKnowledgeBases();
    } catch (error) {
      console.error('Error saving knowledge base:', error);
      alert('Failed to save knowledge base');
    }
  };

  const deleteKnowledgeBase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) return;

    try {
      await deleteDoc(doc(db, 'knowledgeBases', id));
      setKnowledgeBases(knowledgeBases.filter(kb => kb.id !== id));
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      alert('Failed to delete knowledge base');
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Knowledge Base</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage knowledge base articles for your bots</p>
          </div>
          <button
            onClick={openNewKBModal}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Knowledge Base
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : knowledgeBases.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No knowledge bases yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a knowledge base to power your bots with custom information
            </p>
            <button
              onClick={openNewKBModal}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Knowledge Base
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{kb.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {kb.articles.length} article{kb.articles.length !== 1 ? 's' : ''}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditKBModal(kb)}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => deleteKnowledgeBase(kb.id)}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingKB ? 'Edit Knowledge Base' : 'New Knowledge Base'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Knowledge Base Name
                </label>
                <input
                  type="text"
                  value={kbName}
                  onChange={(e) => setKbName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Product Documentation"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Articles</label>
                  <button
                    onClick={addArticle}
                    className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Article
                  </button>
                </div>

                <div className="space-y-4">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={article.title}
                            onChange={(e) => updateArticle(article.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Article title"
                          />
                          <textarea
                            value={article.content}
                            onChange={(e) => updateArticle(article.id, { content: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Article content"
                          />
                          <input
                            type="text"
                            value={article.tags.join(', ')}
                            onChange={(e) =>
                              updateArticle(article.id, {
                                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="Tags (comma separated)"
                          />
                        </div>
                        <button
                          onClick={() => deleteArticle(article.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {articles.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No articles yet. Click "Add Article" to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveKnowledgeBase}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Knowledge Base
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
