import React from 'react';

// Recurses into bold/italic/link contents so nesting works — a linked name in
// bold ("**[Venue](https://…)**") is a link, not literal brackets.
function inlineFormat(text: string): React.ReactNode {
  // Images are matched before links: "![alt](src)" also matches the link
  // pattern, so the image alternative has to come first in the split.
  // 인라인 코드(`foo`)를 분할 패턴 맨 앞에 둔다 — 코드 안의 * 나 [ 가 굵게·링크로
  // 해석되면 안 되고, 이 갈래가 없으면 백틱이 글자 그대로 화면에 남는다.
  // 프리렌더 scripts/prerender-seo.mjs 의 inline() 과 짝이다. 한쪽만 고치지 말 것.
  const parts = text.split(/(`[^`]+`|!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded bg-gray-100 text-[0.9em]">{part.slice(1, -1)}</code>;
    const img = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img)
      return (
        <img key={i} src={img[2]} alt={img[1]} loading="lazy"
          className="rounded-xl border border-gray-100 my-6 w-full" />
      );
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{inlineFormat(part.slice(2, -2))}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{inlineFormat(part.slice(1, -1))}</em>;
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m)
      return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{inlineFormat(m[1])}</a>;
    return part;
  });
}

function splitOnHeadings(block: string): string[] {
  const out: string[] = [];
  let buffer: string[] = [];
  for (const line of block.split('\n')) {
    if (/^#{1,3} /.test(line)) {
      if (buffer.length) { out.push(buffer.join('\n')); buffer = []; }
      out.push(line);
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length) out.push(buffer.join('\n'));
  return out;
}

export function renderMarkdown(md: string): React.ReactNode {
  // A heading always starts its own block, even when the author forgot the blank
  // line around it — otherwise a heading glued to a list makes the list stop
  // looking like a list, and the whole thing renders as one paragraph.
  const blocks = md
    .split(/\n\n+/)
    .flatMap(splitOnHeadings)
    .filter(b => b.trim());

  return blocks.map((block, i) => {
    // Questions sit a step below section headings: bold and dark, but at body
    // scale, so the answer under them stays the thing you read.
    if (block.startsWith('### '))
      return (
        <h3 key={i} className="text-[17px] font-bold text-gray-900 mt-8 mb-2 leading-snug">
          {inlineFormat(block.slice(4).trim())}
        </h3>
      );

    if (block.startsWith('## '))
      return (
        <h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4 leading-snug">
          {inlineFormat(block.slice(3).trim())}
        </h2>
      );

    if (block.startsWith('# '))
      return (
        <h1 key={i} className="text-3xl font-extrabold text-gray-900 mt-10 mb-5 leading-tight">
          {inlineFormat(block.slice(2).trim())}
        </h1>
      );

    // Horizontal rule
    if (block.trim() === '---')
      return <hr key={i} className="my-10 border-gray-200" />;

    const lines = block.split('\n');

    // Numbered list
    if (lines.every(l => /^\d+\. /.test(l))) {
      return (
        <ol key={i} className="list-decimal list-outside pl-6 space-y-2 my-5 text-gray-600 leading-relaxed">
          {lines.map((l, j) => (
            <li key={j}>{inlineFormat(l.replace(/^\d+\. /, ''))}</li>
          ))}
        </ol>
      );
    }

    // Table: every line starts with |
    if (lines.every(l => l.trim().startsWith('|'))) {
      const parseRow = (line: string) =>
        line.split('|').slice(1, -1).map(cell => cell.trim());
      const isSeparator = (line: string) => /^\|[\s|:-]+\|$/.test(line.trim());

      const dataLines = lines.filter(l => !isSeparator(l));
      const [headerLine, ...bodyLines] = dataLines;
      const headers = parseRow(headerLine);

      return (
        <div key={i} className="my-8 overflow-x-auto">
          <table className="w-full text-[14px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-pink-50">
                {headers.map((h, j) => (
                  <th
                    key={j}
                    className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200 first:rounded-tl-lg last:rounded-tr-lg"
                  >
                    {inlineFormat(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyLines.map((row, j) => (
                <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {parseRow(row).map((cell, k) => (
                    <td key={k} className="px-4 py-3 border border-gray-200 text-gray-600">
                      {inlineFormat(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (lines.every(l => l.startsWith('- '))) {
      return (
        <ul key={i} className="list-disc list-outside pl-6 space-y-2 my-5 text-gray-600 leading-relaxed">
          {lines.map((l, j) => (
            <li key={j}>{inlineFormat(l.slice(2))}</li>
          ))}
        </ul>
      );
    }

    // A paragraph straight after a question is that question's answer: keep it
    // tucked under it rather than floating a full paragraph gap away.
    const answersQuestion = i > 0 && blocks[i - 1].startsWith('### ');
    return (
      <p key={i} className={answersQuestion
        ? 'text-gray-600 leading-relaxed text-[16px] mt-0 mb-6'
        : 'text-gray-600 leading-relaxed text-[17px] my-5'}>
        {inlineFormat(block.replace(/\n/g, ' '))}
      </p>
    );
  });
}
