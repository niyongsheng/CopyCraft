import type { ReactNode } from 'react';
import { fontStack } from '../lib/fonts';
import type { SheetSettings } from '../types';

export function PageFrame({
  settings,
  title,
  children,
  aside,
  framed = false,
}: {
  settings: SheetSettings;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
  framed?: boolean;
}) {
  const titleSize = Math.round(Math.min(34, Math.max(17, settings.titleHeight * 0.44)));
  return (
    <div
      className="sheet-page"
      style={{
        paddingTop: settings.vMargin,
        paddingBottom: settings.vMargin,
        paddingLeft: settings.hMargin,
        paddingRight: settings.hMargin,
      }}
    >
      {settings.showTitle && (
        <div className="sheet-header" style={{ height: settings.titleHeight }}>
          <div
            className="sheet-title"
            style={{
              fontFamily: fontStack(settings.fontId),
              fontSize: titleSize,
              fontWeight: Math.min(600, Math.max(400, settings.fontWeight)),
              color: settings.inkColor,
            }}
          >
            {title}
          </div>
          {aside && <div className="sheet-aside">{aside}</div>}
        </div>
      )}
      <div className="sheet-body">
        {framed && (
          <div
            className="content-outline"
            style={{ borderColor: settings.borderColor }}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    </div>
  );
}
