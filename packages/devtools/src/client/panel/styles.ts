/**
 * Panel styles. Plain CSS scoped under `.pdt`, so they neither depend on nor
 * leak into the app's own styles (a public theme may have no CSS reset at all).
 * Dark and light follow the TanStack Devtools theme.
 */
export const css = `
.pdt {
  --bg: #1d1f23; --bg2: #25282d; --bg3: #2e3238; --border: #363a41;
  --fg: #e6e6e6; --muted: #8b929c; --accent: #eab308;
  --green: #22c55e; --purple: #a855f7; --blue: #3b82f6; --cyan: #06b6d4;
  --orange: #f59e0b; --red: #ef4444; --pink: #ec4899;
  --j-key: #e6e6e6; --j-str: #f59e0b; --j-num: #60a5fa; --j-bool: #c084fc; --j-null: #8b929c;
  display: flex; height: 100%; min-height: 0; background: var(--bg); color: var(--fg);
  font: 12px/1.45 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
}
.pdt[data-theme='light'] {
  --bg: #ffffff; --bg2: #f6f7f9; --bg3: #eceef2; --border: #e2e5ea;
  --fg: #1f2329; --muted: #6b7280;
  --j-key: #1f2329; --j-str: #b45309; --j-num: #1d4ed8; --j-bool: #7e22ce; --j-null: #6b7280;
}
.pdt * { box-sizing: border-box; }
.pdt button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
.pdt button:disabled { opacity: .4; cursor: default; }
.pdt code, .pdt .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }

.pdt-rail { width: 36px; flex: none; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding-top: 6px; background: var(--bg2); border-right: 1px solid var(--border); }
.pdt-rail button { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); position: relative; }
.pdt-rail button:hover { background: var(--bg3); color: var(--fg); }
.pdt-rail button[aria-pressed='true'] { color: var(--accent); background: var(--bg3); }
.pdt-rail .count { position: absolute; top: 0; right: -2px; font-size: 9px; background: var(--blue); color: #fff; border-radius: 8px; padding: 0 4px; line-height: 14px; }

.pdt-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.pdt-head { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid var(--border); min-height: 36px; }
.pdt-head h2 { font-size: 13px; font-weight: 600; margin: 0; }
.pdt-head .spacer { flex: 1; }
.pdt-btn { border: 1px solid var(--border) !important; border-radius: 6px; padding: 2px 8px; color: var(--fg); }
.pdt-btn:hover { border-color: var(--accent) !important; }
.pdt-btn[aria-pressed='true'] { border-color: var(--accent) !important; color: var(--accent); }
.pdt-body { flex: 1; min-height: 0; display: flex; }
.pdt-scroll { flex: 1; min-width: 0; overflow: auto; padding: 8px 12px; }
.pdt-side { width: 300px; flex: none; overflow: auto; border-left: 3px solid var(--accent); padding: 8px; background: var(--bg2); }
.pdt-empty { color: var(--muted); padding: 24px; text-align: center; }

.pdt-badge { display: inline-block; border-radius: 4px; padding: 0 5px; font-size: 10.5px; font-weight: 600; line-height: 16px; border: 1px solid currentColor; white-space: nowrap; }
.pdt-badge.addon { color: var(--cyan); }
.pdt-badge.app { color: var(--muted); }
.pdt-badge.M { color: var(--pink); } .pdt-badge.L { color: var(--green); } .pdt-badge.A { color: var(--orange); }
.pdt-method { font-weight: 700; font-size: 10.5px; }
.pdt-method.GET { color: var(--green); } .pdt-method.POST { color: var(--orange); }
.pdt-method.PATCH, .pdt-method.PUT { color: var(--blue); } .pdt-method.DELETE { color: var(--red); }
.pdt-status.ok { color: var(--green); } .pdt-status.redirect { color: var(--blue); } .pdt-status.err { color: var(--red); }
.pdt-muted { color: var(--muted); }

/* Active page: segment timeline */
.pdt-seg { position: relative; padding: 0 0 14px 34px; }
.pdt-seg::before { content: ''; position: absolute; left: 11px; top: 24px; bottom: 0; width: 1px; background: var(--border); }
.pdt-seg:last-child::before { display: none; }
.pdt-dot { position: absolute; left: 0; top: 0; width: 23px; height: 23px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 700; }
.pdt-dot.root { background: var(--purple); } .pdt-dot.layout { background: var(--blue); } .pdt-dot.route { background: var(--green); } .pdt-dot.index { background: var(--green); }
.pdt-seg-title { font-size: 13px; font-weight: 600; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.pdt-seg-file { color: var(--muted); }
.pdt-seg-section { margin-top: 4px; }
.pdt-seg-section > span { font-weight: 600; }

/* Timeline (right column) */
.pdt-ev { border: 1px solid var(--border); border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; background: var(--bg); }
.pdt-ev-title { display: flex; gap: 6px; align-items: center; font-weight: 600; }
.pdt-ev-title .spacer { flex: 1; }
.pdt-tag { font-size: 10px; border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; color: var(--muted); }

/* JSON tree */
.pdt-json { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; }
.pdt-json .row { padding-left: 14px; position: relative; white-space: nowrap; }
.pdt-json .toggle { position: absolute; left: 0; width: 14px; color: var(--muted); }
.pdt-json .k { color: var(--j-key); }
.pdt-json .s { color: var(--j-str); white-space: pre-wrap; word-break: break-all; }
.pdt-json .n { color: var(--j-num); } .pdt-json .b { color: var(--j-bool); } .pdt-json .z { color: var(--j-null); font-style: italic; }
.pdt-json .meta { color: var(--blue); font-style: italic; margin-left: 4px; }
.pdt-json .nest { border-left: 1px solid var(--border); margin-left: 4px; }

/* Network */
.pdt-net { display: flex; flex: 1; min-height: 0; }
.pdt-reqs { width: 46%; min-width: 320px; overflow: auto; border-right: 1px solid var(--border); }
.pdt-req { width: 100%; text-align: left; display: grid; grid-template-columns: 44px 1fr 38px 56px 80px; gap: 6px; align-items: center; padding: 3px 10px; border-bottom: 1px solid var(--border); cursor: pointer; }
.pdt-req:hover { background: var(--bg2); }
.pdt-req[aria-pressed='true'] { background: var(--bg3); box-shadow: inset 3px 0 var(--accent); }
.pdt-req .url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdt-req .dur { text-align: right; }
.pdt-bar { position: relative; height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; }
.pdt-bar > i { position: absolute; top: 0; bottom: 0; border-radius: 3px; min-width: 2px; }
.pdt-detail { flex: 1; min-width: 0; overflow: auto; padding: 8px 12px; }
.pdt-wf { display: grid; grid-template-columns: minmax(180px, 38%) 1fr 64px; gap: 4px 8px; align-items: center; }
.pdt-wf .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdt-wf .lbl.l2 { padding-left: 14px; }
.pdt-wf .lbl.l3 { padding-left: 28px; }
.pdt-wf .dur { text-align: right; }
.pdt-wf .sel { background: var(--bg3); border-radius: 4px; }
.pdt-wf button.lbl { text-align: left; padding: 1px 4px; border-radius: 4px; }
.pdt-wf button.lbl:hover { background: var(--bg3); }
.c-request { background: var(--muted); } .c-middleware { background: var(--pink); } .c-loader { background: var(--green); }
.c-action { background: var(--orange); } .c-backend { background: var(--cyan); } .c-error { background: var(--red); }
.pdt-tabs { display: flex; gap: 4px; margin: 10px 0 6px; }
.pdt-legend { display: flex; gap: 10px; color: var(--muted); font-size: 11px; margin: 4px 0 8px; }
.pdt-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }

/* Routes */
.pdt-tree .node { display: flex; align-items: center; gap: 8px; padding: 3px 6px; border-radius: 4px; }
.pdt-tree .node:hover { background: var(--bg2); }
.pdt-tree .node.active { background: var(--bg3); box-shadow: inset 3px 0 var(--accent); }
.pdt-tree .pip { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.pdt-tree .children { margin-left: 4px; padding-left: 14px; border-left: 1px solid var(--border); }
.pdt-tree .path { font-weight: 600; }
.pdt-tree .file { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdt-filter { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 2px 8px; color: var(--fg); font: inherit; }
`;
