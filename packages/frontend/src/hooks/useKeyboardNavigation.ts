import { type RefObject, useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  loop?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'both';
  selector?: string;
}

/**
 * 키보드 네비게이션 훅
 * 탭 목록, 메뉴 등의 키보드 네비게이션 지원
 */
export function useKeyboardNavigation(
  items: string[],
  activeItem: string,
  onChange: (item: string) => void,
  options: KeyboardNavigationOptions = {}
) {
  const {
    enabled = true,
    loop = true,
    orientation = 'horizontal',
    selector = '[role="tablist"], [role="menu"], [role="menubar"]',
  } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // 해당 요소가 네비게이션 컨테이너 내부에 있는지 확인
      if (!target.closest(selector)) {
        return;
      }

      const currentIndex = items.indexOf(activeItem);
      let nextIndex: number;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          if (
            (orientation === 'horizontal' && e.key === 'ArrowRight') ||
            (orientation === 'vertical' && e.key === 'ArrowDown') ||
            orientation === 'both'
          ) {
            e.preventDefault();
            nextIndex = loop
              ? (currentIndex + 1) % items.length
              : Math.min(currentIndex + 1, items.length - 1);
            onChange(items[nextIndex] as string);
          }
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          if (
            (orientation === 'horizontal' && e.key === 'ArrowLeft') ||
            (orientation === 'vertical' && e.key === 'ArrowUp') ||
            orientation === 'both'
          ) {
            e.preventDefault();
            nextIndex = loop
              ? (currentIndex - 1 + items.length) % items.length
              : Math.max(currentIndex - 1, 0);
            onChange(items[nextIndex] as string);
          }
          break;

        case 'Home':
          e.preventDefault();
          onChange(items[0] as string);
          break;

        case 'End':
          e.preventDefault();
          onChange(items[items.length - 1] as string);
          break;

        case 'Enter':
        case ' ':
          // 엔터나 스페이스는 현재 항목 활성화 (이미 활성화된 경우 아무것도 하지 않음)
          e.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, activeItem, onChange, enabled, loop, orientation, selector]);
}

/**
 * 설정 탭 네비게이션 전용 훅
 */
export function useSettingsTabNavigation(
  tabs: string[],
  activeTab: string,
  onTabChange: (tab: string) => void,
  enabled = true
) {
  return useKeyboardNavigation(tabs, activeTab, onTabChange, {
    enabled,
    loop: true,
    orientation: 'horizontal',
    selector: '[role="tablist"]',
  });
}

/**
 * 메뉴 키보드 네비게이션 훅
 */
export function useMenuKeyboardNavigation(
  menuItems: string[],
  activeItem: string,
  onItemChange: (item: string) => void,
  onItemSelect?: (item: string) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (!target.closest('[role="menu"], [role="menubar"]')) {
        return;
      }

      const currentIndex = menuItems.indexOf(activeItem);
      const nextIndex = (currentIndex + 1) % menuItems.length;
      const prevIndex =
        (currentIndex - 1 + menuItems.length) % menuItems.length;
      const escEvent = new CustomEvent('menu-escape', {
        detail: activeItem,
      });

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();

          onItemChange(menuItems[nextIndex] as string);
          break;

        case 'ArrowUp':
          e.preventDefault();

          onItemChange(menuItems[prevIndex] as string);
          break;

        case 'Home':
          e.preventDefault();
          onItemChange(menuItems[0] as string);
          break;

        case 'End':
          e.preventDefault();
          onItemChange(menuItems[menuItems.length - 1] as string);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onItemSelect?.(activeItem);
          break;

        case 'Escape':
          e.preventDefault();
          // 메뉴 닫기는 상위 컴포넌트에서 처리

          document.dispatchEvent(escEvent);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuItems, activeItem, onItemChange, onItemSelect, enabled]);
}

/**
 * 포커스 트랩 훅
 * 모달, 드롭다운 등에서 포커스를 내부에 가두는 기능
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: RefObject<HTMLElement>
) {
  const focusableElementsSelector = `
    a[href],
    button:not([disabled]),
    textarea:not([disabled]),
    input:not([disabled]),
    select:not([disabled]),
    [tabindex]:not([tabindex="-1"])
  `.trim();

  const trapFocus = useCallback(() => {
    if (!containerRef.current || !isActive) {
      return;
    }

    const focusableElements = containerRef.current.querySelectorAll(
      focusableElementsSelector
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement) {
      return;
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab (역방향)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (순방향)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // 첫 번째 요소에 포커스
    firstElement.focus();

    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, isActive, focusableElementsSelector]);

  useEffect(() => {
    if (isActive) {
      return trapFocus();
    }

    return;
  }, [isActive, trapFocus]);
}

/**
 * 포커스 복원 훅
 * 모달이 닫힐 때 이전 포커스를 복원
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current?.focus) {
      previousFocusRef.current.focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
  };
}

/**
 * 키보드 단축키 훅
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void> | undefined,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const modifiers = {
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
        shift: e.shiftKey,
      };

      // 키 조합 생성
      const keyCombo = [
        modifiers.ctrl && 'ctrl',
        modifiers.meta && 'meta',
        modifiers.alt && 'alt',
        modifiers.shift && 'shift',
        key,
      ]
        .filter(Boolean)
        .join('+');

      // 단축키가 등록되어 있으면 실행
      if (shortcuts?.[keyCombo]) {
        e.preventDefault();
        shortcuts[keyCombo]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * 설정 페이지 키보드 단축키 훅
 */
export function useSettingsKeyboardShortcuts(
  onSave?: () => void,
  onReset?: () => void,
  onClose?: () => void
) {
  const shortcuts: Record<string, () => void> = {};

  if (onSave) {
    shortcuts['ctrl+s'] = onSave;
    shortcuts['meta+s'] = onSave; // macOS
  }

  if (onReset) {
    shortcuts['ctrl+r'] = onReset;
    shortcuts['meta+r'] = onReset; // macOS
  }

  if (onClose) {
    shortcuts['escape'] = onClose;
  }

  useKeyboardShortcuts(shortcuts, true);
}
