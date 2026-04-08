import type { SourceLocation } from '../types';

type EditorType = 'vscode' | 'cursor' | 'webstorm';

const STORAGE_KEY = 'rune-devtools-editor';

const EDITOR_URLS: Record<EditorType, (loc: SourceLocation) => string> = {
  vscode: (loc) => `vscode://file${loc.file}:${loc.line}${loc.column ? ':' + loc.column : ''}`,
  cursor: (loc) => `cursor://file${loc.file}:${loc.line}${loc.column ? ':' + loc.column : ''}`,
  webstorm: (loc) => `webstorm://open?file=${encodeURIComponent(loc.file)}&line=${loc.line}${loc.column ? '&column=' + loc.column : ''}`,
};

function getSavedEditor(): EditorType | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in EDITOR_URLS) return saved as EditorType;
  } catch { /* ignore */ }
  return null;
}

function saveEditor(editor: EditorType): void {
  try { localStorage.setItem(STORAGE_KEY, editor); } catch { /* ignore */ }
}

function showEditorPicker(onSelect: (editor: EditorType) => void): void {
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2147483647; display: flex; align-items: center; justify-content: center;';

  const dialog = document.createElement('div');
  dialog.style.cssText =
    "background: #1e1e2e; border-radius: 12px; padding: 20px; min-width: 260px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); font-family: system-ui, sans-serif; color: #e0e0e0;";

  const title = document.createElement('div');
  title.textContent = 'Open in Editor';
  title.style.cssText = 'font-size: 14px; font-weight: 600; margin-bottom: 12px;';
  dialog.appendChild(title);

  const editors: { id: EditorType; label: string }[] = [
    { id: 'vscode', label: 'VS Code' },
    { id: 'cursor', label: 'Cursor' },
    { id: 'webstorm', label: 'WebStorm' },
  ];

  for (const { id, label } of editors) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'display: block; width: 100%; padding: 8px 14px; margin-bottom: 6px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e0e0e0; font-size: 13px; cursor: pointer; text-align: left;';
    btn.addEventListener('mouseover', () => { btn.style.borderColor = '#1c75ff'; });
    btn.addEventListener('mouseout', () => { btn.style.borderColor = 'rgba(255,255,255,0.1)'; });
    btn.addEventListener('click', () => {
      overlay.remove();
      saveEditor(id);
      onSelect(id);
    });
    dialog.appendChild(btn);
  }

  // Cancel
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText =
    'display: block; width: 100%; padding: 6px; margin-top: 4px; background: none; border: none; color: #666; font-size: 12px; cursor: pointer;';
  cancelBtn.addEventListener('click', () => overlay.remove());
  dialog.appendChild(cancelBtn);

  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

export function openInEditor(location: SourceLocation): void {
  const saved = getSavedEditor();
  if (saved) {
    window.open(EDITOR_URLS[saved](location), '_self');
  } else {
    showEditorPicker((editor) => {
      window.open(EDITOR_URLS[editor](location), '_self');
    });
  }
}

export function hasSourceLocation(snapshot: { sourceLocation?: SourceLocation | null }): boolean {
  return !!snapshot.sourceLocation?.file;
}
