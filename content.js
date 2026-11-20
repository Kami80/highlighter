/* Markflow live annotation engine — bundled locally, no dependencies. */
(() => {
  'use strict';
  if (globalThis.__MARKFLOW_LOADED__ || !document.body) return;
  globalThis.__MARKFLOW_LOADED__ = true;

  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = [
    { name: 'Rose', value: '#ff557e', css: 'rose' },
    { name: 'Yellow', value: '#f8cf58', css: 'yellow' },
    { name: 'Mint', value: '#53d5b0', css: 'mint' },
    { name: 'Blue', value: '#7eb9ff', css: 'blue' },
    { name: 'Violet', value: '#c59afa', css: 'violet' }
  ];
  const ICON = {
    logo: '<path d="M6 13l4 4L19 7"/>',
    highlight: '<path d="m9 11-6 6v3h9l8-8-6-6-5 5Z"/><path d="m14 6 4 4"/>',
    comment: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.5 8.5 0 0 1-4-.9L3 21l1.9-5.5a8.5 8.5 0 1 1 16.1-4Z"/>',
    pen: '<path d="m12 19 7-7 3 3-7 7-4 1 1-4Z"/><path d="m12 19-9-9 4-4 9 9"/>',
    arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
    square: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
    note: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 8h10M7 12h7M7 16h4"/>',
    eraser: '<path d="m20 20-8-8M4 14l9-9a3 3 0 0 1 4 0l3 3a3 3 0 0 1 0 4l-8 8H7l-3-3a2 2 0 0 1 0-3Z"/><path d="M12 20h9"/>',
    undo: '<path d="M3 7v6h6"/><path d="M4 13a8 8 0 1 1 2.4 6"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
    redo: '<path d="M21 7v6h-6"/><path d="M20 13a8 8 0 1 0-2.4 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    drag: '<circle cx="8" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="8" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    external: '<path d="M8 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3M12 12l9-9m-7 0h7v7"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 5.2A10.2 10.2 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.2 4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.3-1"/><path d="M10.4 10.4a2.3 2.3 0 0 0 3.2 3.2"/>',
    library: '<rect x="3" y="3" width="7" height="8" rx="1"/><rect x="14" y="3" width="7" height="8" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    sparkle: '<path d="m12 3 2.1 6.9L21 12l-6.9 2.1L12 21l-2.1-6.9L3 12l6.9-2.1L12 3Z"/>',
    command: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 8v8M15 8v8M7 11h10"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m21 16-5-5-9 9"/>',
    fold: '<path d="m6 10 6 6 6-6"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>'
  };
  const svgIcon = (name) => `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ICON.more}</svg>`;

  const host = document.createElement('div');
  host.id = 'markflow-extension-host';
  host.setAttribute('popover', 'manual');
  host.style.cssText = 'position:fixed!important;inset:0!important;margin:0!important;padding:0!important;border:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;overflow:visible!important;background:transparent!important;z-index:2147483647!important;pointer-events:none!important;';
  document.documentElement.appendChild(host);
  // A manual popover enters Chrome's top layer, above website z-index and fixed headers.
  // It is visually transparent and does not block clicking the underlying page.
  try { host.showPopover(); } catch (error) { console.debug('Markflow: top-layer fallback', error); }
  const shadow = host.attachShadow({ mode: 'open' });
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = chrome.runtime.getURL('ui.css');
  shadow.append(css);
  const root = document.createElement('div');
  root.id = 'mf-root';
  root.innerHTML = `
    <div id="mf-highlight-layer" aria-hidden="true"></div>
    <svg id="mf-canvas" aria-label="Annotation drawing surface"></svg>
    <div id="mf-pins"></div>
    <div id="mf-toolbar" class="mf-toolbar mf-hidden" role="toolbar" aria-label="Markflow annotation tools">
      <span class="mf-grip" title="Drag toolbar" aria-label="Drag toolbar">${svgIcon('drag')}</span>
      <button class="mf-tool mf-danger" data-action="clear" title="Clear all annotations" aria-label="Clear all">${svgIcon('trash')}</button>
      <button class="mf-tool" data-action="undo" title="Undo · Ctrl/⌘+Alt+Z" aria-label="Undo">${svgIcon('undo')}</button>
      <button class="mf-tool" data-action="redo" title="Redo · Ctrl/⌘+Alt+Shift+Z" aria-label="Redo">${svgIcon('redo')}</button>
      <span class="mf-divider"></span>
      <button class="mf-tool" data-tool="highlight" title="Highlight selected text" aria-label="Highlight">${svgIcon('highlight')}</button>
      <button class="mf-tool" data-action="styles" title="Highlight appearance" aria-label="Highlight appearance">${svgIcon('more')}</button>
      <button class="mf-tool" data-tool="comment" title="Comment on selected text" aria-label="Comment">${svgIcon('comment')}</button>
      <button class="mf-tool" data-tool="pen" title="Freehand pen" aria-label="Pen">${svgIcon('pen')}</button>
      <button class="mf-tool" data-tool="arrow" title="Draw arrow" aria-label="Arrow">${svgIcon('arrow')}</button>
      <button class="mf-tool" data-tool="rect" title="Draw rectangle" aria-label="Rectangle">${svgIcon('square')}</button>
      <button class="mf-tool" data-tool="note" title="Place sticky note" aria-label="Sticky note">${svgIcon('note')}</button>
      <button class="mf-tool" data-tool="image" title="Annotate an image · Click or drag on an image" aria-label="Annotate image">${svgIcon('image')}</button>
      <button class="mf-tool" data-tool="erase" title="Erase annotation" aria-label="Eraser">${svgIcon('eraser')}</button>
      <span class="mf-divider"></span>
      <button class="mf-tool mf-visibility" data-action="toggle-annotations" title="Hide annotations" aria-label="Hide annotations" aria-pressed="true">${svgIcon('eye')}</button>
      <button class="mf-tool" data-action="list" title="Show annotations" aria-label="Annotations panel">${svgIcon('list')}<span id="mf-count"></span></button>
      <button class="mf-tool" data-action="layers" title="Annotation layers" aria-label="Layers">${svgIcon('layers')}</button>
      <button class="mf-tool" data-action="reading" title="Distraction-free reading mode" aria-label="Reading mode">${svgIcon('sparkle')}</button>
      <button class="mf-tool" data-action="command" title="Command palette · Ctrl+Shift+P" aria-label="Command palette">${svgIcon('command')}</button>
      <button class="mf-tool" data-action="library" title="Open all annotations library" aria-label="Open library">${svgIcon('library')}</button>

      <button class="mf-tool mf-done" data-action="done" title="Close toolbar" aria-label="Done">${svgIcon('check')}</button>
    </div>
    <div class="mf-colors mf-hidden" id="mf-colors" aria-label="Annotation colors"></div>
    <section id="mf-panel" class="mf-panel mf-hidden" aria-label="Annotation comments">
      <header><div><span class="mf-kicker">MARKFLOW / LIBRARY</span><h2>Annotation manager</h2></div><button class="mf-icon-button" data-action="close-panel" aria-label="Close panel">${svgIcon('x')}</button></header>
      <div class="mf-manager-controls">
        <label class="mf-search-label"><span>⌕</span><input id="mf-search" aria-label="Search annotations" placeholder="Search notes and highlights…" autocomplete="off"></label>
        <div class="mf-filter-row"><select id="mf-filter" aria-label="Filter annotations"><option value="all">All types</option><option value="highlight">Highlights</option><option value="comment">Comments</option><option value="note">Sticky notes</option><option value="drawing">Drawings</option><option value="image">Image comments</option></select><select id="mf-sort" aria-label="Sort annotations"><option value="position">Page order</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="type">By type</option></select></div>
        <div class="mf-manager-layer-filter"><span>Layer</span><select id="mf-layer-filter"><option value="all">All layers</option></select></div>
        <div class="mf-manager-bottom"><div id="mf-manager-summary" class="mf-manager-summary">Saved to this device</div><button class="mf-import-button" data-action="import" title="Import existing Markflow annotations">↥ Import</button><input id="mf-import-file" class="mf-hidden" type="file" accept=".html,.htm,.json,text/html,application/json"></div>
      </div>
      <div id="mf-editor" class="mf-hidden">
        <div id="mf-draft-quote" class="mf-draft-quote"></div>
        <textarea id="mf-draft-text" rows="4" maxlength="10000" placeholder="Write a comment…"></textarea>
        <div class="mf-editor-actions"><button data-action="cancel-comment" class="mf-secondary">Cancel</button><button data-action="save-comment" class="mf-primary">Save note</button></div>
      </div>
      <div id="mf-items" class="mf-items"></div>
      <footer><span class="mf-storage-dot"></span> IndexedDB · private on this device</footer>
    </section>
    <section class="mf-note-editor mf-hidden" id="mf-note-editor" role="dialog" aria-label="Edit sticky note">
      <div class="mf-note-edit-header">
        <div class="mf-note-edit-heading"><span class="mf-note-glyph">✎</span><span>STICKY NOTE<small>Write directly on your note</small></span></div>
        <button class="mf-note-icon" data-action="cancel-note" aria-label="Close note editor">${svgIcon('x')}</button>
      </div>
      <input id="mf-note-title" class="mf-note-title" maxlength="100" placeholder="Note title (optional)" aria-label="Note title">
      <div class="mf-rich-toolbar" role="toolbar" aria-label="Note formatting"><button data-rich="bold" title="Bold" aria-label="Bold"><b>B</b></button><button data-rich="italic" title="Italic" aria-label="Italic"><i>I</i></button><button data-rich="underline" title="Underline" aria-label="Underline"><u>U</u></button><button data-rich="checklist" title="Insert checkbox line" aria-label="Insert checklist">☑</button><span class="mf-rich-divider"></span><button data-rich="insertUnorderedList" title="Bullet list" aria-label="Bullet list">☷</button><button data-rich="insertOrderedList" title="Numbered list" aria-label="Numbered list">≡</button></div>
      <div id="mf-note-rich" contenteditable="true" role="textbox" aria-label="Sticky note text" aria-multiline="true" data-placeholder="Write something worth remembering…" spellcheck="true"></div>
      <div class="mf-note-toggle-row"><label><input type="checkbox" id="mf-note-pinned"> Pin on top</label><label><input type="checkbox" id="mf-note-collapsed"> Start collapsed</label></div>
      <div class="mf-note-edit-bottom">
        <div id="mf-note-palette" class="mf-note-palette" aria-label="Sticky note color"></div>
        <span id="mf-note-count">0 characters</span>
      </div>
      <div class="mf-note-edit-actions">
        <button class="mf-note-delete mf-hidden" data-action="delete-note">Delete</button>
        <span class="mf-note-spacer"></span>
        <button class="mf-note-cancel" data-action="cancel-note">Cancel</button>
        <button class="mf-note-save" data-action="save-note">Save note ${svgIcon('check')}</button>
      </div>
    </section>
    <section id="mf-selection" class="mf-selection-popover mf-hidden" role="toolbar" aria-label="Quick annotations">
      <button data-action="quick-highlight" title="Highlight selection">${svgIcon('highlight')} <span>Highlight</span></button>
      <button data-action="quick-comment" title="Comment on selection">${svgIcon('comment')} <span>Comment</span></button>
      <button data-action="quick-copy" title="Copy selection">${svgIcon('external')}</button>
    </section>
    <section id="mf-comment-bubble" class="mf-inline-comment mf-hidden" role="dialog" aria-label="Comment thread">
      <div class="mf-inline-heading"><span class="mf-inline-dot"></span><strong>Discussion</strong><button data-action="close-bubble" aria-label="Close comment">${svgIcon('x')}</button></div>
      <div id="mf-thread" class="mf-thread"></div>
      <div class="mf-reply-box"><textarea id="mf-reply-text" rows="2" maxlength="3000" placeholder="Write a reply…" aria-label="Reply to comment"></textarea><button data-action="save-reply" title="Send reply">↗</button></div>
    </section>
    <section id="mf-highlight-styles" class="mf-style-popover mf-hidden" aria-label="Highlight appearance">
      <div class="mf-style-head"><strong>Highlight style</strong><span id="mf-opacity-label">38%</span></div>
      <div class="mf-style-options"><button data-highlight-shape="pill">Rounded</button><button data-highlight-shape="marker">Marker</button><button data-highlight-shape="underline">Underline</button></div>
      <label>Opacity <input id="mf-opacity" type="range" min="15" max="85" value="38" step="5"></label>
    </section>
    <section id="mf-layers" class="mf-layers-panel mf-hidden" aria-label="Annotation layers"><div class="mf-flyout-head"><strong>Annotation layers</strong><button data-action="close-layers" title="Close layers">×</button></div><p>Separate your research, personal notes, and reviews.</p><div id="mf-layer-list"></div><div class="mf-layer-actions"><button data-action="add-layer">＋ New layer</button></div></section>
    <section id="mf-command" class="mf-command-panel mf-hidden" role="dialog" aria-label="Command palette"><label>⌘ <input id="mf-command-input" type="search" placeholder="Type a command…" autocomplete="off" aria-label="Find commands"><kbd>ESC</kbd></label><div id="mf-command-list"></div><footer>↑ ↓ to navigate · Enter to run</footer></section>
    <section id="mf-reader" class="mf-reader mf-hidden" aria-label="Distraction-free reading"><div class="mf-reader-shell"><div class="mf-reader-head"><span>✦ MARKFLOW <b>READING MODE</b></span><button data-action="close-reading">Exit reading ×</button></div><div id="mf-reader-content"></div></div></section>
    <section id="mf-storage-warning" class="mf-storage-warning mf-hidden" role="alert"><strong>Some changes are not saved</strong><p>Another tab changed the same annotation or local storage is unavailable. Download your work before refreshing.</p><div><button data-action="save-unsaved">Save local JSON</button><button data-action="reload-saved">Reload saved notes</button></div></section>
    <div id="mf-toast" class="mf-toast mf-hidden" role="status" aria-live="polite"></div>`;
  shadow.append(root);
  const $ = (s) => shadow.querySelector(s);
  const toolbar = $('#mf-toolbar');
  const canvas = $('#mf-canvas');
  const pins = $('#mf-pins');
  const panel = $('#mf-panel');
  const selectionPopover = $('#mf-selection');
  const commentBubble = $('#mf-comment-bubble');
  const stylePopover = $('#mf-highlight-styles');
  const items = $('#mf-items');
  const editor = $('#mf-editor');
  const colorBar = $('#mf-colors');
  const highlightLayer = $('#mf-highlight-layer');
  const noteEditor = $('#mf-note-editor');
  const layerPanel=$('#mf-layers'),commandPanel=$('#mf-command'),readingPanel=$('#mf-reader');
  const NOTE_TONES = [
    {id:'butter',title:'Butter',hex:'#f7d773'},
    {id:'peach',title:'Peach',hex:'#ffad92'},
    {id:'mint',title:'Mint',hex:'#9cdec7'},
    {id:'sky',title:'Sky',hex:'#a4cefb'},
    {id:'lavender',title:'Lavender',hex:'#c4b4f9'}
  ];

  const state = {
    open: false, tool: 'highlight', color: '#ff557e',
    pageKey: '', annotations: [], history: [], redo: [], ranges: new Map(),
    drawing: null, draft: null, selectedId: null,
    panelOpen: false, annotationsVisible: true, toastTimer: null, saveTimer: null, toolbarPosition: null, highlightFrame: 0,
    quickRange: null, bubbleId: null, pendingRepairId:null, noteMovement: null, highlightShape: 'pill', highlightOpacity: .38, restored: false, restoreSeq: 0, storageQueue: Promise.resolve(),
    revision:0,persistedAnnotations:[],storageConflict:false,privacyPaused:false,
    layers:[{id:'personal',name:'Personal',color:'#ff557e'},{id:'research',name:'Research',color:'#6c93ef'},{id:'review',name:'Review',color:'#46bf9f'}],activeLayer:'personal',hiddenLayers:new Set(),commandOpen:false,reading:false,imageSelection:null
  };
  const pageKey = () => `${location.origin}${location.pathname}${location.search}`;
  // IndexedDB is opened in our extension service worker, not on the visited site's origin.
  const storeKey = () => state.pageKey;
  const uid = () => (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''));
  const isText = (node) => node && node.nodeType === Node.TEXT_NODE;
  const drawingTools = new Set(['pen', 'arrow', 'rect', 'note', 'erase']);
  const commentTypes = new Set(['comment', 'note', 'image']);
  const layerOf=a=>a.layer||'personal';
  const layerVisible=a=>!state.hiddenLayers.has(layerOf(a));
  const annotationVisible=a=>state.annotationsVisible&&layerVisible(a);

  function notify(message) {
    const el = $('#mf-toast');
    el.textContent = message;
    el.classList.remove('mf-hidden');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => el.classList.add('mf-hidden'), 3500);
  }
  function snapshotHistory() {
    state.history.push(structuredClone(state.annotations));
    if (state.history.length > 70) state.history.shift();
    state.redo = [];
    updateHistoryButtons();
  }
  function updateHistoryButtons(){
    const u=$('[data-action="undo"]'),r=$('[data-action="redo"]');
    if(u)u.disabled=!state.history.length;
    if(r)r.disabled=!state.redo.length;
  }
  function undo(){
    if(!state.history.length){notify('Nothing to undo');return;}
    state.redo.push(structuredClone(state.annotations));
    state.annotations=state.history.pop();commit();updateHistoryButtons();notify('Undone');
  }
  function redo(){
    if(!state.redo.length){notify('Nothing to redo');return;}
    state.history.push(structuredClone(state.annotations));
    state.annotations=state.redo.pop();commit();updateHistoryButtons();notify('Redone');
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  async function storeRequest(message) {
    const reply=await chrome.runtime.sendMessage(message);
    if(!reply?.ok)throw Error(reply?.error||'IndexedDB is unavailable');
    return reply;
  }
  function scheduleSave() {
    if(!state.restored)return;
    const key=storeKey();
    const snapshot=structuredClone(state.annotations);
    // Dispatch a storage message on every committed edit. Avoid a debounce
    // that would lose notes if the tab closes immediately after Save.
    // Serialize writes so an older slow write never lands after a newer one.
    state.storageQueue=state.storageQueue.catch(()=>{}).then(async()=>{
      if(state.storageConflict) return;
      const response=await storeRequest({type:'MF_DB_WRITE',key,annotations:snapshot,
        baseAnnotations:structuredClone(state.persistedAnnotations),expectedRevision:state.revision});
      if(response.conflict){state.storageConflict=true;$('#mf-storage-warning').classList.remove('mf-hidden');
        notify('Concurrent edits found. Save a local copy or reload saved notes.');return;}
      state.revision=Number.isSafeInteger(response.revision)?response.revision:state.revision+1;
      state.persistedAnnotations=structuredClone(response.annotations||snapshot);
      if(response.merged&&JSON.stringify(state.annotations)===JSON.stringify(snapshot)){
        state.annotations=structuredClone(response.annotations);commitVisuals();
        notify('Merged independent changes from another tab');
      }
    });
    state.storageQueue.catch(e=>{if(!state.storageConflict){$('#mf-storage-warning').classList.remove('mf-hidden');notify(`Save failed: ${e.message}`);}});
  }
  function commit() {
    scheduleSave(); renderHighlights(); renderCanvas(); renderPins(); renderItems(); updateVisibility();updateHistoryButtons();
  }
  async function restore() {
    const sequence=++state.restoreSeq;
    clearTimeout(state.saveTimer);
    state.restored=false;
    // Finish the previous page's queued edits before switching SPA routes.
    try{await state.storageQueue;}catch{}
    if(sequence!==state.restoreSeq)return;
    const key=pageKey();
    state.pageKey=key;
    state.restored=false;
    try {
      const result=await storeRequest({type:'MF_DB_READ',key});
      if(sequence!==state.restoreSeq)return;
      state.annotations=Array.isArray(result.annotations)?result.annotations.filter(validAnnotation):[];
      state.revision=result.revision||0;state.persistedAnnotations=structuredClone(state.annotations);state.storageConflict=false;$('#mf-storage-warning').classList.add('mf-hidden');
      if(result.migrated)notify(`Restored ${state.annotations.length} annotations from v1.4`);
    } catch(e) {if(sequence!==state.restoreSeq)return;console.error('Markflow IndexedDB load error',e);state.annotations=[];notify(`Unable to load notes: ${e.message}`);}
    state.history=[];state.redo=[];state.restored=true;state.quickRange=null;state.bubbleId=null;
    commitVisuals();updateHistoryButtons();
  }
  function validAnnotation(a) {
    return a && typeof a.id === 'string' && ['highlight','comment','note','pen','arrow','rect','image'].includes(a.type);
  }
  function commitVisuals() { renderHighlights(); renderCanvas(); renderPins(); renderItems();updateVisibility(); }

  function nodePath(node, scope = document.body) {
    const path = [];
    for (let n = node; n && n !== scope; n = n.parentNode) {
      if (!n.parentNode) return null;
      path.unshift(Array.prototype.indexOf.call(n.parentNode.childNodes, n));
    }
    let at = scope;
    for (const index of path) at = at?.childNodes[index];
    return at === node ? path : null;
  }
  function findNode(path, scope = document.body) {
    if (!Array.isArray(path) || path.length > 80) return null;
    let current = scope;
    for (const index of path) {
      if (!Number.isInteger(index) || index < 0 || index > 100000) return null;
      current = current?.childNodes[index];
      if (!current) return null;
    }
    return current;
  }
  function selectableRange() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0).cloneRange();
    if (!document.body.contains(range.startContainer) || !document.body.contains(range.endContainer)) return null;
    if (!range.toString().trim() || range.toString().length > 25000) return null;
    return range;
  }
  function anchorForRange(range) {
    const start = nodePath(range.startContainer);
    const end = nodePath(range.endContainer);
    if (!start || !end) return null;
    const s = range.startContainer;
    const e = range.endContainer;
    return {
      quote: range.toString(),
      prefix: isText(s) ? s.textContent.slice(Math.max(0, range.startOffset - 40), range.startOffset) : '',
      suffix: isText(e) ? e.textContent.slice(range.endOffset, range.endOffset + 40) : '',
      start: { path: start, offset: range.startOffset },
      end: { path: end, offset: range.endOffset }
    };
  }
  function rangeFromPath(anchor) {
    try {
      const a = findNode(anchor.start.path);
      const b = findNode(anchor.end.path);
      if (!a || !b) return null;
      const range = document.createRange();
      range.setStart(a, Math.min(anchor.start.offset, isText(a) ? a.length : a.childNodes.length));
      range.setEnd(b, Math.min(anchor.end.offset, isText(b) ? b.length : b.childNodes.length));
      if (range.collapsed || (anchor.quote && range.toString() !== anchor.quote)) return null;
      return range;
    } catch { return null; }
  }
  // Self-healing anchors: validate saved DOM paths first, then score every exact
  // quote occurrence using its original prefix/suffix. Never guess by index alone.
  function rangeByQuote(quote,anchor={}) {
    if(typeof quote!=='string'||!quote.trim()||quote.length>25000)return null;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode(node){const parent=node.parentElement;
        if(!parent||parent.closest('script,style,noscript,textarea,template,[contenteditable="true"]'))return NodeFilter.FILTER_REJECT;
        if(!node.nodeValue.trim()||parent.closest('#markflow-extension-host'))return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;}
    });
    const pieces=[];let text='',node;
    while((node=walker.nextNode())&&text.length<2_000_000){pieces.push({node,start:text.length,end:text.length+node.length});text+=node.nodeValue;}
    function getRange(start,end){const a=pieces.find(x=>x.end>start),b=pieces.find(x=>x.end>=end);if(!a||!b)return null;
      const r=document.createRange();r.setStart(a.node,start-a.start);r.setEnd(b.node,end-b.start);return r;}
    const matches=[];let at=-1;
    while(matches.length<120&&(at=text.indexOf(quote,at+1))>=0){
      const pre=anchor.prefix||'',suf=anchor.suffix||'';
      let score=0;
      for(let j=1;j<=Math.min(pre.length,60,at);j++){if(text.slice(at-j,at)===pre.slice(-j))score+=j>10?2:1;else break;}
      for(let j=1;j<=Math.min(suf.length,60,text.length-(at+quote.length));j++){if(text.slice(at+quote.length,at+quote.length+j)===suf.slice(0,j))score+=j>10?2:1;else break;}
      matches.push({at,score});
    }
    if(matches.length){matches.sort((a,b)=>b.score-a.score);return getRange(matches[0].at,matches[0].at+quote.length);}
    // Whitespace-only edits in documents are common. Allow a normalized quote
    // match, but only when unambiguous; otherwise report as unresolved.
    const q=quote.replace(/\s+/g,' ').trim();if(q.length<5||q.length>500)return null;
    const normalized=[];const source=[];let lastSpace=false;
    for(let i=0;i<text.length;i++){
      const space=/\s/.test(text[i]);if(space){if(lastSpace)continue;normalized.push(' ');source.push(i);lastSpace=true;}
      else{normalized.push(text[i]);source.push(i);lastSpace=false;}
    }
    const flat=normalized.join('');const first=flat.indexOf(q);if(first<0||flat.indexOf(q,first+1)>=0)return null;
    return getRange(source[first],source[first+q.length-1]+1);
  }
  function resolveRange(anchor){if(!anchor)return null;return rangeFromPath(anchor)||rangeByQuote(anchor.quote,anchor);}
  function addSelectedHighlight(selectedRange = null) {
    if(!state.restored){notify('Annotations are loading…');return false;}
    const range = selectedRange || state.quickRange || selectableRange();
    if (!range) return false;
    const anchor = anchorForRange(range);
    if (!anchor) return false;
    snapshotHistory();
    state.annotations.push({ id: uid(), type: 'highlight', color: state.color, layer:state.activeLayer, anchor,highlightShape:state.highlightShape,highlightOpacity:state.highlightOpacity, created: Date.now() });
    window.getSelection().removeAllRanges();hideSelection();
    commit(); notify('Highlight saved');
    return true;
  }
  function openCommentDraft(range) {
    range = range || state.quickRange || selectableRange();
    if (!range) { notify('Select some webpage text first'); return; }
    const anchor = anchorForRange(range);
    if (!anchor) { notify('This selection cannot be annotated'); return; }
    state.draft = { type: 'comment', anchor, color: state.color, layer:state.activeLayer };
    showEditor();hideSelection();
    window.getSelection()?.removeAllRanges();
  }
  function showEditor(text = '') {
    state.panelOpen = true;
    panel.classList.remove('mf-hidden');
    editor.classList.remove('mf-hidden');
    const preview = state.draft?.anchor?.quote || (state.draft?.type==='image'?'Image region comment':'Sticky note');
    $('#mf-draft-quote').textContent = preview.length > 170 ? `${preview.slice(0, 170)}…` : preview;
    $('#mf-draft-text').value = text;
    $('#mf-draft-text').focus();
    renderItems();
  }
  function saveDraft() {
    if(!state.restored){notify('Annotations are still loading…');return;}
    const text = $('#mf-draft-text').value.trim();
    if (!text || !state.draft) { notify('Write a comment first'); return; }
    snapshotHistory();
    if (state.draft.editId) {
      const original = state.annotations.find(a => a.id === state.draft.editId);
      if (original) original.text = text;
    } else {
      state.annotations.push({ id: uid(), ...state.draft, text, created: Date.now() });
    }
    closeEditor(); commit(); notify('Comment saved');
  }
  function closeEditor() { state.draft = null; editor.classList.add('mf-hidden'); }

  function cleanNoteHTML(input) {
    const source=document.createElement('template');source.innerHTML=String(input||'').slice(0,30000);
    const allowed=new Set(['B','STRONG','I','EM','U','BR','DIV','P','UL','OL','LI']);
    function cleanse(node) {
      if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.nodeValue.slice(0,12000));
      if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
      const parent=document.createDocumentFragment();
      // Never preserve page HTML attributes, scripts, URLs, styles or event handlers.
      const tag=node.tagName;
      if(['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','FORM','IMG'].includes(tag))return parent;
      const output=allowed.has(tag)?document.createElement(tag.toLowerCase()):parent;
      for(const child of [...node.childNodes])output.append(cleanse(child));
      return output;
    }
    const output=document.createElement('div');
    for(const child of [...source.content.childNodes])output.append(cleanse(child));
    return output.innerHTML;
  }
  function noteText(note){return note?.text||'';}
  function noteHTML(note){return note?.html ? cleanNoteHTML(note.html) : escapeHtml(noteText(note)).replace(/\n/g,'<br>');}
  function openNoteEditor(note = null, pos = null) {
    const x = note?.x ?? (pos?.x ?? (window.scrollX + window.innerWidth / 2));
    const y = note?.y ?? (pos?.y ?? (window.scrollY + window.innerHeight / 2));
    state.draft = {type:'note',x,y,color:note?.color || state.color,noteTone:note?.noteTone||'butter',editId:note?.id||null};
    const text = $('#mf-note-rich');
    text.innerHTML = noteHTML(note);
    $('#mf-note-title').value=note?.title||'';$('#mf-note-pinned').checked=!!note?.pinned;$('#mf-note-collapsed').checked=!!note?.collapsed;
    $('#mf-note-count').textContent = `${text.innerText.length} / 10,000`;
    $('#mf-note-editor').classList.remove('mf-hidden');
    $('#mf-note-editor').dataset.tone = state.draft.noteTone;
    $('#mf-note-editor').querySelector('.mf-note-delete').classList.toggle('mf-hidden',!note);
    // Use the actual layout size, not a guessed height: long notes and browser
    // font metrics can make the editor taller than its minimum height.
    const w = noteEditor.offsetWidth || 310;
    const h = noteEditor.offsetHeight || 390;
    const pageX = x - window.scrollX, pageY = y - window.scrollY;
    const left = Math.max(12,Math.min(window.innerWidth - w - 12,pageX + 18));
    const top = Math.max(12,Math.min(window.innerHeight - h - 12,pageY - 12));
    noteEditor.style.left = `${left}px`;
    noteEditor.style.top = `${top}px`;
    renderNotePalette();
    renderPins();
    requestAnimationFrame(()=>text.focus());
  }
  function renderNotePalette() {
    for (const b of $('#mf-note-palette').querySelectorAll('button')) {
      const on = b.dataset.noteTone === state.draft?.noteTone;
      b.classList.toggle('mf-note-tone-active',on);
      b.setAttribute('aria-pressed', String(on));
    }
  }
  function closeNoteEditor() {
    const wasNote = state.draft?.type === 'note';
    if (wasNote) state.draft = null;
    noteEditor.classList.add('mf-hidden');
    renderPins();
  }
  function saveNote() {
    if(!state.restored){notify('Annotations are still loading…');return;}
    const noteField=$('#mf-note-rich');
    const text=noteField.innerText.trim();
    const html=cleanNoteHTML(noteField.innerHTML);
    if (!text) { notify('Write something on your note first');noteField.focus();return; }
    if (state.draft?.type !== 'note') return;
    snapshotHistory();
    const a = state.draft;
    if (a.editId) {
      const existing = state.annotations.find(item => item.id === a.editId);
      if (existing) { existing.text = text; existing.html=html; existing.noteTone=a.noteTone;existing.title=$('#mf-note-title').value.trim();existing.pinned=$('#mf-note-pinned').checked;existing.collapsed=$('#mf-note-collapsed').checked; }
    } else {
      state.annotations.push({id:uid(),type:'note',x:a.x,y:a.y,w:220,h:160,color:a.color,noteTone:a.noteTone,layer:state.activeLayer,text,html,title:$('#mf-note-title').value.trim(),pinned:$('#mf-note-pinned').checked,collapsed:$('#mf-note-collapsed').checked,created:Date.now()});
    }
    state.annotationsVisible = true;
    closeNoteEditor();commit();notify('Sticky note saved');
  }
  for (const tone of NOTE_TONES) {
    const b = document.createElement('button');
    b.type='button'; b.dataset.noteTone=tone.id;b.title=tone.title;
    b.setAttribute('aria-label', `${tone.title} note`);
    b.style.background=tone.hex;
    $('#mf-note-palette').append(b);
  }
  $('#mf-note-rich').addEventListener('input',()=>{
    $('#mf-note-count').textContent=`${$('#mf-note-rich').innerText.length} / 10,000`;
  });
  shadow.addEventListener('pointerdown',e=>{if(e.target.closest('[data-rich]'))e.preventDefault();});
  shadow.addEventListener('click',e=>{
    const rich=e.target.closest('[data-rich]');if(!rich)return;
    $('#mf-note-rich').focus();
    if(rich.dataset.rich==='checklist') document.execCommand('insertText',false,'☐ ');
    else document.execCommand(rich.dataset.rich,false,null);
    $('#mf-note-count').textContent=`${$('#mf-note-rich').innerText.length} / 10,000`;
  });

  function renderHighlights() {
    if (!('highlights' in CSS) || typeof Highlight === 'undefined') return;
    for (const c of COLORS) CSS.highlights.delete(`markflow-${c.css}`);
    state.ranges.clear();
    for (const color of COLORS) {
      const ranges = [];
      for (const a of state.annotations) {
        if (a.type !== 'highlight' && a.type !== 'comment') continue;
        if(!layerVisible(a))continue;
        if (a.color !== color.value) continue;
        const range = resolveRange(a.anchor);
        if (range) { ranges.push(range); state.ranges.set(a.id, range); }
      }
      if (ranges.length && state.annotationsVisible) CSS.highlights.set(`markflow-${color.css}`, new Highlight(...ranges));
    }
    scheduleRoundedHighlights();
  }
  // Real rounded highlight backgrounds: CSS Custom Highlights do not support border-radius.
  // Rectangles follow Range.getClientRects(), without changing DOM or preventing selection.
  function scheduleRoundedHighlights() {
    if (state.highlightFrame) return;
    state.highlightFrame = requestAnimationFrame(() => {
      state.highlightFrame = 0;
      renderRoundedHighlights();
    });
  }
  function renderRoundedHighlights() {
    highlightLayer.replaceChildren();
    if (!state.annotationsVisible) return;
    const fragment = document.createDocumentFragment();
    let count = 0;
    const bounds = {width:innerWidth,height:innerHeight};
    for (const annotation of state.annotations) {
      if (!['highlight','comment'].includes(annotation.type)||!layerVisible(annotation)) continue;
      const range = state.ranges.get(annotation.id) || resolveRange(annotation.anchor);
      if (!range) continue;
      for (const rect of range.getClientRects()) {
        if (count >= 1300) break;
        if (rect.width < 2 || rect.height < 2 || rect.bottom < -12 || rect.top > bounds.height+12 || rect.right < 0 || rect.left > bounds.width) continue;
        const mark = document.createElement('span');
        const shape=annotation.highlightShape||'pill';
        mark.className = `mf-rounded-highlight mf-h-${['pill','marker','underline'].includes(shape)?shape:'pill'}`;
        mark.dataset.id=annotation.id;
        mark.style.setProperty('--mf-h-opacity',String(annotation.highlightOpacity??.38));
        mark.style.setProperty('--mf-h-color',annotation.color || '#ff557e');
        mark.style.left=`${rect.left - 2}px`;
        mark.style.top=`${shape==='underline'?rect.bottom-3:rect.top-1}px`;
        mark.style.width=`${rect.width + 4}px`;
        mark.style.height=`${shape==='underline'?3:rect.height+2}px`;
        fragment.append(mark);count++;
      }
      if (count >= 1300) break;
    }
    // Persist image regions relative to the image, even when the page resizes.
    for(const a of state.annotations){if(a.type!=='image'||!layerVisible(a))continue;
      const img=findImage(a.image);if(!img)continue;const r=img.getBoundingClientRect(),g=a.image.region||{x:0,y:0,w:1,h:1};
      const el=document.createElement('span');el.className='mf-image-region';
      el.style.left=`${r.left+g.x*r.width}px`;el.style.top=`${r.top+g.y*r.height}px`;
      el.style.width=`${g.w*r.width}px`;el.style.height=`${g.h*r.height}px`;
      el.style.setProperty('--mf-h-color',a.color||'#ff557e');fragment.append(el);
    }
    if(state.imageSelection?.rect){const el=document.createElement('span');el.className='mf-image-region mf-image-preview';
      const r=state.imageSelection.rect;el.style.left=`${r.x}px`;el.style.top=`${r.y}px`;el.style.width=`${r.w}px`;el.style.height=`${r.h}px`;fragment.append(el);}
    highlightLayer.append(fragment);
  }
  function updateHighlightHover(event) {
    if (!state.annotationsVisible)return;
    const x=event.clientX,y=event.clientY;
    let hovered=null;
    for(const a of state.annotations){
      if(!['highlight','comment'].includes(a.type)||!layerVisible(a))continue;
      const range=state.ranges.get(a.id);if(!range)continue;
      if([...range.getClientRects()].some(r=>x>=r.left-2&&x<=r.right+2&&y>=r.top-2&&y<=r.bottom+2)){hovered=a.id;break;}
    }
    if(hovered!==state.hoveredId){state.hoveredId=hovered;highlightLayer.querySelectorAll('.mf-rounded-highlight').forEach(el=>el.classList.toggle('mf-highlight-hover',el.dataset.id===hovered));}
  }
  document.addEventListener('mousemove',event=>{if(state.open&&!event.composedPath().includes(host))updateHighlightHover(event);},{passive:true});
  document.addEventListener('click',event=>{
    if(!state.open||event.composedPath().includes(host)||!state.annotationsVisible)return;
    if(event.target.closest('a,button,input,textarea,[contenteditable]'))return;
    const a=state.annotations.find(a=>a.id===state.hoveredId&&a.type==='comment');
    if(a)showCommentBubble(a.id);
  },true);
  function updateVisibility() {
    root.classList.toggle('mf-annotations-hidden', !state.annotationsVisible);
    const b = shadow.querySelector('[data-action="toggle-annotations"]');
    b.innerHTML = svgIcon(state.annotationsVisible?'eye':'eyeOff');
    b.title = state.annotationsVisible ? 'Hide annotations' : 'Show annotations';
    b.setAttribute('aria-label',b.title);
    b.setAttribute('aria-pressed',String(state.annotationsVisible));
    canvas.classList.toggle('mf-interactive', state.annotationsVisible && state.open && drawingTools.has(state.tool));
    if (!state.annotationsVisible) highlightLayer.replaceChildren();
    else scheduleRoundedHighlights();
  }
  function toggleAnnotations() {
    state.annotationsVisible = !state.annotationsVisible;
    if (!state.annotationsVisible) {
      state.panelOpen=false;panel.classList.add('mf-hidden');closeEditor();closeNoteEditor();
    }
    renderHighlights();renderCanvas();renderPins();updateVisibility();
    chrome.storage.local.set({'markflow:annotations-visible':state.annotationsVisible}).catch(()=>{});
    notify(state.annotationsVisible?'Annotations visible':'Annotations hidden · Nothing deleted');
  }
  // The registered highlights are in the main document, not Shadow DOM.
  const highlightStyle = document.createElement('style');
  highlightStyle.id = 'markflow-text-highlight-styles';
  highlightStyle.textContent = COLORS.map(c => `::highlight(markflow-${c.css}){background-color:transparent;color:inherit;text-decoration:none;}`).join('\n');
  (document.head || document.documentElement).append(highlightStyle);

  function svgEl(name, attrs = {}) {
    const el = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    return el;
  }
  function distanceToSegment(x,y,ax,ay,bx,by) {
    const dx=bx-ax, dy=by-ay;
    const t=dx*dx+dy*dy ? Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy))) : 0;
    return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));
  }
  function drawAnnotation(a) {
    const points = a.points || [];
    if (!points.length) return;
    const x = window.scrollX, y = window.scrollY;
    const props = { stroke: a.color || '#ff557e', 'stroke-width': '3.4', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    let shape;
    if (a.type === 'pen') {
      shape = svgEl('path', { ...props, d: points.map((p,i)=>`${i?'L':'M'}${(p.x-x).toFixed(1)} ${(p.y-y).toFixed(1)}`).join(' ') });
    } else if (a.type === 'rect') {
      const s = points[0], e = points[points.length-1];
      shape = svgEl('rect', { ...props, x:Math.min(s.x,e.x)-x, y:Math.min(s.y,e.y)-y, width:Math.abs(e.x-s.x),height:Math.abs(e.y-s.y) });
    } else if (a.type === 'arrow') {
      const s=points[0], e=points[points.length-1], angle=Math.atan2(e.y-s.y,e.x-s.x), len=13;
      const left={x:e.x-len*Math.cos(angle-.52), y:e.y-len*Math.sin(angle-.52)};
      const right={x:e.x-len*Math.cos(angle+.52), y:e.y-len*Math.sin(angle+.52)};
      shape = svgEl('path', { ...props, d:`M${s.x-x} ${s.y-y} L${e.x-x} ${e.y-y} M${left.x-x} ${left.y-y} L${e.x-x} ${e.y-y} L${right.x-x} ${right.y-y}` });
    }
    if (shape) canvas.append(shape);
  }
  function renderCanvas() {
    canvas.replaceChildren();
    if (!state.annotationsVisible) return;
    canvas.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    for (const a of state.annotations) if (['pen','rect','arrow'].includes(a.type)&&layerVisible(a)) drawAnnotation(a);
    if (state.drawing) drawAnnotation(state.drawing);
  }
  function positionFor(a) {
    if (a.type === 'note') return { x: a.x - window.scrollX, y: a.y - window.scrollY };
    if(a.type==='image'){const el=findImage(a.image);if(!el)return null;const r=el.getBoundingClientRect(),region=a.image?.region||{x:0,y:0,w:1,h:1};return{x:r.left+r.width*(region.x+region.w),y:r.top+r.height*(region.y+region.h)};}
    const range = state.ranges.get(a.id) || resolveRange(a.anchor);
    if (!range) return null;
    const rects = [...range.getClientRects()].filter(r => r.width || r.height);
    if (!rects.length) return null;
    const end = rects[rects.length-1];
    return { x: Math.min(window.innerWidth - 36, end.right + 7), y: end.top - 4 };
  }
  function renderPins() {
    if(!state.annotationsVisible){pins.replaceChildren();return;}
    const old=new Map([...pins.children].filter(el=>el.dataset.id).map(el=>[el.dataset.id,el]));
    const shown=new Set();
    for(const a of state.annotations){
      if(!commentTypes.has(a.type)||!layerVisible(a))continue;
      if(state.draft?.editId===a.id&&state.draft?.type==='note'&&!noteEditor.classList.contains('mf-hidden'))continue;
      const pos=positionFor(a);
      if(!pos||pos.y < -(a.h||160)-30 || pos.y>innerHeight+90)continue;
      let card=old.get(a.id);
      const newCard=!card;
      if(!card){card=document.createElement(a.type==='note'?'div':'button');card.dataset.id=a.id;card.tabIndex=0;}
      card.className=a.type==='note'?'mf-pin mf-sticky-note mf-note-card':a.type==='image'?'mf-pin mf-image-pin':'mf-pin mf-comment-pin';
      card.style.left=`${Math.max(4,pos.x)}px`;card.style.top=`${pos.y}px`;
      card.setAttribute('aria-label',a.type==='note'?'Sticky note: '+noteText(a):'Open comment: '+noteText(a));
      card.title=a.type==='comment' ? noteText(a) : '';
      if(a.type==='note'){
        card.dataset.tone=a.noteTone||'butter';
        card.style.width=`${Math.max(160,Math.min(440,a.w||220))}px`;
        card.style.height=a.collapsed?'54px':`${Math.max(114,Math.min(390,a.h||160))}px`;
        card.style.zIndex=a.pinned?'18':'5';card.classList.toggle('mf-note-collapsed',!!a.collapsed);
        if(newCard||card.dataset.content!==a.html||card.dataset.rawText!==a.text||card.dataset.noteTitle!==(a.title||'')||card.dataset.collapsed!==String(!!a.collapsed)||card.dataset.pinned!==String(!!a.pinned)){
          card.innerHTML=`<div class="mf-note-card-head" data-note-drag="${escapeHtml(a.id)}"><span>${a.pinned?'⌁ ':''}✦ &nbsp;${escapeHtml(a.title||'STICKY NOTE')}</span><div class="mf-note-tools"><button type="button" data-action="collapse-note" data-id="${escapeHtml(a.id)}" aria-label="Collapse or expand note">${svgIcon('fold')}</button><button type="button" data-action="edit" data-id="${escapeHtml(a.id)}" aria-label="Edit note">${svgIcon('pen')}</button></div></div><div class="mf-sticky-rich" data-action="edit" data-id="${escapeHtml(a.id)}">${noteHTML(a)}</div><span class="mf-note-resize" data-note-resize="${escapeHtml(a.id)}" role="button" aria-label="Resize sticky note"></span>`;
          card.dataset.content=a.html||'';card.dataset.rawText=a.text;card.dataset.noteTitle=a.title||'';card.dataset.collapsed=String(!!a.collapsed);card.dataset.pinned=String(!!a.pinned);
        }
      }else{
        if(newCard)card.innerHTML=svgIcon(a.type==='image'?'image':'comment');
        card.style.setProperty('--pin-color',a.color||'#ff557e');
      }
      card.classList.toggle('mf-active-note',state.selectedId===a.id);
      if(newCard)pins.append(card);
      shown.add(a.id);
    }
    for(const [id,el] of old)if(!shown.has(id))el.remove();
  }
  function annotationPosition(a){
    if(a.type==='note')return a.y||0;
    if(a.type==='image'){const img=findImage(a.image);return img?img.getBoundingClientRect().top+scrollY:0;}
    if(a.points?.length)return a.points.reduce((sum,p)=>sum+p.y,0)/a.points.length;
    const r=state.ranges.get(a.id)||resolveRange(a.anchor);
    return r ? r.getBoundingClientRect().top+scrollY:0;
  }
  function renderItems() {
    $('#mf-count').textContent=state.annotations.length?String(state.annotations.length):'';
    const query=$('#mf-search').value.trim().toLocaleLowerCase();
    const filter=$('#mf-filter').value;
    const sort=$('#mf-sort').value;
    let visible=state.annotations.filter(a=>{
      if(filter!=='all' && (filter==='drawing'? !['pen','rect','arrow'].includes(a.type):a.type!==filter))return false;
      if($('#mf-layer-filter').value!=='all'&&layerOf(a)!==$('#mf-layer-filter').value)return false;
      return !query || `${a.text||''} ${a.anchor?.quote||''} ${a.type} ${a.title||''} ${layerOf(a)} ${(a.replies||[]).map(r=>r.text).join(' ')}`.toLocaleLowerCase().includes(query);
    });
    visible.sort((a,b)=>{
      if(sort==='newest')return(b.created||0)-(a.created||0);
      if(sort==='oldest')return(a.created||0)-(b.created||0);
      if(sort==='type')return a.type.localeCompare(b.type);
      return annotationPosition(a)-annotationPosition(b);
    });
    $('#mf-manager-summary').textContent=`${visible.length} shown · ${state.annotations.length} saved locally`;
    items.replaceChildren();
    if(!visible.length){const empty=document.createElement('div');empty.className='mf-empty';empty.textContent=state.annotations.length?'No annotations match these filters.':'Your page is ready for highlights, comments and notes.';items.append(empty);return;}
    for(const a of visible){
      const card=document.createElement('article');
      card.className=`mf-item${a.type==='note'?' mf-note-item':''}${state.selectedId===a.id?' mf-selected':''}`;
      card.dataset.id=a.id;
      if(a.type==='note')card.dataset.tone=a.noteTone||'butter';
      const category=document.createElement('div');category.className='mf-item-category';category.textContent={highlight:'◒  HIGHLIGHT',comment:'◉  COMMENT',image:'▧  IMAGE COMMENT',note:'✦  STICKY NOTE',pen:'✎  FREEHAND',rect:'▢  RECTANGLE',arrow:'↗  ARROW'}[a.type]||a.type.toUpperCase();
      const quote=document.createElement('div');quote.className='mf-item-quote';quote.textContent=a.anchor?.quote?.slice(0,125)||(a.type==='image'?'Image region':(['pen','rect','arrow'].includes(a.type)?'Drawing on the page':'Pinned to the page'));
      const preview=document.createElement('p');preview.textContent=(a.text||'').slice(0,220);
      const details=document.createElement('div');details.className='mf-item-meta';
      const orphan=!!a.anchor&&!resolveRange(a.anchor);
      details.textContent=(orphan?'⚠ Needs re-anchoring · ':'')+(a.replies?.length?`${a.replies.length} replies · `:'')+(a.created?new Date(a.created).toLocaleDateString():'Saved annotation');
      const actions=document.createElement('div');actions.className='mf-item-actions';
      const options=[['jump','Find on page','external']];
      if(orphan)options.push(['reanchor','Select a replacement passage','highlight']);
      if(['comment','image'].includes(a.type))options.push(['thread','Open discussion','comment']);
      if(['note','comment','image'].includes(a.type))options.push(['edit','Edit','pen']);
      options.push(['delete','Delete','trash']);
      for(const [action,title,icon] of options){const b=document.createElement('button');b.type='button';b.title=title;b.dataset.action=action;b.dataset.id=a.id;b.setAttribute('aria-label',title);b.innerHTML=svgIcon(icon);actions.append(b);}
      const layerSelect=document.createElement('select');layerSelect.className='mf-card-layer';layerSelect.dataset.layerId=a.id;layerSelect.setAttribute('aria-label','Annotation layer');for(const layer of state.layers){const opt=document.createElement('option');opt.value=layer.id;opt.textContent=layer.name;layerSelect.append(opt);}layerSelect.value=layerOf(a);
      card.append(category,quote,layerSelect);
      if(a.text)card.append(preview);
      card.append(details,actions);items.append(card);
    }
  }
  function jumpTo(id) {
    const a = state.annotations.find(item => item.id === id);
    if (!a) return;
    state.selectedId = id;
    const range = a.anchor ? resolveRange(a.anchor) : null;
    if (range) {
      const rect = range.getBoundingClientRect();
      window.scrollTo({ top: rect.top + scrollY - innerHeight/3, behavior: 'smooth' });
    } else if(a.type==='image'){const img=findImage(a.image);if(img)img.scrollIntoView({behavior:'smooth',block:'center'});
    } else if(a.type==='note'){
      window.scrollTo({top:a.y-innerHeight/3,behavior:'smooth'});
    } else if(a.points?.length){
      const center=a.points.reduce((sum,p)=>sum+p.y,0)/a.points.length;
      window.scrollTo({top:center-innerHeight/3,behavior:'smooth'});
    }
    state.panelOpen = true;
    panel.classList.remove('mf-hidden');
    renderItems();
    const selectedCard = items.querySelector(`[data-id="${id}"]`);
    if (selectedCard) {
      selectedCard.classList.add('mf-comment-flash');
      selectedCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      setTimeout(() => selectedCard.classList.remove('mf-comment-flash'), 1000);
    }
    setTimeout(renderPins, 500);
  }

  function hideSelection(){state.quickRange=null;selectionPopover.classList.add('mf-hidden');}
  function showSelection(range){
    if(!state.open||!range||!range.toString().trim())return;
    state.quickRange=range.cloneRange();
    const rect=range.getBoundingClientRect();
    if(!rect.width&&!rect.height)return;
    const w=248;
    selectionPopover.style.left=`${Math.max(10,Math.min(innerWidth-w-10,rect.left+rect.width/2-w/2))}px`;
    selectionPopover.style.top=`${Math.max(12,rect.top>75?rect.top-57:rect.bottom+12)}px`;
    selectionPopover.classList.remove('mf-hidden');
  }
  function syncHighlightOptions(){
    $('#mf-opacity').value=String(Math.round(state.highlightOpacity*100));
    $('#mf-opacity-label').textContent=`${Math.round(state.highlightOpacity*100)}%`;
    for(const b of shadow.querySelectorAll('[data-highlight-shape]'))b.classList.toggle('mf-shape-active',b.dataset.highlightShape===state.highlightShape);
  }
  function showCommentBubble(id){
    const a=state.annotations.find(a=>a.id===id&&['comment','image'].includes(a.type));if(!a)return;
    state.bubbleId=id;state.selectedId=id;
    const pos=positionFor(a)||{x:innerWidth/2,y:140};
    const width=320;
    commentBubble.style.left=`${Math.max(12,Math.min(innerWidth-width-12,pos.x+16))}px`;
    commentBubble.style.top=`${Math.max(16,Math.min(innerHeight-290,pos.y+30))}px`;
    renderThread();commentBubble.classList.remove('mf-hidden');
    state.panelOpen=true;panel.classList.remove('mf-hidden');renderItems();
  }
  function renderThread(){
    const a=state.annotations.find(a=>a.id===state.bubbleId);if(!a)return;
    const thread=$('#mf-thread');thread.replaceChildren();
    for(const [index,part] of [{text:a.text,created:a.created},...(a.replies||[])].entries()){
      const row=document.createElement('div');row.className='mf-thread-message';
      const chip=document.createElement('span');chip.className='mf-thread-avatar';chip.textContent=index?'↳':'✦';
      const body=document.createElement('div');const meta=document.createElement('strong');meta.textContent=index?'Reply':'Original comment';
      const txt=document.createElement('p');txt.textContent=part.text;body.append(meta,txt);row.append(chip,body);thread.append(row);
    }
  }
  function saveReply(){
    const text=$('#mf-reply-text').value.trim();const a=state.annotations.find(a=>a.id===state.bubbleId);
    if(!a||!text)return;
    snapshotHistory();a.replies=Array.isArray(a.replies)?a.replies:[];
    a.replies.push({id:uid(),text,created:Date.now()});
    $('#mf-reply-text').value='';commit();renderThread();notify('Reply saved on this device');
  }

  // Resolve an image first by the original DOM path, then by the original src.
  // The region itself is stored in normalized image coordinates.
  function findImage(anchor){if(!anchor)return null;
    const fromPath=findNode(anchor.path);
    if(fromPath?.tagName==='IMG' && (!anchor.src || fromPath.currentSrc===anchor.src || fromPath.src===anchor.src))return fromPath;
    const candidates=[...document.images];
    return candidates.find(img=>img.currentSrc===anchor.src||img.src===anchor.src)||null;
  }
  let activeImageDrag=null;
  document.addEventListener('pointerdown',event=>{
    if(!state.open||state.tool!=='image'||event.button!==0||!state.restored||event.composedPath().includes(host))return;
    const img=event.target.closest?.('img');if(!img||!img.getBoundingClientRect)return;
    const bounds=img.getBoundingClientRect();if(bounds.width<35||bounds.height<35)return;
    activeImageDrag={img,x:event.clientX,y:event.clientY,bounds};
    event.preventDefault();
  },true);
  document.addEventListener('click',event=>{
    if(state.open&&state.tool==='image'&&event.target.closest?.('img')){event.preventDefault();event.stopPropagation();}
  },true);
  document.addEventListener('pointermove',event=>{
    if(!activeImageDrag)return;
    const b=activeImageDrag.bounds;
    const x1=Math.max(b.left,Math.min(b.right,activeImageDrag.x)),x2=Math.max(b.left,Math.min(b.right,event.clientX));
    const y1=Math.max(b.top,Math.min(b.bottom,activeImageDrag.y)),y2=Math.max(b.top,Math.min(b.bottom,event.clientY));
    const x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.max(3,Math.abs(x2-x1)),h=Math.max(3,Math.abs(y2-y1));
    state.imageSelection={rect:{x,y,w,h}};scheduleRoundedHighlights();
  },true);
  document.addEventListener('pointerup',event=>{
    if(!activeImageDrag)return;
    const {img,x,y,bounds}=activeImageDrag;activeImageDrag=null;
    const endX=Math.max(bounds.left,Math.min(bounds.right,event.clientX)),endY=Math.max(bounds.top,Math.min(bounds.bottom,event.clientY));
    const w=Math.abs(endX-x),h=Math.abs(endY-y);
    const region={x:Math.max(0,(Math.min(x,endX)-bounds.left)/bounds.width),y:Math.max(0,(Math.min(y,endY)-bounds.top)/bounds.height),w:w<8?1:Math.min(1,w/bounds.width),h:h<8?1:Math.min(1,h/bounds.height)};
    if(w<8)region.x=0;if(h<8)region.y=0;
    state.imageSelection=null;scheduleRoundedHighlights();
    state.draft={type:'image',image:{path:nodePath(img),src:img.currentSrc||img.src,region},color:state.color,layer:state.activeLayer};
    showEditor();notify('Add your image-region comment');
  },true);

  async function loadLayers(){
    try{const r=await storeRequest({type:'MF_LAYERS_READ'});if(Array.isArray(r.layers)&&r.layers.length)state.layers=r.layers;
      const stored=await chrome.storage.local.get(['markflow:active-layer','markflow:hidden-layers']);
      if(state.layers.some(l=>l.id===stored['markflow:active-layer']))state.activeLayer=stored['markflow:active-layer'];
      state.hiddenLayers=new Set((stored['markflow:hidden-layers']||[]).filter(id=>state.layers.some(l=>l.id===id)));
      renderLayerPanel();renderItems();renderHighlights();renderCanvas();renderPins();
    }catch(e){console.debug('Markflow layer settings',e);}
  }
  function renderLayerPanel(){
    const list=$('#mf-layer-list');list.replaceChildren();const filter=$('#mf-layer-filter');const oldFilter=filter.value;filter.replaceChildren();
    const all=document.createElement('option');all.value='all';all.textContent='All layers';filter.append(all);
    for(const layer of state.layers){const opt=document.createElement('option');opt.value=layer.id;opt.textContent=layer.name;filter.append(opt);
      const row=document.createElement('div');row.className='mf-layer-row';const swatch=document.createElement('span');swatch.className='mf-layer-swatch';swatch.style.background=layer.color;
      const name=document.createElement('strong');name.textContent=layer.name;
      const selected=document.createElement('input');selected.type='radio';selected.name='mf-active-layer';selected.value=layer.id;selected.checked=state.activeLayer===layer.id;selected.setAttribute('aria-label',`Use ${layer.name} layer`);
      const visibility=document.createElement('input');visibility.type='checkbox';visibility.checked=!state.hiddenLayers.has(layer.id);visibility.dataset.layerVisible=layer.id;visibility.setAttribute('aria-label',`Show ${layer.name} layer`);
      row.append(swatch,name,selected,visibility);list.append(row);
    }
    filter.value=state.layers.some(l=>l.id===oldFilter)?oldFilter:'all';
  }
  function updateLayers(){chrome.storage.local.set({'markflow:active-layer':state.activeLayer,'markflow:hidden-layers':[...state.hiddenLayers]}).catch(()=>{});
    renderLayerPanel();commitVisuals();notify('Layer preferences saved locally');}
  async function addLayer(){const value=prompt('New layer name (saved locally):');if(!value?.trim())return;
    const name=value.trim().slice(0,45),id='layer_'+uid().slice(0,8);
    if(state.layers.length>=20){notify('Maximum of 20 layers');return;}
    const color=COLORS[state.layers.length%COLORS.length].value;
    try{const r=await storeRequest({type:'MF_LAYERS_WRITE',layers:[...state.layers,{id,name,color}]});state.layers=r.layers;state.activeLayer=id;updateLayers();}
    catch(e){notify(`Layer not saved: ${e.message}`);}
  }
  shadow.addEventListener('change',event=>{
    if(event.target.name==='mf-active-layer'){state.activeLayer=event.target.value;updateLayers();}
    if(event.target.dataset.layerVisible){if(event.target.checked)state.hiddenLayers.delete(event.target.dataset.layerVisible);else state.hiddenLayers.add(event.target.dataset.layerVisible);updateLayers();}
  });

  function toggleReading(force){const next=typeof force==='boolean'?force:!state.reading;state.reading=next;
    if(!next){readingPanel.classList.add('mf-hidden');return;}
    const article=document.querySelector('main,[role="main"],article')||document.body;
    const blocks=[...article.querySelectorAll('h1,h2,h3,p,blockquote,li')].filter(el=>!el.closest('#markflow-extension-host')&&(el.textContent||'').trim().length>2).slice(0,240);
    const destination=$('#mf-reader-content');destination.replaceChildren();
    const heading=document.createElement('h1');heading.textContent=document.title||'Reading mode';destination.append(heading);
    const subtitle=document.createElement('div');subtitle.className='mf-reader-source';subtitle.textContent=location.hostname;destination.append(subtitle);
    for(const el of blocks){const out=document.createElement(el.tagName==='LI'?'p':el.tagName.toLowerCase());out.textContent=el.textContent?.trim()||'';
      const quoteMarks=state.annotations.filter(a=>['highlight','comment'].includes(a.type)&&layerVisible(a)&&a.anchor?.quote);
      // Mark matching excerpts without rewriting the live webpage DOM.
      let fragment=document.createDocumentFragment(),raw=out.textContent;
      if(raw.length<4000){let marks=[];for(const a of quoteMarks){let pos=raw.indexOf(a.anchor.quote);if(pos>=0)marks.push({pos,len:a.anchor.quote.length,color:a.color});}
        marks.sort((a,b)=>a.pos-b.pos);let cursor=0;for(const m of marks){if(m.pos<cursor)continue;fragment.append(document.createTextNode(raw.slice(cursor,m.pos)));
          const span=document.createElement('mark');span.textContent=raw.slice(m.pos,m.pos+m.len);span.style.background=m.color+'77';fragment.append(span);cursor=m.pos+m.len;}
        fragment.append(document.createTextNode(raw.slice(cursor)));out.replaceChildren(fragment);
      }
      destination.append(out);
    }
    if(!blocks.length){const p=document.createElement('p');p.textContent='No article-style content was found on this webpage.';destination.append(p);}
    layerPanel.classList.add('mf-hidden');commandPanel.classList.add('mf-hidden');readingPanel.classList.remove('mf-hidden');
  }
  const commandDefinitions=[
    {id:'library',name:'Open annotation library',hint:'Dashboard · all websites'},
    {id:'note',name:'Create sticky note',hint:'New note at center of screen'},
    {id:'highlight',name:'Highlight selected text',hint:'Use current highlight style'},
    {id:'manager',name:'Open annotation manager',hint:'Find annotations on this page'},
    {id:'layers',name:'Choose annotation layer',hint:'Personal · research · review'},
    {id:'reading',name:'Toggle reading mode',hint:'Focused article view'},
    {id:'image',name:'Annotate image',hint:'Drag across a picture'},
    {id:'visibility',name:'Show or hide annotations',hint:'No annotations are deleted'},
    {id:'undo',name:'Undo last edit',hint:'Ctrl/⌘ + Alt + Z'},
    {id:'redo',name:'Redo last edit',hint:'Ctrl/⌘ + Alt + Shift + Z'}
  ];
  function renderCommands(){const input=$('#mf-command-input').value.toLowerCase(),list=$('#mf-command-list');list.replaceChildren();
    for(const cmd of commandDefinitions.filter(c=>(c.name+' '+c.hint).toLowerCase().includes(input))){
      const b=document.createElement('button');b.dataset.action='run-command';b.dataset.command=cmd.id;
      const name=document.createElement('strong');name.textContent=cmd.name;const hint=document.createElement('small');hint.textContent=cmd.hint;b.append(name,hint);list.append(b);
    }
    list.querySelector('button')?.classList.add('mf-command-active');
  }
  function openCommands(){state.commandOpen=true;commandPanel.classList.remove('mf-hidden');$('#mf-command-input').value='';renderCommands();$('#mf-command-input').focus();}
  function closeCommands(){state.commandOpen=false;commandPanel.classList.add('mf-hidden');}
  function runCommand(name){closeCommands();switch(name){
    case 'library':storeRequest({type:'MF_OPEN_LIBRARY'}).catch(e=>notify(e.message));break;
    case 'note':if(!state.open){state.open=true;updateToolbar();}openNoteEditor(null,{x:scrollX+innerWidth/2,y:scrollY+innerHeight/2});break;
    case 'highlight':addSelectedHighlight();break;
    case 'manager':state.panelOpen=true;panel.classList.remove('mf-hidden');$('#mf-search').focus();break;
    case 'layers':renderLayerPanel();layerPanel.classList.remove('mf-hidden');break;
    case 'reading':toggleReading();break;
    case 'image':if(!state.open){state.open=true;updateToolbar();}selectTool('image');break;
    case 'visibility':toggleAnnotations();break;
    case 'undo':undo();break;case 'redo':redo();break;
  }}
  $('#mf-command-input').addEventListener('input',renderCommands);
  $('#mf-command-input').addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeCommands();}
    if(event.key==='Enter'){event.preventDefault();const first=$('#mf-command-list .mf-command-active')||$('#mf-command-list button');if(first)runCommand(first.dataset.command);}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();const buttons=[...$('#mf-command-list').querySelectorAll('button')];if(!buttons.length)return;
      let i=buttons.findIndex(b=>b.classList.contains('mf-command-active'));
      buttons.forEach(b=>b.classList.remove('mf-command-active'));i=(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[i].classList.add('mf-command-active');
    }
  });

  function selectTool(tool) {
    if (!state.annotationsVisible) {
      state.annotationsVisible=true;
      chrome.storage.local.set({'markflow:annotations-visible':true}).catch(()=>{});
      renderHighlights();renderCanvas();renderPins();updateVisibility();
    }
    state.tool = tool;
    for (const b of shadow.querySelectorAll('[data-tool]')) b.classList.toggle('mf-active', b.dataset.tool === tool);
    canvas.classList.toggle('mf-interactive', drawingTools.has(tool) && state.open);
    colorBar.classList.toggle('mf-hidden', !state.open);
    if (tool === 'comment' && (state.quickRange||selectableRange())) openCommentDraft();
    if (tool === 'highlight' && (state.quickRange||selectableRange())) addSelectedHighlight();
    notify({highlight:'Select text to highlight',comment:'Select text to add a comment',pen:'Draw freely on the webpage',arrow:'Drag to draw an arrow',rect:'Drag to draw a rectangle',note:'Click to place a sticky note',image:'Drag across an image to comment on that region',erase:'Click an annotation to erase it'}[tool]);
  }
  function updateToolbar() {
    toolbar.classList.toggle('mf-hidden', !state.open);
    if (!state.open) {
      colorBar.classList.add('mf-hidden');
      stylePopover.classList.add('mf-hidden');selectionPopover.classList.add('mf-hidden');commentBubble.classList.add('mf-hidden');
      panel.classList.add('mf-hidden');
      closeNoteEditor();
    } else {
      colorBar.classList.remove('mf-hidden');
      panel.classList.toggle('mf-hidden', !state.panelOpen);
    }
    canvas.classList.toggle('mf-interactive', state.open && drawingTools.has(state.tool));
    for (const b of shadow.querySelectorAll('[data-tool]')) b.classList.toggle('mf-active', b.dataset.tool === state.tool);
  }
  function toggle() { if(state.privacyPaused){storeRequest({type:'MF_OPEN_LIBRARY'}).catch(()=>{});return;} state.open = !state.open; updateToolbar(); if (state.open) notify('Markflow ready · Select text or choose a tool'); }

  function findEraseTarget(x,y) {
    for (let i=state.annotations.length-1; i>=0; i--) {
      const a=state.annotations[i];
      if (a.anchor) {
        const range = state.ranges.get(a.id) || resolveRange(a.anchor);
        if (range && [...range.getClientRects()].some(r => x >= r.left-5 && x <= r.right+5 && y >= r.top-5 && y <= r.bottom+5)) return a.id;
      } else if (a.type==='note') {
        if (Math.hypot(a.x-(x+scrollX),a.y-(y+scrollY))<26) return a.id;
      } else if (a.points?.length) {
        const pts=a.points; const px=x+scrollX, py=y+scrollY;
        if (a.type==='rect') {
          const s=pts[0],e=pts[pts.length-1];
          if (px>=Math.min(s.x,e.x)-10 && px<=Math.max(s.x,e.x)+10 && py>=Math.min(s.y,e.y)-10 && py<=Math.max(s.y,e.y)+10) return a.id;
        } else if (pts.length===1 && Math.hypot(pts[0].x-px,pts[0].y-py)<10) return a.id;
        else for(let j=1;j<pts.length;j++) if(distanceToSegment(px,py,pts[j-1].x,pts[j-1].y,pts[j].x,pts[j].y)<10) return a.id;
      }
    }
    return null;
  }
  function onDrawStart(event) {
    if(!state.restored){notify('Annotations are loading…');return;}
    if (!state.open || event.button !== 0) return;
    event.preventDefault();
    const x=event.clientX+window.scrollX,y=event.clientY+window.scrollY;
    if (state.tool==='erase') {
      const id=findEraseTarget(event.clientX,event.clientY);
      if (id) { snapshotHistory(); state.annotations=state.annotations.filter(a=>a.id!==id); commit(); notify('Annotation removed'); }
      else notify('No annotation at that position');
      return;
    }
    if (state.tool==='note') {
      openNoteEditor(null,{x,y}); return;
    }
    state.drawing={type:state.tool,points:[{x,y}],color:state.color,layer:state.activeLayer};
    canvas.setPointerCapture(event.pointerId);
  }
  function onDrawMove(event) {
    if (!state.drawing) return;
    const x=event.clientX+window.scrollX,y=event.clientY+window.scrollY;
    const pts=state.drawing.points;
    if (state.drawing.type==='pen') {
      const last=pts[pts.length-1];
      if (Math.hypot(last.x-x,last.y-y)>2) pts.push({x,y});
    } else if (pts.length===1) pts.push({x,y}); else pts[1]={x,y};
    renderCanvas();
  }
  function onDrawEnd(event) {
    if (!state.drawing) return;
    const a=state.drawing;
    state.drawing=null;
    if (a.points.length>1 && Math.hypot(a.points[0].x-a.points[a.points.length-1].x,a.points[0].y-a.points[a.points.length-1].y)>3) {
      snapshotHistory(); state.annotations.push({id:uid(),...a,created:Date.now()}); commit();
    } else renderCanvas();
    try { canvas.releasePointerCapture(event.pointerId); } catch {}
  }
  canvas.addEventListener('pointerdown', onDrawStart);
  canvas.addEventListener('pointermove', onDrawMove);
  canvas.addEventListener('pointerup', onDrawEnd);
  canvas.addEventListener('pointercancel', onDrawEnd);
  window.addEventListener('mouseup',event=>{
    if(!state.open||event.composedPath().includes(host)||drawingTools.has(state.tool))return;
    const range=selectableRange();
    if(range&&state.pendingRepairId){const a=state.annotations.find(x=>x.id===state.pendingRepairId);if(a){const anchor=anchorForRange(range);if(anchor){snapshotHistory();a.anchor=anchor;state.pendingRepairId=null;window.getSelection()?.removeAllRanges();commit();notify('Annotation anchor repaired');return;}}}
    if(range)showSelection(range);
    else if(!event.target.closest('input,textarea,[contenteditable]'))hideSelection();
  },true);

  for (const c of COLORS) {
    const btn = document.createElement('button');
    btn.className = 'mf-color'; btn.title = c.name; btn.dataset.color = c.value;
    btn.style.background = c.value;
    colorBar.append(btn);
  }
  function renderColors() {
    for (const btn of colorBar.querySelectorAll('button')) btn.classList.toggle('mf-color-active',btn.dataset.color === state.color);
  }
  renderColors();syncHighlightOptions();updateHistoryButtons();
  $('#mf-import-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    if(file.size>40_000_000){notify('Import file is larger than 40 MB');return;}
    try{
      const input=await file.text();
      let payload;
      if(file.name.toLowerCase().endsWith('.json'))payload=JSON.parse(input);
      else{
        const script=input.match(/<script\b[^>]*\bid=["']mf-data["'][^>]*>([\s\S]*?)<\/script\s*>/i);
        if(!script)throw Error('No Markflow annotations found in this HTML file');
        payload=JSON.parse(script[1]);
      }
      if(payload.source){
        const page=new URL(payload.source);
        if(`${page.origin}${page.pathname}${page.search}`!==pageKey())throw Error('Open the original webpage before importing its saved annotations');
      }
      const imported=(Array.isArray(payload)?payload:payload.annotations||[]).filter(validAnnotation).slice(0,12000);
      if(!imported.length)throw Error('No valid annotations found');
      const known=new Set(state.annotations.map(a=>a.id));
      const addition=imported.filter(a=>!known.has(a.id));
      if(!addition.length){notify('All annotations are already saved on this page');return;}
      snapshotHistory();state.annotations.push(...addition);commit();notify(`Imported ${addition.length} annotations locally`);
    }catch(error){notify(`Import failed: ${error.message}`);}
  });
  $('#mf-search').addEventListener('input',renderItems);
  $('#mf-filter').addEventListener('change',renderItems);
  $('#mf-layer-filter').addEventListener('change',renderItems);
  $('#mf-sort').addEventListener('change',renderItems);
  $('#mf-opacity').addEventListener('input',event=>{state.highlightOpacity=Number(event.target.value)/100;syncHighlightOptions();});
  // Prevent toolbar clicks from collapsing a previously selected text range.
  shadow.addEventListener('pointerdown', event => {
    if (event.target.closest('button.mf-tool')) event.preventDefault();
  });
  // Sticky notes use document coordinates, so dragging stays stable while scrolling.
  shadow.addEventListener('pointerdown',event=>{
    const drag=event.target.closest('[data-note-drag]');
    const resize=event.target.closest('[data-note-resize]');
    if(!drag&&!resize)return;
    if(event.target.closest('button'))return;
    const id=(drag||resize).dataset[drag?'noteDrag':'noteResize'];
    const a=state.annotations.find(a=>a.id===id&&a.type==='note');if(!a)return;
    event.preventDefault();event.stopPropagation();
    snapshotHistory();
    state.noteMovement={id,kind:drag?'drag':'resize',startX:event.clientX,startY:event.clientY,originX:a.x,originY:a.y,originW:a.w||220,originH:a.h||160,changed:false};
    (drag||resize).setPointerCapture(event.pointerId);
  });
  shadow.addEventListener('pointermove',event=>{
    const m=state.noteMovement;if(!m)return;
    const a=state.annotations.find(a=>a.id===m.id);if(!a)return;
    const dx=event.clientX-m.startX,dy=event.clientY-m.startY;
    if(m.kind==='drag'){a.x=Math.max(0,m.originX+dx);a.y=Math.max(0,m.originY+dy);}
    else{a.w=Math.max(160,Math.min(440,m.originW+dx));a.h=Math.max(114,Math.min(390,m.originH+dy));}
    m.changed=m.changed||Math.abs(dx)+Math.abs(dy)>2;
    renderPins();
  });
  function finishNoteMovement(){
    const m=state.noteMovement;if(!m)return;
    state.noteMovement=null;
    if(m.changed){state.ignoreNoteClickUntil=Date.now()+350;commit();}else{state.history.pop();updateHistoryButtons();}
  }
  shadow.addEventListener('pointerup',finishNoteMovement);
  shadow.addEventListener('pointercancel',finishNoteMovement);
  shadow.addEventListener('change',event=>{
    const select=event.target.closest('[data-layer-id]');if(!select)return;
    const a=state.annotations.find(x=>x.id===select.dataset.layerId);if(!a)return;
    snapshotHistory();a.layer=select.value;commit();
  });
  shadow.addEventListener('click', async event => {
    const collapseBtn=event.target.closest('[data-action="collapse-note"]');if(collapseBtn){const a=state.annotations.find(x=>x.id===collapseBtn.dataset.id&&x.type==='note');if(a){snapshotHistory();a.collapsed=!a.collapsed;commit();}return;}
    const pin=event.target.closest('.mf-pin');
    if(pin){if(Date.now()<(state.ignoreNoteClickUntil||0))return;const a=state.annotations.find(item=>item.id===pin.dataset.id);if(a?.type==='note')openNoteEditor(a);else if(['comment','image'].includes(a?.type))showCommentBubble(a.id);return;}
    const shape=event.target.closest('[data-highlight-shape]');if(shape){state.highlightShape=shape.dataset.highlightShape;syncHighlightOptions();return;}
    const noteTone = event.target.closest('[data-note-tone]');
    if (noteTone && state.draft?.type==='note') { state.draft.noteTone=noteTone.dataset.noteTone;noteEditor.dataset.tone=state.draft.noteTone;renderNotePalette();return; }
    const color = event.target.closest('[data-color]');
    if (color) { state.color = color.dataset.color; renderColors(); return; }
    const tool = event.target.closest('[data-tool]');
    if (tool) { selectTool(tool.dataset.tool); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action=button.dataset.action,id=button.dataset.id;
    if(action==='save-unsaved'){
      const data={app:'markflow',format:'markflow-unsaved-page',version:1,page:state.pageKey,annotations:state.annotations,exportedAt:new Date().toISOString()};
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='markflow-unsaved-annotations.json';
      document.documentElement.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return;
    }
    if(action==='reload-saved'){await restore();return;}
    if(action==='reanchor'){state.pendingRepairId=id;panel.classList.add('mf-hidden');notify('Select the replacement text on the webpage to repair this anchor');return;}
    if(action==='collapse-note'){const a=state.annotations.find(x=>x.id===id&&x.type==='note');if(a){snapshotHistory();a.collapsed=!a.collapsed;commit();}return;}
    if(action==='quick-highlight'){addSelectedHighlight(state.quickRange);return;}
    if(action==='quick-comment'){openCommentDraft(state.quickRange);return;}
    if(action==='quick-copy'){navigator.clipboard?.writeText(state.quickRange?.toString()||'').then(()=>notify('Copied selection')).catch(()=>notify('Copy unavailable'));hideSelection();return;}
    if(action==='close-bubble'){commentBubble.classList.add('mf-hidden');state.bubbleId=null;return;}
    if(action==='save-reply'){saveReply();return;}
    if(action==='styles'){syncHighlightOptions();stylePopover.classList.toggle('mf-hidden');return;}
    if(action==='import'){$('#mf-import-file').click();return;}
    if(action==='library'){storeRequest({type:'MF_OPEN_LIBRARY'}).catch(e=>notify(e.message));return;}
    if(action==='layers'){renderLayerPanel();layerPanel.classList.toggle('mf-hidden');return;}
    if(action==='close-layers'){layerPanel.classList.add('mf-hidden');return;}
    if(action==='add-layer'){addLayer();return;}
    if(action==='reading'){toggleReading();return;}
    if(action==='close-reading'){toggleReading(false);return;}
    if(action==='command'){openCommands();return;}
    if(action==='close-command'){closeCommands();return;}
    if(action==='run-command'){runCommand(button.dataset.command);return;}

    if(action==='thread'){showCommentBubble(id);return;}
    if(action==='toggle-annotations') { toggleAnnotations();return; }
    if (action==='save-note') { saveNote();return; }
    if (action==='cancel-note') { closeNoteEditor();return; }
    if (action==='delete-note') {
      const id=state.draft?.editId;
      if (id) {snapshotHistory();state.annotations=state.annotations.filter(a=>a.id!==id);}
      closeNoteEditor();commit();return;
    }
    if (action==='done') { state.open=false;closeNoteEditor();updateToolbar(); }
    else if(action==='undo')undo();
    else if(action==='redo')redo();
    else if (action==='clear') {
      if (state.annotations.length && confirm('Remove all annotations from this webpage?')) {snapshotHistory();state.annotations=[];closeEditor();commit();}
    } else if(action==='list'){state.panelOpen=!state.panelOpen;panel.classList.toggle('mf-hidden',!state.panelOpen);if(state.panelOpen)$('#mf-search').focus();}
    else if (action==='close-panel') { state.panelOpen=false;panel.classList.add('mf-hidden'); }
    else if (action==='cancel-comment') closeEditor();
    else if (action==='save-comment') saveDraft();
    else if (action==='jump') jumpTo(id);
    else if (action==='delete') {snapshotHistory();state.annotations=state.annotations.filter(a=>a.id!==id);commit();}
    else if (action==='edit') {const a=state.annotations.find(x=>x.id===id);if(a){if(a.type==='note')openNoteEditor(a);else{state.draft={...a,editId:id};showEditor(a.text);}}}

  });
  // Drag the toolbar from its dotted grip.
  let dragging=null;
  $('.mf-grip').addEventListener('pointerdown', e => {
    e.preventDefault();
    const r=toolbar.getBoundingClientRect();
    toolbar.style.left=`${r.left}px`;toolbar.style.top=`${r.top}px`;toolbar.style.transform='none';
    dragging={x:e.clientX-r.left,y:e.clientY-r.top};
    $('.mf-grip').setPointerCapture(e.pointerId);
  });
  $('.mf-grip').addEventListener('pointermove',e=>{
    if(!dragging)return;
    toolbar.style.left=`${Math.max(8,Math.min(innerWidth-toolbar.offsetWidth-8,e.clientX-dragging.x))}px`;
    toolbar.style.top=`${Math.max(8,Math.min(innerHeight-50,e.clientY-dragging.y))}px`;
  });
  $('.mf-grip').addEventListener('pointerup',()=>dragging=null);
  window.addEventListener('scroll',()=>{renderCanvas();renderPins();scheduleRoundedHighlights();},{passive:true});
  window.addEventListener('resize',()=>{renderCanvas();renderPins();scheduleRoundedHighlights();},{passive:true});
  // Dynamic webpages often reflow text without firing resize.
  const textReflowObserver = new ResizeObserver(()=>scheduleRoundedHighlights());
  textReflowObserver.observe(document.body);
  chrome.runtime.onMessage.addListener(msg=>{if(msg?.type==='MARKFLOW_TOGGLE'){toggle();return false;}});
  document.addEventListener('keydown',event=>{
    if(state.privacyPaused)return;
    if(event.key==='Escape'){closeCommands();if(state.reading)toggleReading(false);hideSelection();commentBubble.classList.add('mf-hidden');stylePopover.classList.add('mf-hidden');closeEditor();closeNoteEditor();return;}
    if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='p'){event.preventDefault();openCommands();return;}
    const target=event.composedPath()[0];
    if(target?.closest?.('input,textarea,[contenteditable="true"],[role="textbox"]'))return;
    const mod=event.ctrlKey||event.metaKey;
    if(mod&&event.altKey&&event.key.toLowerCase()==='z'){
      event.preventDefault();if(event.shiftKey)redo();else undo();return;
    }
    if(event.altKey&&event.shiftKey){
      const key=event.key.toLowerCase();
      if(!['a','h','c','n','l'].includes(key))return;
      event.preventDefault();
      if(key==='a'){toggle();return;}
      if(!state.open){state.open=true;updateToolbar();}
      if(key==='h'){addSelectedHighlight();return;}
      if(key==='c'){openCommentDraft();return;}
      if(key==='n'){openNoteEditor(null,{x:scrollX+innerWidth/2,y:scrollY+innerHeight/2});return;}
      if(key==='l'){state.panelOpen=true;panel.classList.remove('mf-hidden');$('#mf-search').focus();}
    }
  });
  let lastUrl=pageKey();
  setInterval(()=>{
    const now=pageKey();
    if(now!==lastUrl){lastUrl=now;restore();}
  },1100);
  chrome.storage.local.get('markflow:annotations-visible').then(result => {
    if(typeof result['markflow:annotations-visible']==='boolean'){
      state.annotationsVisible=result['markflow:annotations-visible'];
      renderHighlights();renderCanvas();renderPins();updateVisibility();
    }
  }).catch(()=>{});
  (async()=>{
    // Privacy rules are read from extension-owned IndexedDB, not the website.
    try{
      const setting=await storeRequest({type:'MF_PRIVACY_READ'});
      if(setting.paused){state.privacyPaused=true;host.style.display='none';return;}
    }catch(e){console.debug('Markflow privacy check unavailable:',e);}
    await restore();loadLayers();
  })();
})();
