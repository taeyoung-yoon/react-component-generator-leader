import { useState, useEffect, useRef } from 'react';

interface CodeViewProps {
  code: string;
  isStreaming?: boolean;
}

export function CodeView({ code, isStreaming = false }: CodeViewProps) {
  const [copied, setCopied] = useState(false);
  const blockRef = useRef<HTMLPreElement>(null);

  // 생성 중에는 새로 들어온 코드가 보이도록 맨 아래로 따라간다.
  useEffect(() => {
    if (isStreaming && blockRef.current) {
      blockRef.current.scrollTop = blockRef.current.scrollHeight;
    }
  }, [code, isStreaming]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-panel">
      <div className="panel-header">
        <h3>{isStreaming ? '코드 생성 중...' : '코드'}</h3>
        <button className="btn-copy" onClick={handleCopy} disabled={isStreaming}>
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <pre ref={blockRef} className={`code-block ${isStreaming ? 'code-block--streaming' : ''}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
