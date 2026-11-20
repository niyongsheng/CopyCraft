import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { REPO_URL } from '../lib/updates';

const REPO_BLOB = `${REPO_URL}/blob/main`;

function MarkdownLink({ href = '', children }: ComponentProps<'a'>) {
  // 相对路径指向仓库文件（如 ./THIRD_PARTY_NOTICES.md），统一转为 GitHub 地址。
  const resolved = href.startsWith('./') ? `${REPO_BLOB}/${href.slice(2)}` : href;
  return (
    <a href={resolved} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function MarkdownDoc({ children }: { children: string }) {
  return (
    <div className="markdown-doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: MarkdownLink }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
