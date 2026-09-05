import { Fragment, type ReactNode } from "react";

/** 英数字の塊（型番・規格名など。"13-in-1" "USB-C" "NA-LX113EL"） */
const ASCII_TOKEN = /[A-Za-z0-9][A-Za-z0-9\-.+/]*[A-Za-z0-9]|[A-Za-z0-9]/g;

/**
 * 製品名の英数字の塊を折り返さない。
 * 日本語見出しに text-wrap: balance / word-break: auto-phrase を効かせると、
 * 「13-in-1」がハイフンで「13-」「in-1」に割れて読めなくなるため。
 */
export function keepAscii(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(ASCII_TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    out.push(
      <span className="nb" key={i}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.map((n, i) => <Fragment key={i}>{n}</Fragment>);
}
