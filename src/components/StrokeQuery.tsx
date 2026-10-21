import { useEffect, useRef, useState } from 'react';
import type HanziWriterType from 'hanzi-writer';
import { Eraser, Loader2, Play, RotateCcw, Sparkles } from 'lucide-react';
import { gridTile } from '../lib/grid';
import { loadCharData } from '../lib/hanziData';
import { isHan, pinyinOf } from '../lib/pinyin';

type Mode = 'play' | 'quiz';

export function StrokeQuery() {
  const [input, setInput] = useState('永');
  const [writer, setWriter] = useState<HanziWriterType | null>(null);
  const [strokeCount, setStrokeCount] = useState<number | null>(null);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
            setError('笔顺数据加载失败，请检查网络后重试。');
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
    setError('');
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
          <div className="sq-eyebrow">笔顺查询</div>
          <h2>查一查，怎么写</h2>
          <p className="sq-desc">
            输入一个汉字，查看标准笔顺动画，也可以直接描红练习。
          </p>

          <label className="sq-label" htmlFor="stroke-char">
            汉字
          </label>
          <div className="sq-input-wrap">
            <input
              id="stroke-char"
              className="sq-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 4))}
              placeholder="输入汉字"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="sq-pinyin">{char ? pinyinOf(char) : ''}</span>
          </div>

          <div className="sq-meta">
            <span>
              笔画
              <strong>{strokeCount ?? '—'}</strong>
            </span>
            <span className="sq-source">数据 hanzi-writer</span>
          </div>

          <div className="sq-actions">
            <button type="button" className="btn btn-primary" onClick={play} disabled={!ready}>
              <Play size={14} /> 播放笔顺
            </button>
            <button type="button" className="btn" onClick={step} disabled={!ready}>
              <Sparkles size={14} /> 逐笔
            </button>
            <button type="button" className="btn" onClick={quiz} disabled={!ready}>
              <Eraser size={14} /> 描红练习
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset} disabled={!ready}>
              <RotateCcw size={14} /> 重置
            </button>
          </div>

          {quizDone && <div className="sq-success">写得很棒！笔顺全部正确。</div>}
          {error && <div className="sq-error">{error}</div>}

          <p className="sq-hint">
            提示：播放模式下可以观察每一笔的起笔与收笔；描红模式会在你描写错误时给出提示。
          </p>
        </div>

        <div className="sq-stage">
          <div className="sq-canvas">
            <div className="sq-grid" style={gridStyle} />
            <div ref={targetRef} className="sq-writer" />
            {loading && (
              <div className="sq-status">
                <Loader2 size={16} className="spin" /> 正在加载笔顺…
              </div>
            )}
            {!char && !loading && <div className="sq-status">请输入一个汉字</div>}
            {mode === 'quiz' && !loading && writer && (
              <div className="sq-mode-tag">描红模式</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
