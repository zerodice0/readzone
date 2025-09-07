import { useLocalStorage } from './useLocalStorage';

export interface EditorPreferences {
  showShortcutGuide: boolean;
  showFloatingToolbar: boolean;
  showSmartHelper: boolean;
  editorMode: 'markdown' | 'wysiwyg' | 'hybrid';
}

const DEFAULT_PREFERENCES: EditorPreferences = {
  showShortcutGuide: false, // 기본적으로 숨김 (사용자가 필요할 때 활성화)
  showFloatingToolbar: true,
  showSmartHelper: true,
  editorMode: 'hybrid',
};

export function useEditorPreferences() {
  const [preferences, setPreferences] = useLocalStorage<EditorPreferences>(
    'readzone-editor-preferences',
    DEFAULT_PREFERENCES
  );

  const updatePreference = <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}
