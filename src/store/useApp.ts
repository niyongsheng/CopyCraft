import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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
 * serialising it on each keystroke or slider step is expensive. Batch the
 * localStorage writes instead.
 */
let pendingWrite: { name: string; value: string } | null = null;
let writeTimer: number | undefined;

function flushPendingWrite() {
  window.clearTimeout(writeTimer);
  if (!pendingWrite) return;
  localStorage.setItem(pendingWrite.name, pendingWrite.value);
  pendingWrite = null;
}

const batchedStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    pendingWrite = { name, value };
    window.clearTimeout(writeTimer);
    writeTimer = window.setTimeout(flushPendingWrite, 300);
  },
  removeItem: (name: string) => {
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
  setSettingsOpen: (open: boolean) => void;
  setPresetOpen: (open: boolean) => void;
  applyPreset: (preset: SheetPreset) => void;
  applyWorkbook: (preset: WorkbookPreset) => void;
  exitWorkbook: () => void;
  resetActive: () => void;
}

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
      version: 2,
      storage: createJSONStorage(() => batchedStorage),
      migrate: (persisted, version) => {
        const state = persisted as { activeType?: string } & Record<string, unknown>;
        if (version < 2 && state?.activeType === 'strokeQuery') {
          return { ...state, activeType: 'name', activeTool: 'strokeQuery' };
        }
        return state;
      },
      partialize: (state) => ({
        activeType: state.activeType,
        activeTool: state.activeTool,
        settingsByType: state.settingsByType,
        titles: state.titles,
        contents: state.contents,
        seed: state.seed,
        theme: state.theme,
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
