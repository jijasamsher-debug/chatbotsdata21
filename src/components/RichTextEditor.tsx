import { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Highlighter, Link, Type, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder = 'Start writing...', minHeight = '300px' }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Only set the HTML when the external value differs from the editor's current
  // content (e.g. on initial load or when value is reset externally).
  // This prevents cursor jumping to the top on every keystroke.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCmd = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = window.getSelection()?.toString() || prompt('Enter link text:') || url;
      if (window.getSelection()?.toString()) {
        execCmd('createLink', url);
      } else {
        execCmd('insertHTML', `<a href="${url}" target="_blank" style="color:#3b82f6;text-decoration:underline;">${text}</a>`);
      }
    }
  };

  const insertCTAButton = () => {
    const text = prompt('Button text:', 'Click Here');
    const url = prompt('Button URL:', 'https://');
    if (text && url) {
      const color = prompt('Button color (hex):', '#3b82f6') || '#3b82f6';
      const html = `<a href="${url}" target="_blank" style="display:inline-block;padding:10px 24px;background:${color};color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">${text}</a>`;
      execCmd('insertHTML', html);
    }
  };

  const changeFontSize = (size: string) => {
    execCmd('fontSize', '7');
    // Replace font size 7 with actual px
    if (editorRef.current) {
      const fonts = editorRef.current.querySelectorAll('font[size="7"]');
      fonts.forEach(el => {
        const span = document.createElement('span');
        span.style.fontSize = size;
        span.innerHTML = el.innerHTML;
        el.replaceWith(span);
      });
      onChange(editorRef.current.innerHTML);
    }
  };

  const changeFont = (font: string) => {
    execCmd('fontName', font);
  };

  const highlight = () => {
    execCmd('hiliteColor', '#fef08a');
  };

  const changeColor = () => {
    const color = prompt('Text color (hex):', '#000000');
    if (color) execCmd('foreColor', color);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600">
        {/* Font Family */}
        <select
          onChange={e => changeFont(e.target.value)}
          defaultValue=""
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="" disabled>Font</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
          <option value="Impact">Impact</option>
        </select>

        {/* Font Size */}
        <select
          onChange={e => changeFontSize(e.target.value)}
          defaultValue=""
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="" disabled>Size</option>
          <option value="12px">Small</option>
          <option value="16px">Normal</option>
          <option value="20px">Large</option>
          <option value="24px">X-Large</option>
          <option value="32px">Heading</option>
          <option value="40px">Title</option>
        </select>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button onClick={() => execCmd('bold')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('italic')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('underline')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Underline">
          <Type className="w-4 h-4" />
        </button>
        <button onClick={highlight} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Highlight">
          <Highlighter className="w-4 h-4" />
        </button>
        <button onClick={changeColor} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Text Color">
          <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">A</span>
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button onClick={() => execCmd('justifyLeft')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('justifyCenter')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('justifyRight')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Align Right">
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Bullet List">
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button onClick={insertLink} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" title="Insert Link">
          <Link className="w-4 h-4" />
        </button>
        <button onClick={insertCTAButton} className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium border border-gray-300 dark:border-gray-600" title="Insert CTA Button">
          CTA Button
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none overflow-y-auto prose dark:prose-invert max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};
