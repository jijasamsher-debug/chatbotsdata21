import { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

interface StepEmbedCodeProps {
  botId: string;
}

export const StepEmbedCode = ({ botId }: StepEmbedCodeProps) => {
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const widgetUrl = `${window.location.origin}/widget/${botId}`;

  const iframeCode = `<iframe
  src="${widgetUrl}"
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 999999;"
></iframe>`;

  const scriptCode = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${widgetUrl}';
    iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;';
    document.body.appendChild(iframe);
  })();
</script>`;

  const copyToClipboard = (text: string, type: 'iframe' | 'script' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'iframe') {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Script Integrate - Connect Bot to Site</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose one of the integration methods below to add your chatbot to your website
      </p>

      <div className="space-y-6">
        <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold text-gray-900 dark:text-white">
              Option 1: IFrame Embed (Recommended)
            </label>
            <button
              onClick={() => copyToClipboard(iframeCode, 'iframe')}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              {copiedIframe ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{iframeCode}</code>
          </pre>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Add this code anywhere in your HTML, preferably before the closing {'</body>'} tag.
          </p>
        </div>

        <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold text-gray-900 dark:text-white">
              Option 2: Script Tag
            </label>
            <button
              onClick={() => copyToClipboard(scriptCode, 'script')}
              className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              {copiedScript ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{scriptCode}</code>
          </pre>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Add this code before the closing {'</body>'} tag. The script will inject the widget automatically.
          </p>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start">
            <Code className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Installation Instructions
              </h4>
              <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                <li>Copy one of the code snippets above</li>
                <li>Paste it into your website's HTML</li>
                <li>The chatbot will appear in the bottom-right corner</li>
                <li>Test it on your website to ensure it works correctly</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold text-gray-900 dark:text-white">
              Widget URL (Direct Link)
            </label>
            <button
              onClick={() => copyToClipboard(widgetUrl, 'url')}
              className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy URL
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-2">
            <code>{widgetUrl}</code>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Use this URL to test your widget or share it directly with users.
          </p>
          <a
            href={widgetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            Open Widget in New Tab
          </a>
        </div>
      </div>
    </div>
  );
};
