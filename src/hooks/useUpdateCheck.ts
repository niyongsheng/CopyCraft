import { useCallback, useRef, useState } from 'react';
import { RELEASES_URL, checkForUpdates } from '../lib/updates';
import { APP_VERSION } from '../lib/version';

export type UpdatePhase = 'idle' | 'checking' | 'latest' | 'available' | 'error';

export interface UpdateState {
  phase: UpdatePhase;
  latest?: string;
  url?: string;
  message?: string;
}

const IDLE: UpdateState = { phase: 'idle' };

export function useUpdateCheck() {
  const [state, setState] = useState<UpdateState>(IDLE);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setState({ phase: 'checking' });
    try {
      const result = await checkForUpdates(APP_VERSION);
      if (result.hasUpdate && result.latest) {
        setState({ phase: 'available', latest: result.latest, url: result.url });
      } else {
        setState({ phase: 'latest', latest: result.latest ?? APP_VERSION, url: result.url });
      }
    } catch (error) {
      setState({
        phase: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      busy.current = false;
    }
  }, []);

  const openRelease = useCallback(() => {
    window.open(state.url || RELEASES_URL, '_blank', 'noopener,noreferrer');
  }, [state.url]);

  return { state, checking: state.phase === 'checking', check, openRelease };
}
