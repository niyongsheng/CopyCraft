import { useEffect } from 'react';
import { Inspector } from './components/Inspector';
import { SettingsDialog } from './components/SettingsDialog';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import { TitleBar } from './components/TitleBar';
import { isNarrowViewport } from './lib/viewport';
import { useApp } from './store/useApp';

const THEME_COLOR: Record<string, string> = {
  light: '#f4f6fa',
  dark: '#10141d',
};

export default function App() {
  const showSidebar = useApp((s) => s.showSidebar);
  const showInspector = useApp((s) => s.showInspector);
  const setSidebar = useApp((s) => s.setSidebar);
  const setInspector = useApp((s) => s.setInspector);
  const theme = useApp((s) => s.theme);
  const settingsOpen = useApp((s) => s.settingsOpen);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR[theme] ?? THEME_COLOR.dark);
    const bridge = window.desktop;
    if (bridge?.setTheme) {
      void bridge.setTheme(theme).catch(() => {
        /* older shells may not expose theming */
      });
    }
  }, [theme]);

  useEffect(() => {
    if (isNarrowViewport()) {
      setSidebar(false);
      setInspector(false);
    }
    let wasNarrow = isNarrowViewport();
    const onResize = () => {
      const narrow = isNarrowViewport();
      if (narrow && !wasNarrow) {
        setSidebar(false);
        setInspector(false);
      }
      wasNarrow = narrow;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setSidebar, setInspector]);

  return (
    <div className="app">
      <TitleBar />
      <div className="app-body">
        <Sidebar open={showSidebar} />
        <Inspector open={showInspector} />
        <Stage />
      </div>
      {settingsOpen && <SettingsDialog />}
    </div>
  );
}
