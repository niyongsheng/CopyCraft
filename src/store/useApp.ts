import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import {
  detectLanguage,
  type Language,
} from '../i18n';
import {
  DEFAULT_CONTENT,
  SHEETS,
  defaultSettingsFor,
  defaultTitleFor,
  textKeyFor,
} from '../lib/constants';
import type { SheetPreset, WorkbookPreset } from '../lib/presets';
import { isNarrowViewport } from '../lib/viewport';
import type { SheetSettings, SheetType, TextSheetType, ThemeMode, ToolType } from '../types';

const defaultSettingsByType = Object.fromEntries(
  SHEETS.map((s) => [s.id, defaultSettingsFor(s.id)]),
) as Record<SheetType, SheetSettings>;

const defaultTitles = Object.fromEntries(
  SHEETS.map((s) => [s.id, defaultTitleFor(s.id)]),
) as Record<SheetType, string>;

const initialContents = { ...DEFAULT_CONTENT } as Record<TextSheetType, string>;

/*
 * The persisted slice holds every sheet's content, settings and title, so
 * serialising it on each keystroke or slider step is expensive. Keep the last
 * state object and only stringify + write it once per burst.
 */
let pendingWrite: { name: string; value: StorageValue<PersistedAppState> } | null = null;
let writeTimer: number | undefined;

function flushPendingWrite() {
  window.clearTimeout(writeTimer);
  if (!pendingWrite) return;
  localStorage.setItem(pendingWrite.name, JSON.stringify(pendingWrite.value));
  pendingWrite = null;
}

const batchedStorage: PersistStorage<PersistedAppState> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StorageValue<PersistedAppState>;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    pendingWrite = { name, value };
    window.clearTimeout(writeTimer);
    writeTimer = window.setTimeout(flushPendingWrite, 300);
  },
  removeItem: (name) => {
    pendingWrite = null;
    window.clearTimeout(writeTimer);
    localStorage.removeItem(name);
  },
};

window.addEventListener('pagehide', flushPendingWrite);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushPendingWrite();
});

interface AppState {
  activeType: SheetType;
  activeTool: ToolType | null;
  settingsByType: Record<SheetType, SheetSettings>;
  titles: Record<SheetType, string>;
  contents: Record<TextSheetType, string>;
  seed: number;
  showInspector: boolean;
  showSidebar: boolean;
  theme: ThemeMode;
  language: Language;
  settingsOpen: boolean;
  /** 模板库弹窗；不持久化。 */
  presetOpen: boolean;
  /** 练习册模式；不持久化，退出后回到单张字帖。 */
  workbook: WorkbookPreset | null;
  setActiveType: (type: SheetType) => void;
  openTool: (tool: ToolType) => void;
  update: (patch: Partial<SheetSettings>) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  shuffle: () => void;
  setInspector: (open: boolean) => void;
  setSidebar: (open: boolean) => void;
  toggleInspector: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setSettingsOpen: (open: boolean) => void;
  setPresetOpen: (open: boolean) => void;
  applyPreset: (preset: SheetPreset) => void;
  applyWorkbook: (preset: WorkbookPreset) => void;
  exitWorkbook: () => void;
  resetActive: () => void;
}

type PersistedAppState = Pick<
  AppState,
  | 'activeType'
  | 'activeTool'
  | 'settingsByType'
  | 'titles'
  | 'contents'
  | 'seed'
  | 'theme'
  | 'language'
