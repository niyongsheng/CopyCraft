import { useEffect, useState } from 'react';
import { useApp } from '../store/useApp';
import { SheetStage } from './stages/SheetStage';
import { ToolStage } from './stages/ToolStage';

export function Stage() {
  const activeTool = useApp((s) => s.activeTool);
  const toolVisible = Boolean(activeTool);
  const [toolMounted, setToolMounted] = useState(toolVisible);

  useEffect(() => {
    if (toolVisible) setToolMounted(true);
  }, [toolVisible]);

  return (
    <>
      {!toolVisible && <SheetStage />}
      {(toolMounted || toolVisible) && <ToolStage active={toolVisible} />}
    </>
  );
}
