import { useCallback, useEffect, useMemo, useState } from 'react';
import { WorkspaceScreen } from '../types/casesync';

export interface ShortcutDefinition {
  id: string;
  keys: string[];
  displayKeys: string;
  label: string;
  description: string;
  category: 'Search & Controls' | 'Workspace Navigation';
  screen?: WorkspaceScreen;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  allowedScreens: WorkspaceScreen[];
  activeScreen: WorkspaceScreen;
  onNavigate: (screen: WorkspaceScreen) => void;
  onFocusSearch: () => void;
  onClearSearch: () => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onToggleNotifications: () => void;
  onCloseOverlays: () => void;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  ) {
    return true;
  }
  return Boolean(target.closest('[contenteditable="true"]'));
}

function hasActiveTextSelection(): boolean {
  if (typeof window === 'undefined') return false;
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().trim().length > 0);
}

export const SCREEN_SHORTCUT_BADGES: Partial<Record<WorkspaceScreen, string>> = {
  overview: 'Ctrl+D',
  institutions: 'Ctrl+I',
  cases: 'Ctrl+C',
  overlaps: 'Ctrl+J',
  coordination: 'Ctrl+B',
  transfers: 'Ctrl+E',
  alerts: 'Alt+A',
  reports: 'Ctrl+M',
  audit: 'Ctrl+U',
  settings: 'Ctrl+,',
};