>;

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      activeType: 'name',
      activeTool: null,
      settingsByType: defaultSettingsByType,
      titles: defaultTitles,
      contents: initialContents,
      seed: 20240521,
      showInspector: true,
      showSidebar: true,
      theme: 'dark',
      language: detectLanguage(),
      settingsOpen: false,
      presetOpen: false,
      workbook: null,

      setActiveType: (type) =>
        set({ activeType: type, activeTool: null, workbook: null }),

      openTool: (tool) => set({ activeTool: tool, workbook: null }),

      update: (patch) =>
        set((state) => ({
          settingsByType: {
            ...state.settingsByType,
            [state.activeType]: { ...state.settingsByType[state.activeType], ...patch },
          },
        })),

      setTitle: (title) =>
        set((state) => ({ titles: { ...state.titles, [state.activeType]: title } })),

      setContent: (content) =>
        set((state) => {
          const key = textKeyFor(state.activeType);
          if (!key) return {};
          return { contents: { ...state.contents, [key]: content } };
        }),

      shuffle: () => set({ seed: Math.floor(Math.random() * 1_000_000_000) }),

      setInspector: (open) => set({ showInspector: open }),

      setSidebar: (open) => set({ showSidebar: open }),

      toggleInspector: () =>
        set((state) => {
          const showInspector = !state.showInspector;
          return {
            showInspector,
            showSidebar: showInspector && isNarrowViewport() ? false : state.showSidebar,
          };
        }),

      toggleSidebar: () =>
        set((state) => {
          const showSidebar = !state.showSidebar;
          return {
            showSidebar,
            showInspector: showSidebar && isNarrowViewport() ? false : state.showInspector,
          };
        }),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setSettingsOpen: (open) => set({ settingsOpen: open }),

      setPresetOpen: (open) => set({ presetOpen: open }),

      applyPreset: (preset) =>
        set((state) => {
          const key = textKeyFor(preset.type);
          return {
            activeType: preset.type,
            activeTool: null,
            workbook: null,
            presetOpen: false,
            titles: { ...state.titles, [preset.type]: preset.pageTitle },
            settingsByType: {
              ...state.settingsByType,
              [preset.type]: {
                ...defaultSettingsFor(preset.type),
                ...preset.settings,
              },
            },
            contents: key
              ? { ...state.contents, [key]: preset.content }
              : state.contents,
          };
        }),

      applyWorkbook: (preset) =>
        set({ workbook: preset, activeTool: null, presetOpen: false }),

      exitWorkbook: () => set({ workbook: null }),

      resetActive: () =>
        set((state) => ({
          settingsByType: {
            ...state.settingsByType,
            [state.activeType]: defaultSettingsFor(state.activeType),
          },
          titles: { ...state.titles, [state.activeType]: defaultTitleFor(state.activeType) },
        })),
    }),
    {
      name: 'copycraft',
      version: 3,
      storage: batchedStorage,
      migrate: (persisted, version): PersistedAppState => {
        let state = persisted as {
          activeType?: string;
          contents?: Record<string, string>;
        } & Record<string, unknown>;
        if (version < 2 && state?.activeType === 'strokeQuery') {
          state = { ...state, activeType: 'name', activeTool: 'strokeQuery' };
        }
        if (version < 3 && state?.contents?.name === '王小明\n小明') {
          state = {
            ...state,
            contents: { ...state.contents, name: '倪希米\n希米' },
          };
        }
        return state as PersistedAppState;
      },
      partialize: (state): PersistedAppState => ({
        activeType: state.activeType,
        activeTool: state.activeTool,
        settingsByType: state.settingsByType,
        titles: state.titles,
        contents: state.contents,
        seed: state.seed,
        theme: state.theme,
        language: state.language,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const mergedSettings = Object.fromEntries(
          SHEETS.map((s) => [
            s.id,
            { ...defaultSettingsByType[s.id], ...(p.settingsByType?.[s.id] ?? {}) },
          ]),
        ) as Record<SheetType, SheetSettings>;
        const mergedTitles = Object.fromEntries(
          SHEETS.map((s) => [s.id, p.titles?.[s.id] ?? defaultTitles[s.id]]),
        ) as Record<SheetType, string>;
        return {
          ...current,
          ...p,
          settingsByType: mergedSettings,
          titles: mergedTitles,
          contents: { ...current.contents, ...(p.contents ?? {}) },
        };
      },
    },
  ),
);
