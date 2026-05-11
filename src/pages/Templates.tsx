import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Download, X, Rocket } from 'lucide-react';

interface BotTemplate {
  id: string;
  name: string;
  description: string;
  fullDescription?: string;
  imageUrl: string;
  previewUrl?: string;
  configJson: string;
  category: string;
  createdAt: Date;
}

export const Templates = () => {
  const [templates, setTemplates] = useState<BotTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<BotTemplate | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'botTemplates'));
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      })) as BotTemplate[];
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (template: BotTemplate) => {
    if (!user) {
      navigate('/pricing');
      return;
    }
    try {
      const config = JSON.parse(template.configJson);
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template.');
    }
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="public-page-bg">
      <div className="max-w-7xl mx-auto px-3 py-8 sm:px-4 sm:py-12 md:py-16 lg:px-8">
        <div className="public-hero text-center mb-8 sm:mb-12 p-4 sm:p-8 md:p-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Bot Templates</h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Ready-made bot templates to get you started quickly. Preview, customize, and deploy in minutes.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="modern-glass-card overflow-hidden">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {searchTerm ? 'No templates match your search' : 'No templates available yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filtered.map(template => (
              <div key={template.id} className="modern-glass-card overflow-hidden group">
                {template.imageUrl && (
                  <div className="overflow-hidden">
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  {template.category && (
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mb-2 sm:mb-3">
                      {template.category}
                    </span>
                  )}
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">{template.name}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">{template.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Preview
                    </button>
                    {user ? (
                      <button
                        onClick={() => handleImport(template)}
                        className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm sm:text-base"
                      >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Download</span> JSON
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/pricing')}
                        className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm sm:text-base"
                      >
                        <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Get Started
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal — now shows full description + optional embed */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-6xl h-[100vh] sm:h-[92vh] sm:max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate pr-2">{previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {previewTemplate.fullDescription ? (
                <div
                  className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none mb-4 sm:mb-6 prose-a:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.fullDescription }}
                />
              ) : previewTemplate.description ? (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{previewTemplate.description}</p>
              ) : null}

              {previewTemplate.previewUrl && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white">
                  <iframe
                    src={previewTemplate.previewUrl}
                    className="w-full h-[70vh] sm:h-[75vh] min-h-[500px]"
                    title={`Preview ${previewTemplate.name}`}
                    allow="clipboard-write; fullscreen"
                  />
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm sm:text-base"
              >
                Close
              </button>
              {user ? (
                <button
                  onClick={() => { handleImport(previewTemplate); setPreviewTemplate(null); }}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                  Download JSON
                </button>
              ) : (
                <button
                  onClick={() => { setPreviewTemplate(null); navigate('/pricing'); }}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm sm:text-base"
                >
                  <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