export function useKeyboardShortcuts({
  allowedScreens,
  activeScreen,
  onNavigate,
  onFocusSearch,
  onClearSearch,
  onToggleSidebar,
  onToggleTheme,
  onToggleNotifications,
  onCloseOverlays,
}: UseKeyboardShortcutsOptions) {
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [recentShortcutToast, setRecentShortcutToast] = useState<{
    label: string;
    keys: string;
  } | null>(null);

  const triggerToast = useCallback((label: string, keys: string) => {
    setRecentShortcutToast({ label, keys });
  }, []);

  useEffect(() => {
    if (!recentShortcutToast) return;
    const timer = window.setTimeout(() => {
      setRecentShortcutToast(null);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [recentShortcutToast]);

  const navigateIfPermitted = useCallback(
    (screen: WorkspaceScreen, label: string, displayKeys: string) => {
      if (!allowedScreens.includes(screen)) return false;
      onNavigate(screen);
      triggerToast(`Navigated to ${label}`, displayKeys);
      return true;
    },
    [allowedScreens, onNavigate, triggerToast]
  );

  const shortcuts = useMemo<ShortcutDefinition[]>(() => {
    const allDefinitions: ShortcutDefinition[] = [
      // Search & Controls
      {
        id: 'focus-search',
        keys: ['Ctrl+K', 'Cmd+K', '/'],
        displayKeys: 'Ctrl + K',
        label: 'Focus Global Search',
        description:
          'Jump immediately to the global Institution & Case ID search bar',
        category: 'Search & Controls',
        action: onFocusSearch,
      },
      {
        id: 'toggle-shortcuts-help',
        keys: ['Ctrl+/', '?'],
        displayKeys: 'Ctrl + /',
        label: 'Keyboard Shortcuts Guide',
        description: 'Open or close this keyboard shortcuts reference modal',
        category: 'Search & Controls',
        action: () => setShortcutsModalOpen((prev) => !prev),
      },
      {
        id: 'toggle-sidebar',
        keys: ['Ctrl+\\', '['],
        displayKeys: 'Ctrl + \\',
        label: 'Toggle Sidebar Width',
        description: 'Collapse or expand the primary desktop navigation sidebar',
        category: 'Search & Controls',
        action: () => {
          onToggleSidebar();
          triggerToast('Toggled Sidebar', 'Ctrl + \\');
        },
      },
      {
        id: 'toggle-notifications',
        keys: ['Alt+N'],
        displayKeys: 'Alt + N',
        label: 'Toggle Notifications Popover',
        description: 'Open or close the recent operational notifications tray',
        category: 'Search & Controls',
        action: () => {
          onToggleNotifications();
          triggerToast('Toggled Notifications', 'Alt + N');
        },
      },
      {
        id: 'toggle-theme',
        keys: ['Alt+T', 'Ctrl+Shift+L'],
        displayKeys: 'Alt + T',
        label: 'Switch Light / Dark Theme',
        description: 'Toggle between Light and Dark neumorphic color themes',
        category: 'Search & Controls',
        action: () => {
          onToggleTheme();
          triggerToast('Switched Theme', 'Alt + T');
        },
      },
      {
        id: 'close-overlays',
        keys: ['Escape'],
        displayKeys: 'Esc',
        label: 'Dismiss Active Popover / Search',
        description:
          'Close open modals, notification drawers, or clear search focus',
        category: 'Search & Controls',
        action: onCloseOverlays,
      },

      // Workspace Navigation
      {
        id: 'nav-overview',
        keys: ['Ctrl+D', 'Alt+O'],
        displayKeys: 'Ctrl + D',
        label: 'Overview Dashboard',
        description: 'Open the executive summary and SLA workload dashboard',
        category: 'Workspace Navigation',
        screen: 'overview',
        action: () =>
          navigateIfPermitted('overview', 'Overview Dashboard', 'Ctrl + D'),
      },
      {
        id: 'nav-institutions',
        keys: ['Ctrl+I', 'Alt+I'],
        displayKeys: 'Ctrl + I',
        label: 'Institution Registry',
        description:
          'Browse AICTE Permanent IDs, regional directory, and risk profiles',
        category: 'Workspace Navigation',
        screen: 'institutions',
        action: () =>
          navigateIfPermitted(
            'institutions',
            'Institution Registry',
            'Ctrl + I'
          ),
      },
      {
        id: 'nav-cases',
        keys: ['Ctrl+C', 'Alt+C'],
        displayKeys: 'Ctrl + C',
        label: 'Complaint Cases',
        description:
          'Open the complaint case ledger (triggers when no text is selected)',
        category: 'Workspace Navigation',
        screen: 'cases',
        action: () =>
          navigateIfPermitted('cases', 'Complaint Cases', 'Ctrl + C'),
      },
      {
        id: 'nav-overlaps',
        keys: ['Ctrl+J', 'Alt+V'],
        displayKeys: 'Ctrl + J',
        label: 'Overlap Detection',
        description:
          'Inspect cross-Bureau duplicate & related case match candidates',
        category: 'Workspace Navigation',
        screen: 'overlaps',
        action: () =>
          navigateIfPermitted('overlaps', 'Overlap Detection', 'Ctrl + J'),
      },
      {
        id: 'nav-coordination',
        keys: ['Ctrl+B', 'Alt+B'],
        displayKeys: 'Ctrl + B',
        label: 'Bureau/Cell Coordination',
        description: 'Manage joint RB, PGRC, Approval, and Regional workflows',
        category: 'Workspace Navigation',
        screen: 'coordination',
        action: () =>
          navigateIfPermitted(
            'coordination',
            'Bureau/Cell Coordination',
            'Ctrl + B'
          ),
      },
      {
        id: 'nav-transfers',
        keys: ['Ctrl+E', 'Alt+E'],
        displayKeys: 'Ctrl + E',
        label: 'Transfers & Escalations',
        description: 'Review inter-Bureau case handoffs and SLA escalations',
        category: 'Workspace Navigation',
        screen: 'transfers',
        action: () =>
          navigateIfPermitted(
            'transfers',
            'Transfers & Escalations',
            'Ctrl + E'
          ),
      },
      {
        id: 'nav-alerts',
        keys: ['Alt+A', 'Ctrl+Shift+A'],
        displayKeys: 'Alt + A',
        label: 'Alerts & Notifications',
        description: 'Open operational SLA alerts, overlap flags, and reminders',
        category: 'Workspace Navigation',
        screen: 'alerts',
        action: () =>
          navigateIfPermitted('alerts', 'Alerts & Notifications', 'Alt + A'),
      },
      {
        id: 'nav-reports',
        keys: ['Ctrl+M', 'Alt+R'],
        displayKeys: 'Ctrl + M',
        label: 'Reports & Analytics',
        description: 'View Bureau workload, case ageing, and overlap metrics',
        category: 'Workspace Navigation',
        screen: 'reports',
        action: () =>
          navigateIfPermitted('reports', 'Reports & Analytics', 'Ctrl + M'),
      },
      {
        id: 'nav-audit',
        keys: ['Ctrl+U', 'Alt+U'],
        displayKeys: 'Ctrl + U',
        label: 'Audit Trail',
        description: 'Inspect immutable statutory and officer event logs',
        category: 'Workspace Navigation',
        screen: 'audit',
        action: () => navigateIfPermitted('audit', 'Audit Trail', 'Ctrl + U'),
      },
      {
        id: 'nav-settings',
        keys: ['Ctrl+,', 'Alt+S'],
        displayKeys: 'Ctrl + ,',
        label: 'Settings',
        description: 'Configure overlap engine weights and SLA alert thresholds',
        category: 'Workspace Navigation',
        screen: 'settings',
        action: () => navigateIfPermitted('settings', 'Settings', 'Ctrl + ,'),
      },
    ];

    return allDefinitions.filter(
      (item) => !item.screen || allowedScreens.includes(item.screen)
    );
  }, [
    allowedScreens,
    navigateIfPermitted,
    onCloseOverlays,
    onFocusSearch,
    onToggleNotifications,
    onToggleSidebar,
    onToggleTheme,
    triggerToast,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      const isShift = event.shiftKey;
      const inEditable = isEditableElement(event.target);

      // 1. Escape always closes active modals/popovers or blurs search input
      if (event.key === 'Escape') {
        if (shortcutsModalOpen) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          return;
        }
        onCloseOverlays();
        if (inEditable && event.target instanceof HTMLElement) {
          onClearSearch();
          event.target.blur();
        }
        return;
      }

      // 2. Ctrl+K / Cmd+K always focuses Global Search (even from inside an input)
      if (isCtrlOrMeta && !isAlt && !isShift && key === 'k') {
        event.preventDefault();
        setShortcutsModalOpen(false);
        onFocusSearch();
        triggerToast('Global Search Focused', 'Ctrl + K');
        return;
      }

      // 3. Ctrl+/ or Cmd+/ toggles the Keyboard Shortcuts reference modal
      if (isCtrlOrMeta && !isAlt && (event.key === '/' || event.key === '?')) {
        event.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Ignore remaining shortcuts while user is typing in an input, textarea, or select
      if (inEditable) {
        return;
      }

      // 4. Plain '/' focuses Global Search when not typing in an input
      if (!isCtrlOrMeta && !isAlt && !isShift && event.key === '/') {
        event.preventDefault();
        setShortcutsModalOpen(false);
        onFocusSearch();
        return;
      }

      // 5. Plain '?' toggles the Keyboard Shortcuts reference modal
      if (!isCtrlOrMeta && !isAlt && event.key === '?') {
        event.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 6. Plain '[' or Ctrl+\ toggles desktop sidebar collapse
      if (
        (!isCtrlOrMeta && !isAlt && !isShift && event.key === '[') ||
        (isCtrlOrMeta && !isAlt && !isShift && event.key === '\\')
      ) {
        event.preventDefault();
        onToggleSidebar();
        triggerToast('Toggled Sidebar', 'Ctrl + \\');
        return;
      }

      // 7. Ctrl+I or Alt+I -> Institution Registry
      if (
        (isCtrlOrMeta && !isAlt && !isShift && key === 'i') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 'i')
      ) {
        if (allowedScreens.includes('institutions')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted(
            'institutions',
            'Institution Registry',
            'Ctrl + I'
          );
        }
        return;
      }

      // 8. Ctrl+C or Alt+C -> Complaint Cases
      // Crucial: Preserve native Ctrl+C copy whenever the user has highlighted text on the page
      if (isCtrlOrMeta && !isAlt && !isShift && key === 'c') {
        if (hasActiveTextSelection()) {
          return; // Let native browser copy run unimpeded
        }
        if (allowedScreens.includes('cases')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('cases', 'Complaint Cases', 'Ctrl + C');
        }
        return;
      }
      if (isAlt && !isCtrlOrMeta && !isShift && key === 'c') {
        if (allowedScreens.includes('cases')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('cases', 'Complaint Cases', 'Alt + C');
        }
        return;
      }

      // 9. Ctrl+D or Alt+O -> Overview Dashboard
      if (
        (isCtrlOrMeta && !isAlt && !isShift && key === 'd') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 'o')
      ) {
        if (allowedScreens.includes('overview')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('overview', 'Overview Dashboard', 'Ctrl + D');
        }
        return;
      }

      // 10. Ctrl+J or Alt+V -> Overlap Detection
      if (
        (isCtrlOrMeta && !isAlt && !isShift && key === 'j') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 'v')
      ) {
        if (allowedScreens.includes('overlaps')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('overlaps', 'Overlap Detection', 'Ctrl + J');
        }
        return;
      }

      // 11. Ctrl+B or Alt+B -> Bureau/Cell Coordination
      if (
        (isCtrlOrMeta && !isAlt && !isShift && key === 'b') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 'b')
      ) {
        if (allowedScreens.includes('coordination')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted(
            'coordination',
            'Bureau/Cell Coordination',
            'Ctrl + B'
          );
        }
        return;
      }

      // 12. Ctrl+E or Alt+E -> Transfers & Escalations
      if (
        (isCtrlOrMeta && !isAlt && !isShift && key === 'e') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 'e')
      ) {
        if (allowedScreens.includes('transfers')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted(
            'transfers',
            'Transfers & Escalations',
            'Ctrl + E'
          );
        }
        return;
      }

      // 13. Alt+A or Ctrl+Shift+A -> Alerts & Notifications
      if (
        (isAlt && !isCtrlOrMeta && !isShift && key === 'a') ||
        (isCtrlOrMeta && !isAlt && isShift && key === 'a')
      ) {
        if (allowedScreens.includes('alerts')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('alerts', 'Alerts & Notifications', 'Alt + A');
        }
        return;
      }

      // 14. Ctrl+M or Alt+R -> Reports & Analytics
      if (
        (isCtrlOrMeta && !isAlt && !isShift && key === 'm') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 'r')
      ) {
        if (allowedScreens.includes('reports')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('reports', 'Reports & Analytics', 'Ctrl + M');
        }
        return;
      }

      // 15. Ctrl+U or Alt+U -> Audit Trail
      if (
        (isCtrlOrMeta && !isAlt && !isShift && key === 'u') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 'u')
      ) {
        if (allowedScreens.includes('audit')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('audit', 'Audit Trail', 'Ctrl + U');
        }
        return;
      }

      // 16. Ctrl+, or Alt+S -> Settings
      if (
        (isCtrlOrMeta && !isAlt && !isShift && event.key === ',') ||
        (isAlt && !isCtrlOrMeta && !isShift && key === 's')
      ) {
        if (allowedScreens.includes('settings')) {
          event.preventDefault();
          setShortcutsModalOpen(false);
          navigateIfPermitted('settings', 'Settings', 'Ctrl + ,');
        }
        return;
      }

      // 17. Alt+T or Ctrl+Shift+L -> Toggle Light / Dark Theme
      if (
        (isAlt && !isCtrlOrMeta && !isShift && key === 't') ||
        (isCtrlOrMeta && !isAlt && isShift && key === 'l')
      ) {
        event.preventDefault();
        onToggleTheme();
        triggerToast('Switched Theme', 'Alt + T');
        return;
      }

      // 18. Alt+N -> Toggle Notifications Popover
      if (isAlt && !isCtrlOrMeta && !isShift && key === 'n') {
        event.preventDefault();
        onToggleNotifications();
        triggerToast('Toggled Notifications', 'Alt + N');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeScreen,
    allowedScreens,
    navigateIfPermitted,
    onClearSearch,
    onCloseOverlays,
    onFocusSearch,
    onToggleNotifications,
    onToggleSidebar,
    onToggleTheme,
    shortcutsModalOpen,
    triggerToast,
  ]);

  return {
    shortcuts,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    recentShortcutToast,
    dismissShortcutToast: () => setRecentShortcutToast(null),
  };
}
