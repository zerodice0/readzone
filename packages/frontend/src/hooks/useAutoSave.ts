import { useCallback, useEffect, useRef, useState } from 'react';

interface AutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onSave: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveReturn {
  triggerSave: (data: unknown) => void;
  saveStatus: AutoSaveStatus;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

/**
 * 자동 저장 시스템
 * 데이터 변경 시 debounced 자동 저장
 */
export function useAutoSave({
  delay = 2000,
  enabled = true,
  onSave,
  onSuccess,
  onError,
}: AutoSaveOptions): UseAutoSaveReturn {
  const lastSavedRef = useRef<string>('');
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveCallback = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      await onSave();
      setSaveStatus('saved');
      setLastSaved(new Date());
      onSuccess?.();

      // 2초 후 상태 리셋
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '저장에 실패했습니다.';

      setSaveStatus('error');
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [enabled, onSave, onSuccess, onError]);

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(saveCallback, delay);
  }, [saveCallback, delay]);

  const triggerSave = (data: unknown) => {
    const currentData = JSON.stringify(data);

    if (currentData !== lastSavedRef.current) {
      lastSavedRef.current = currentData;
      debouncedSave();
    }
  };

  return {
    triggerSave,
    saveStatus,
    isAutoSaving: saveStatus === 'saving',
    lastSaved,
    error,
  };
}

/**
 * 폼 자동 저장 훅
 * 폼 데이터 변경 시 자동 저장
 */
export function useFormAutoSave<T extends Record<string, unknown>>(
  formData: T,
  onSave: (data: T) => Promise<void>,
  options: Omit<AutoSaveOptions, 'onSave'> = {}
) {
  const autoSave = useAutoSave({
    ...options,
    onSave: () => onSave(formData),
  });

  // 폼 데이터 변경 시 자동 저장 트리거
  useEffect(() => {
    autoSave.triggerSave(formData);
  }, [formData, autoSave]);

  return autoSave;
}

/**
 * 설정 자동 저장 훅
 * 설정 변경 시 즉시 저장
 */
export function useSettingsAutoSave<T extends Record<string, unknown>>(
  settings: T,
  onSave: (data: Partial<T>) => Promise<void>,
  options: Omit<AutoSaveOptions, 'onSave'> = {}
) {
  const previousSettings = useRef<T>(settings);
  const autoSave = useAutoSave({
    delay: 500, // 설정은 더 빠르게 저장
    ...options,
    onSave: async () => {
      const changes: Partial<T> = {};

      // 변경된 필드만 추출
      Object.keys(settings).forEach((key) => {
        const typedKey = key as keyof T;

        if (settings[typedKey] !== previousSettings.current[typedKey]) {
          changes[typedKey] = settings[typedKey];
        }
      });

      if (Object.keys(changes).length > 0) {
        await onSave(changes);
        previousSettings.current = { ...settings };
      }
    },
  });

  // 설정 변경 시 자동 저장 트리거
  useEffect(() => {
    autoSave.triggerSave(settings);
  }, [settings, autoSave]);

  return autoSave;
}
