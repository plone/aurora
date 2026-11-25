/**
 * Panel styles. Plain CSS scoped under `.pdt`, so they neither depend on nor
 * leak into the app's own styles (a public theme may have no CSS reset at all).
 *
 * Dark mode uses the colors of TanStack Devtools' dark theme
 * (`@tanstack/devtools-ui/styles/semantic-theme`), so the panel looks like
 * part of the frame around it. Light mode uses Plone's own palette: slate
 * surfaces with Plone blue as the one accent. The frame gets the same light
 * palette from `frame-styles.ts`.
 */
export const css = `
.pdt {
  --surface: #ffffff; --subtle: #f7fafc; --elevated: #ffffff; --brand: #e6f3f9; --neutral: #eef2f5;
  --text: #0f2533; --text2: #33495a; --muted: #5f7686; --link: #00587c;
  --line: #dbe5ec; --line2: #c3d3de; --control: #5f7686; --focus: #007eb1;
  --hover: #0f25330d; --pressed: #0f25331a; --sel-fill: #007eb1; --sel-text: #ffffff;
  --ok: #1a6b34; --ok-bg: #dcf2e3; --warn: #7a5200; --warn-bg: #fdf3d0;
  --err: #a1260f; --err-bg: #fbe2db; --info: #00587c; --info-bg: #e6f3f9;
  --c-middleware: #9b4ea8; --c-loader: #3f8f4e; --c-action: #c48a0f;
  --c-backend: #3a9cc8; --c-request: #9fb3c1; --c-error: #d0452a;
  --j-key: #00587c; --j-str: #1a6b34; --j-num: #7b3f9e; --j-kw: #a1260f; --j-punct: #33495a; --j-comment: #5f7686;
  --font: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  display: flex; height: 100%; min-height: 0; background: var(--surface); color: var(--text);
  font: 14px/20px var(--font);
}
.pdt[data-theme='dark'] {
  --surface: #1f1f1f; --subtle: #1b1b1b; --elevated: #2b2b2b; --brand: #111111; --neutral: #2b2b2b;
  --text: #ffffff; --text2: #c5c3bf; --muted: #aea691; --link: #9cd5e2;
  --line: #2d2d2d; --line2: #444444; --control: #aea691; --focus: #61adbf;
  --hover: #ffffff14; --pressed: #ffffff1f; --sel-fill: #c5c3bf; --sel-text: #111111;
  --ok: #a2e1a9; --ok-bg: #1d4226; --warn: #fae884; --warn-bg: #624a00;
  --err: #edaa8d; --err-bg: #5f1a06; --info: #9cd5e2; --info-bg: #003e53;
  --c-middleware: #c56dcf; --c-loader: #69bc75; --c-action: #f4d648;
  --c-backend: #61adbf; --c-request: #6f6a5f; --c-error: #e06e49;
  --j-key: #61adbf; --j-str: #69bc75; --j-num: #c56dcf; --j-kw: #e06e49; --j-punct: #c5c3bf; --j-comment: #aea691;
}
.pdt * { box-sizing: border-box; }
.pdt button { font: inherit; color: inherit; background: none; border: 0; margin: 0; padding: 0; cursor: pointer; text-align: inherit; }
.pdt button:disabled { opacity: .4; cursor: default; }
.pdt button:focus-visible, .pdt input:focus-visible, .pdt select:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
.pdt abbr { text-decoration: none; }
.pdt .mono { font-family: var(--mono); font-size: 13px; }
.pdt-muted { color: var(--muted); }
.pdt .spacer { flex: 1; }
.pdt .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

/* Rail */
.pdt-rail { width: 44px; flex: none; display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding-top: 8px; background: var(--subtle); border-right: 1px solid var(--line); }
.pdt-rail button { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); position: relative; }
.pdt-rail button:hover { background: var(--hover); color: var(--text); }
.pdt-rail button[aria-pressed='true'] { background: var(--brand); color: var(--sel-fill); }
.pdt[data-theme='dark'] .pdt-rail button[aria-pressed='true'] { color: var(--text); }
.pdt[data-theme='dark'] .pdt-rail button[aria-pressed='true'] { background: var(--elevated); }
.pdt-rail .count { position: absolute; top: -6px; right: -7px; min-width: 18px; font-size: 11px; font-weight: 600; text-align: center;
  background: var(--sel-fill); color: var(--sel-text); border-radius: 8px; padding: 0 4px; line-height: 17px; }

/* Header bar of each tab */
.pdt-main { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
.pdt-head { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid var(--line); min-height: 40px; flex: none; }
.pdt-head h2 { font-size: 16px; line-height: 22px; font-weight: 700; margin: 0; white-space: nowrap; }
.pdt-head .count { color: var(--muted); font-weight: 500; }
.pdt-btn { border: 1px solid var(--line2) !important; border-radius: 4px; padding: 3px 8px; color: var(--text2); white-space: nowrap; }
.pdt-btn:hover { background: var(--hover) !important; }
.pdt-btn[aria-pressed='true'] { background: var(--sel-fill) !important; color: var(--sel-text); border-color: var(--sel-fill) !important; }
.pdt-input { background: var(--surface); border: 1px solid var(--line2); border-radius: 4px; padding: 3px 8px; color: var(--text); font: inherit; min-width: 0; }
.pdt-input::placeholder { color: var(--muted); }
.pdt-seg-ctl { display: inline-flex; border: 1px solid var(--line2); border-radius: 4px; overflow: hidden; flex: none; }
.pdt-seg-ctl button { padding: 3px 8px; color: var(--text2); }
.pdt-seg-ctl button + button { border-left: 1px solid var(--line2) !important; }
.pdt-seg-ctl button:hover { background: var(--hover); }
.pdt-seg-ctl button[aria-pressed='true'] { background: var(--sel-fill); color: var(--sel-text); }
.pdt-pill { display: inline-flex; align-items: center; gap: 4px; border-radius: 10px; padding: 1px 8px; font-size: 12.5px; font-weight: 500; background: var(--neutral); color: var(--text2); white-space: nowrap; }
.pdt[data-theme='dark'] .pdt-pill { background: var(--elevated); }
.pdt-pill.ok { background: var(--ok-bg); color: var(--ok); }
.pdt-pill.info { background: var(--info-bg); color: var(--info); }
.pdt-pill.err { background: var(--err-bg); color: var(--err); }
.pdt-empty { color: var(--muted); padding: 32px 16px; text-align: center; }
.pdt-label { font-size: 12.5px; font-weight: 600; letter-spacing: .4px; text-transform: uppercase; color: var(--muted); }

/* Chips and tags */
.pdt-chip { display: inline-block; border-radius: 4px; padding: 0 6px; font-size: 12.5px; line-height: 20px; font-weight: 500;
  background: var(--info-bg); color: var(--info); white-space: nowrap; }
.pdt-chip.app { background: var(--neutral); color: var(--text2); }
.pdt[data-theme='dark'] .pdt-chip.app { background: var(--elevated); }
.pdt-handlers { display: inline-flex; gap: 2px; flex: none; }
.pdt-handlers abbr { width: 18px; height: 18px; display: inline-grid; place-items: center; border-radius: 3px; font: 600 11.5px/1 var(--mono); color: #fff; }
.pdt[data-theme='dark'] .pdt-handlers abbr { color: #111; }
.pdt-handlers .M { background: var(--c-middleware); } .pdt-handlers .L { background: var(--c-loader); } .pdt-handlers .A { background: var(--c-action); }
.pdt-method { font: 600 12px/20px var(--mono); color: var(--ok); }
.pdt-method.POST { color: var(--warn); } .pdt-method.PATCH, .pdt-method.PUT { color: var(--info); } .pdt-method.DELETE { color: var(--err); }
.pdt-method.HEAD, .pdt-method.OPTIONS { color: var(--muted); }
.pdt-status { font: 500 12.5px/20px var(--mono); }
.pdt-status.ok { color: var(--ok); } .pdt-status.redirect { color: var(--info); } .pdt-status.err { color: var(--err); font-weight: 700; }

/* Active page */
.pdt-body { flex: 1; min-height: 0; display: flex; }
.pdt-scroll { flex: 1; min-width: 0; overflow: auto; padding: 12px; }
.pdt-segs { display: flex; flex-direction: column; gap: 8px; }
.pdt-segcard { position: relative; border: 1px solid var(--line); border-radius: 6px; background: var(--elevated); }
.pdt-segcard > header { display: flex; align-items: center; gap: 8px; padding: 6px 10px; }
.pdt-segcard > header .path { font: 600 14.5px/21px var(--mono); }
.pdt-segcard > header .file { color: var(--muted); }
.pdt-segcard > header .file:hover { color: var(--text2); }
.pdt-segcard .sections { border-top: 1px solid var(--line); padding: 6px 10px 8px; display: grid; gap: 6px; }
.pdt-dot { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; flex: none;
  font: 700 11.5px/1 var(--mono); background: var(--neutral); color: var(--text2); }
.pdt[data-theme='dark'] .pdt-dot:not(.root) { background: var(--surface); }
.pdt-dot.root { background: var(--sel-fill); color: var(--sel-text); }
.pdt-side { width: 300px; flex: none; overflow: auto; border-left: 1px solid var(--line); padding: 12px; background: var(--subtle); }
.pdt-side h3 { margin: 0 0 8px; }
.pdt-ev { border-left: 2px solid var(--c-request); padding: 2px 0 2px 8px; margin-bottom: 8px; }
.pdt-ev.fetch { border-color: var(--c-backend); } .pdt-ev.submit { border-color: var(--c-action); } .pdt-ev.error { border-color: var(--c-error); }
.pdt-ev-title { display: flex; gap: 6px; align-items: center; font-weight: 600; }

/* JSON tree */
.pdt-json { font-family: var(--mono); font-size: 13px; line-height: 20px; color: var(--j-punct); }
.pdt-json .row { padding-left: 14px; position: relative; white-space: nowrap; }
.pdt-json .toggle { position: absolute; left: 0; width: 14px; color: var(--muted); }
.pdt-json .toggle:hover, .pdt-json .collapsed:hover { color: var(--text); }
.pdt-json .k { color: var(--j-key); }
.pdt-json .s { color: var(--j-str); white-space: pre-wrap; word-break: break-all; }
.pdt-json .n { color: var(--j-num); } .pdt-json .b { color: var(--j-kw); } .pdt-json .z { color: var(--j-comment); font-style: italic; }
.pdt-json .meta { color: var(--j-comment); margin-left: 6px; font-style: italic; }
.pdt-json .preview { color: var(--j-comment); margin: 0 4px; }
.pdt-json .nest { border-left: 1px dotted var(--line); margin-left: 3px; }

/* Network */
.pdt-net { display: flex; flex: 1; min-height: 0; }
.pdt-reqs { width: 42%; min-width: 380px; max-width: 560px; overflow: auto; border-right: 1px solid var(--line); flex: none; }
.pdt-req { width: 100%; display: grid; grid-template-columns: 42px minmax(0, 1fr) 34px 62px 56px; gap: 8px; align-items: center;
  padding: 4px 12px; border-bottom: 1px solid var(--line); }
.pdt-req:hover { background: var(--hover); }
.pdt-req[aria-pressed='true'] { background: var(--brand); box-shadow: inset 3px 0 var(--sel-fill); }
.pdt[data-theme='dark'] .pdt-req[aria-pressed='true'] { background: var(--elevated); }
.pdt-req .url { display: flex; align-items: center; gap: 6px; min-width: 0; }
.pdt-req .url .p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdt-req .kind { font-size: 11.5px; color: var(--muted); flex: none; }
.pdt-req .api { font-size: 12px; color: var(--muted); flex: none; }
.pdt-req .dur { text-align: right; font: 12.5px/20px var(--mono); color: var(--text2); }
.pdt-bar { position: relative; height: 6px; background: var(--hover); border-radius: 3px; overflow: hidden; }
.pdt-bar > i { position: absolute; top: 0; bottom: 0; border-radius: 3px; min-width: 2px; }
.pdt-detail { flex: 1; min-width: 0; overflow: auto; display: flex; flex-direction: column; }
.pdt-detail-head { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: 10px 12px 6px; }
.pdt-detail-head .p { font: 600 14.5px/21px var(--mono); word-break: break-all; }
.pdt-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; color: var(--muted); font-size: 12.5px; padding: 0 12px 8px; }
.pdt-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; vertical-align: -0.5px; }
.pdt-wf { display: grid; grid-template-columns: minmax(220px, 42%) minmax(80px, 1fr) 66px; gap: 2px 10px; align-items: center; padding: 0 12px 12px; }
.pdt-wf .axis { display: flex; justify-content: space-between; font: 11.5px/16px var(--mono); color: var(--muted); border-bottom: 1px solid var(--line); padding-bottom: 2px; margin-bottom: 2px; }
.pdt-wf .lbl { display: flex; gap: 6px; align-items: center; min-width: 0; padding: 2px 4px; border-radius: 4px; }
.pdt-wf .lbl .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pdt-wf .lbl .kind { font-weight: 600; color: var(--text2); flex: none; }
.pdt-wf .lbl.l3 { margin-left: 16px; }
.pdt-wf button.lbl:hover { background: var(--hover); }
.pdt-wf button.lbl[aria-pressed='true'] { background: var(--sel-fill); color: var(--sel-text); }
.pdt-wf button.lbl[aria-pressed='true'] .pdt-method, .pdt-wf button.lbl[aria-pressed='true'] .pdt-status { color: inherit; }
.pdt-wf .dur { text-align: right; font: 12.5px/20px var(--mono); color: var(--text2); }
.pdt-wf .hint { grid-column: 1 / -1; color: var(--muted); padding: 6px 4px 0; }
.c-request { background: var(--c-request); } .c-middleware { background: var(--c-middleware); } .c-loader { background: var(--c-loader); }
.c-action { background: var(--c-action); } .c-backend { background: var(--c-backend); } .c-error { background: var(--c-error); }
.pdt-call { border-top: 1px solid var(--line); background: var(--subtle); flex: 1; display: flex; flex-direction: column; min-height: 160px; }
.pdt-call-head { display: flex; gap: 8px; align-items: center; padding: 8px 12px; }
.pdt-call-head .u { font: 13px/20px var(--mono); word-break: break-all; }
.pdt-facts { display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 0 12px 8px; color: var(--muted); }
.pdt-facts b { color: var(--text2); font-weight: 500; }
.pdt-call-tabs { display: flex; gap: 16px; padding: 0 12px; border-bottom: 1px solid var(--line); }
.pdt-call-tabs button { padding: 4px 0; color: var(--muted); border-bottom: 2px solid transparent !important; margin-bottom: -1px; }
.pdt-call-tabs button[aria-pressed='true'] { color: var(--text); border-bottom-color: var(--sel-fill) !important; font-weight: 600; }
.pdt-call-body { padding: 8px 12px 12px; overflow: auto; }

/* Routes */
.pdt-tree { padding: 8px 12px 12px; }
.pdt-tree .node { display: flex; align-items: center; gap: 8px; padding: 3px 8px; border-radius: 4px; min-height: 26px; }
.pdt-tree .node:hover { background: var(--hover); }
.pdt-tree .node.active { background: var(--brand); box-shadow: inset 3px 0 var(--sel-fill); }
.pdt[data-theme='dark'] .pdt-tree .node.active { background: var(--elevated); }
.pdt-tree .pip { width: 8px; height: 8px; border-radius: 50%; flex: none; border: 2px solid var(--control); }
.pdt-tree .pip.layout { border-radius: 2px; }
.pdt-tree .pip.root { background: var(--sel-fill); border-color: var(--sel-fill); }
.pdt-tree .pip.index { background: var(--control); }
.pdt-tree .children { margin-left: 11px; padding-left: 10px; border-left: 1px solid var(--line); }
.pdt-tree .path { font: 600 14px/20px var(--mono); white-space: nowrap; }
.pdt-tree .path.dim { color: var(--muted); font-weight: 500; }
.pdt-tree .file { color: var(--muted); margin-left: auto; padding-left: 12px; }
.pdt-group { margin-bottom: 12px; }
.pdt-group > h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; padding: 4px 8px; font-size: 14px; }
.pdt-group > h3 .count { color: var(--muted); font-weight: 500; }
`;
