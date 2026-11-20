import type { ReactNode } from 'react';
import { FileText, Info, Lightbulb, RotateCcw, ShieldCheck } from 'lucide-react';
import { DEFAULT_CONTENT, SHEET_BY_ID, TOOL_BY_ID, textKeyFor } from '../lib/constants';
import { useApp } from '../store/useApp';
import type { SheetSettings, TextSheetType, ToolType } from '../types';
import { Section } from './controls';
import {
  InspectorCards,
  inspectorCards,
  type SettingsKey,
  type SettingsValue,
} from './inspectorSchema';

const CONTENT_HINT: Record<TextSheetType, string> = {
  hanzi: '每行一组内容，自动循环铺满整行',
  hanziWords: '每行「生字 词语1 词语2」，生字与组词一起练',
  hanziParagraph: '输入一段文字，按格子自动排版',
  name: '每行一个名字，首行用于页眉姓名卡',
  pinyin: '每行一组拼音字母，自动循环练习',
  stroke: '每行一个基本笔画',
  englishLetter: '每行一组字母或单词，自动循环练习',
  englishParagraph: '输入英文段落，自动按行排版',
  number: '每行一个数字',
  dictation: '每行一个词语，自动生成拼音和空格',
  englishWords: '每行「单词|中文」，下方自动留空白四线格',
  poem: '第一行「诗题|作者|朝代」，其后每行一句',
};

function Panel({
  open,
  title,
  subtitle,
  onReset,
  children,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onReset?: () => void;
  children: ReactNode;
}) {
  return (
    <aside
      className={`inspector ${open ? 'is-open' : 'is-closed'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="inspector-head">
        <div className="inspector-heading">
          <span className="inspector-title">{title}</span>
          <span className="inspector-subtitle">{subtitle}</span>
        </div>
        {onReset && (
          <button
            type="button"
            className="icon-btn"
            onClick={onReset}
            title="恢复默认设置"
            aria-label="恢复默认设置"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="inspector-scroll">
        {children}
        <div className="inspector-footer">
          <ShieldCheck size={13} /> 字帖内容在本地生成，不会上传
        </div>
      </div>
    </aside>
  );
}

function SheetInspector({ open }: { open: boolean }) {
  const activeType = useApp((s) => s.activeType);
  const meta = SHEET_BY_ID[activeType];
  const settings = useApp((s) => s.settingsByType[activeType]);
  const update = useApp((s) => s.update);
  const setTitle = useApp((s) => s.setTitle);
  const title = useApp((s) => s.titles[activeType]);
  const setContent = useApp((s) => s.setContent);
  const contentKey = textKeyFor(activeType);
  const content = useApp((s) => (contentKey ? s.contents[contentKey] : ''));
  const resetActive = useApp((s) => s.resetActive);

  const onChange = (key: SettingsKey, value: SettingsValue) =>
    update({ [key]: value } as Partial<SheetSettings>);

  return (
    <Panel open={open} title={meta.label} subtitle="内容与版式" onReset={resetActive}>
      {contentKey && (
        <Section label="内容" icon={<FileText size={14} />}>
          <textarea
            className="content-editor"
            value={content}
            spellCheck={false}
            aria-label="字帖内容"
            placeholder={CONTENT_HINT[contentKey]}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="editor-meta">
            <span>{CONTENT_HINT[contentKey]}</span>
            <span>{Array.from(content).length} 字</span>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => setContent(DEFAULT_CONTENT[contentKey])}
          >
            恢复示例内容
          </button>
        </Section>
      )}

      <InspectorCards
        cards={inspectorCards(meta)}
        meta={meta}
        settings={settings}
        onChange={onChange}
        title={title}
        onTitleChange={setTitle}
      />
    </Panel>
  );
}

function WorkbookInspector({ open }: { open: boolean }) {
  const workbook = useApp((s) => s.workbook);
  const exitWorkbook = useApp((s) => s.exitWorkbook);
  if (!workbook) return null;

  return (
    <Panel open={open} title="练习册" subtitle="多张字帖合成">
      <Section label="包含字帖" icon={<FileText size={14} />}>
        <div className="workbook-list">
          {workbook.sections.map((section, index) => {
            const meta = SHEET_BY_ID[section.type];
            return (
              <div className="workbook-row" key={`${section.type}-${index}`}>
                <span className="workbook-row-index">{index + 1}</span>
                <span className="workbook-row-text">
                  <strong>{section.title}</strong>
                  <small>{meta.label}</small>
                </span>
              </div>
            );
          })}
        </div>
        <p className="inspector-note">
          练习册按顺序渲染全部字帖，导出 PDF / Word 时会一次输出所有页面。修改单张字帖的设置请先退出练习册。
        </p>
        <button type="button" className="text-button" onClick={exitWorkbook}>
          退出练习册，返回单张编辑
        </button>
      </Section>
    </Panel>
  );
}

function ToolInspector({ open, tool }: { open: boolean; tool: ToolType }) {
  const meta = TOOL_BY_ID[tool];
  return (
    <Panel open={open} title={meta.label} subtitle="交互工具">
      <Section label="说明" icon={<Info size={14} />}>
        <p className="inspector-note">
          输入一个汉字，即可查看标准笔顺动画。点击「描红练习」，用鼠标或手指按照笔顺书写，写错时会给出提示。
        </p>
      </Section>
      <Section label="小提示" icon={<Lightbulb size={14} />}>
        <p className="inspector-note">
          笔顺数据来自开源项目 hanzi-writer-data，首次查询需要联网加载对应汉字的数据。
        </p>
      </Section>
    </Panel>
  );
}

export function Inspector({ open }: { open: boolean }) {
  const activeTool = useApp((s) => s.activeTool);
  const workbook = useApp((s) => s.workbook);
  if (activeTool) return <ToolInspector open={open} tool={activeTool} />;
  if (workbook) return <WorkbookInspector open={open} />;
  return <SheetInspector open={open} />;
}
