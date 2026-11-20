import { useEffect, useRef, useState } from 'react';
import type HanziWriterType from 'hanzi-writer';
import { Eraser, Loader2, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useT } from '../i18n/useT';
import { gridTile } from '../lib/grid';
import { loadCharData } from '../lib/hanziData';
import { isHan, pinyinOf } from '../lib/pinyin';

type Mode = 'play' | 'quiz';

export function StrokeQuery() {
  const t = useT();
  const [input, setInput] = useState('永');
  const [writer, setWriter] = useState<HanziWriterType | null>(null);
  const [strokeCount, setStrokeCount] = useState<number | null>(null);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<Mode>('play');
  const [quizDone, setQuizDone] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const loadedCharRef = useRef<string | null>(null);
  const requestRef = useRef(0);

  const char = Array.from(input).find((c) => isHan(c)) ?? '';
  const ready = Boolean(writer) && strokeCount !== null;

  /*
   * HanziWriter attaches pointer listeners to the target and to `document`
   * that are never removed, so create exactly one writer for this component
   * and switch characters through setCharacter().
   */
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    let cancelled = false;
    let instance: HanziWriterType | null = null;

    void (async () => {
      const { default: HanziWriter } = await import('hanzi-writer');
      if (cancelled) return;

      instance = new HanziWriter(target, {
        width: 280,
        height: 280,
        padding: 10,
        showOutline: true,
        showCharacter: true,
        strokeColor: '#2e2e33',
        outlineColor: '#dcdcdc',
        highlightColor: '#e5484d',
        radicalColor: null,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 160,
        strokeWidth: 2.4,
        outlineWidth: 1.4,
        charDataLoader: (c, onLoad, onError) => {
          loadCharData(c).then(onLoad).catch(onError);
        },
        onLoadCharDataError: () => {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        },
        onLoadCharDataSuccess: () => {
          if (!cancelled) setLoading(false);
        },
      });
      setWriter(instance);
    })();

    return () => {
      cancelled = true;
      instance?.cancelQuiz();
      target.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    if (!writer) return;

    writer.cancelQuiz();
    setMode('play');
    setQuizDone(false);
    setStrokeIndex(0);
    setStrokeCount(null);
    setError(false);
    const request = ++requestRef.current;

    if (!char) {
      setLoading(false);
      if (loadedCharRef.current) {
        loadedCharRef.current = null;
        try {
          void writer.hideCharacter({ duration: 0 });
        } catch {
          /* no character has been rendered yet */
        }
      }
      return;
    }

    loadedCharRef.current = null;
    setLoading(true);

    void writer
      .setCharacter(char)
      .then(() => writer.getCharacterData())
      .then((data) => {
        if (request !== requestRef.current) {
          // The input changed while this character was loading, so the writer
          // may have mounted it late. Hide it instead of showing stale text.
          void writer.hideCharacter({ duration: 0 });
          return;
        }
        loadedCharRef.current = char;
        setStrokeCount(data.strokes.length);
        setLoading(false);
        void writer.animateCharacter();
      })
      .catch(() => {
        if (request !== requestRef.current) return;
        setLoading(false);
      });
  }, [writer, char]);

  const gridStyle = {
    backgroundImage: gridTile('mi', {
      borderColor: '#e8b7b4',
      lineColor: '#e8b7b4',
      showBorder: true,
    }),
    backgroundSize: '100% 100%',
  };

  const play = () => {
    if (!writer || strokeCount === null) return;
    setMode('play');
    setQuizDone(false);
    setStrokeIndex(0);
    void writer.cancelQuiz();
    void writer.animateCharacter();
  };

  const quiz = () => {
    if (!writer || strokeCount === null) return;
    setMode('quiz');
    setQuizDone(false);
    void writer.cancelQuiz();
    writer.quiz({
      showHintAfterMisses: 2,
      highlightOnComplete: true,
      onComplete: () => {
        setQuizDone(true);
      },
    });
  };

  const step = () => {
    if (!writer || strokeCount === null) return;
    setMode('play');
    void writer.cancelQuiz();
    const next = strokeIndex % strokeCount;
    void writer.animateStroke(next);
    setStrokeIndex((s) => (s + 1) % strokeCount);
  };

  const reset = () => {
    if (!writer || strokeCount === null) return;
    void writer.cancelQuiz();
    void writer.showCharacter();
    setMode('play');
    setQuizDone(false);
    setStrokeIndex(0);
  };

  return (
    <div className="stroke-query">
      <div className="sq-panel">
        <div className="sq-side">
          <div className="sq-eyebrow">{t('stroke.eyebrow')}</div>
          <h2>{t('stroke.title')}</h2>
          <p className="sq-desc">{t('stroke.desc')}</p>

          <label className="sq-label" htmlFor="stroke-char">
            {t('stroke.char')}
          </label>
          <div className="sq-input-wrap">
            <input
              id="stroke-char"
              className="sq-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 4))}
              placeholder={t('stroke.inputPlaceholder')}
              autoComplete="off"
              spellCheck={false}
            />
            <span className="sq-pinyin">{char ? pinyinOf(char) : ''}</span>
          </div>

          <div className="sq-meta">
            <span>
              {t('stroke.strokes')}
              <strong>{strokeCount ?? '—'}</strong>
            </span>
            <span className="sq-source">{t('stroke.source')}</span>
          </div>

          <div className="sq-actions">
            <button type="button" className="btn btn-primary" onClick={play} disabled={!ready}>
              <Play size={14} /> {t('stroke.play')}
            </button>
            <button type="button" className="btn" onClick={step} disabled={!ready}>
              <Sparkles size={14} /> {t('stroke.step')}
            </button>
            <button type="button" className="btn" onClick={quiz} disabled={!ready}>
              <Eraser size={14} /> {t('stroke.quiz')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset} disabled={!ready}>
              <RotateCcw size={14} /> {t('stroke.reset')}
            </button>
          </div>

          {quizDone && <div className="sq-success">{t('stroke.success')}</div>}
          {error && <div className="sq-error">{t('stroke.loadError')}</div>}

          <p className="sq-hint">{t('stroke.hint')}</p>
        </div>

        <div className="sq-stage">
          <div className="sq-canvas">
            <div className="sq-grid" style={gridStyle} />
            <div ref={targetRef} className="sq-writer" />
            {loading && (
              <div className="sq-status">
                <Loader2 size={16} className="spin" /> {t('stroke.loading')}
              </div>
            )}
            {!char && !loading && (
              <div className="sq-status">{t('stroke.enterChar')}</div>
            )}
            {mode === 'quiz' && !loading && writer && (
              <div className="sq-mode-tag">{t('stroke.quizMode')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
