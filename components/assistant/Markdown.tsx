import Link from "next/link";
import { Fragment } from "react";

/** Small, safe markdown renderer for advisor replies: headings, lists, tables, quotes, bold, italics, code, links. */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const isBlockStart = (l: string) => /^(#{2,4}\s|\s*[-*]\s|\s*\d+[.)]\s|\s*\||>\s?)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const Tag = h[1].length <= 3 ? "h3" : "h4";
      blocks.push(<Tag key={key++}>{inline(h[2])}</Tag>);
      i++;
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={key++} className="cp-table-wrap">
          <table>
            {head && <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>}
            <tbody>{body.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={key++}>{q.map((l, j) => <p key={j}>{inline(l)}</p>)}</blockquote>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      blocks.push(<ul key={key++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && (/^\s*\d+[.)]\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      blocks.push(<ol key={key++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) para.push(lines[i++]);
    if (para.length) blocks.push(<p key={key++}>{inline(para.join(" "))}</p>);
    else i++;
  }
  return <div className="prose-cp text-[14.5px]">{blocks}</div>;
}

function inline(s: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|(?<![\w])_([^_]+)_(?![\w])|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(<Fragment key={k++}>{s.slice(last, m.index)}</Fragment>);
    if (m[1]) {
      const href = m[2];
      if (href.startsWith("/") && !href.startsWith("//")) out.push(<Link key={k++} href={href}>{m[1]}</Link>);
      else if (/^https:\/\//.test(href)) out.push(<a key={k++} href={href} target="_blank" rel="noopener noreferrer">{m[1]}</a>);
      else out.push(<Fragment key={k++}>{m[1]}</Fragment>);
    } else if (m[3]) out.push(<strong key={k++}>{inline(m[3])}</strong>);
    else if (m[4]) out.push(<code key={k++}>{m[4]}</code>);
    else if (m[5] || m[6]) out.push(<em key={k++} className="text-ink-3">{inline(m[5] ?? m[6])}</em>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(<Fragment key={k++}>{s.slice(last)}</Fragment>);
  return out;
}
