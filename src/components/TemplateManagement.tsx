import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash2, Eye, Save, X } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface BotTemplate {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  imageUrl: string;
  previewUrl?: string;
  configJson: string;
  category: string;
  createdAt: Date;
}

export const TemplateManagement = () => {
  const [templates, setTemplates] = useState<BotTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    fullDescription: '',
    imageUrl: '',
    previewUrl: '',
    configJson: '',
    category: ''
  });

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

  const resetForm = () => {
    setForm({ name: '', description: '', fullDescription: '', imageUrl: '', previewUrl: '', configJson: '', category: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.configJson) {
      alert('Name and JSON config are required');
      return;
    }
    try {
      JSON.parse(form.configJson);
    } catch {
      alert('Invalid JSON in config field');
      return;
    }

    try {
      const id = editingId || crypto.randomUUID();
      await setDoc(doc(db, 'botTemplates', id), {
        name: form.name,
        description: form.description,
        fullDescription: form.fullDescription,
        imageUrl: form.imageUrl,
        previewUrl: form.previewUrl,
        configJson: form.configJson,
        category: form.category,
        createdAt: editingId ? templates.find(t => t.id === editingId)?.createdAt || new Date() : new Date()
      });
      alert(editingId ? 'Template updated!' : 'Template created!');
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleEdit = (template: BotTemplate) => {
    setForm({
      name: template.name,
      description: template.description,
      fullDescription: template.fullDescription || '',
      imageUrl: template.imageUrl,
      previewUrl: template.previewUrl || '',
      configJson: template.configJson,
      category: template.category
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await deleteDoc(doc(db, 'botTemplates', id));
      setTemplates(templates.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete template');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading templates...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bot Templates</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingId ? 'Edit Template' : 'New Template'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="e.g. Lead Generation Bot"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="e.g. Lead Gen, Support, Sales"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description (shown on card)</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Brief one-liner shown on the template card"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Description (shown on preview — supports rich text)</label>
              <RichTextEditor
                value={form.fullDescription}
                onChange={html => setForm({ ...form, fullDescription: html })}
                placeholder="Write a detailed description with formatting, links, CTA buttons..."
                minHeight="200px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="https://..."
              />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="mt-2 h-20 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preview URL (embed)</label>
              <input
                type="url"
                value={form.previewUrl}
                onChange={e => setForm({ ...form, previewUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="https://your-preview-url.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bot Config JSON *</label>
              <textarea
                value={form.configJson}
                onChange={e => setForm({ ...form, configJson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                rows={8}
                placeholder='{"theme":{...}, "welcomeMessage":"Hello!", ...}'
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No templates yet. Click "Add Template" to create one.</p>
      ) : (
        <div className="space-y-4">
          {templates.map(template => (
            <div key={template.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {template.imageUrl && (
                <img src={template.imageUrl} alt={template.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{template.description}</p>
                {template.category && (
                  <span className="inline-block text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full mt-1">
                    {template.category}
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {template.previewUrl && (
                  <button onClick={() => setPreviewUrl(template.previewUrl!)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleEdit(template)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(template.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Template Preview</h3>
              <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe src={previewUrl} className="w-full h-full min-h-[500px]" title="Template Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
