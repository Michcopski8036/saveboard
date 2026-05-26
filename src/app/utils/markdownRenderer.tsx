import React from 'react';

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m)
      return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{m[1]}</a>;
    return part;
  });
}

export function renderMarkdown(md: string): React.ReactNode {
  const blocks = md.split(/\n\n+/).filter(b => b.trim());

  return blocks.map((block, i) => {
    if (block.startsWith('### '))
      return (
        <h3 key={i} className="text-xl font-semibold text-gray-900 mt-8 mb-3 leading-snug">
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

    return (
      <p key={i} className="text-gray-600 leading-relaxed my-5 text-[17px]">
        {inlineFormat(block.replace(/\n/g, ' '))}
      </p>
    );
  });
}
