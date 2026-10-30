/** A semantic original plus an aria-hidden, measured visual-line copy. */
export class LineReveals {
  records = new Map();
  constructor(targets) { this.targets = [...new Set(targets)]; }
  split(target) {
    let record = this.records.get(target);
    const width = Math.round(target.getBoundingClientRect().width);
    if (!width || record?.width === width) return;
    if (!record) {
      const source = document.createElement('span');
      source.className = 'reveal-source';
      source.append(...target.childNodes);
      target.append(source);
      record = {source, width:0};
      this.records.set(target, record);
    }
    target.querySelector(':scope > .reveal-visual')?.remove();
    target.setAttribute('data-split-ready','');
    const visual = document.createElement('span');
    visual.className = 'reveal-visual';
    visual.setAttribute('aria-hidden','true');
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;inset:0 auto auto 0;width:100%;visibility:hidden;pointer-events:none';
    probe.setAttribute('aria-hidden','true');
    const parts = [];
    const walk = (node, ancestors = []) => {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const part of node.textContent.split(/(\s+)/).filter(Boolean)) {
          if (/^\s+$/.test(part)) { probe.append(' '); parts.push({space:true}); continue; }
          let leaf = document.createElement('span');
          leaf.textContent = part;
          leaf.style.display = 'inline-block';
          const measure = leaf;
          for (const ancestor of ancestors.toReversed()) {
            const wrapper = ancestor.cloneNode(false);
            wrapper.removeAttribute('id'); wrapper.append(leaf); leaf = wrapper;
          }
          probe.append(leaf); parts.push({node:leaf, measure});
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList.contains('sr-only')) return;
        if (node.tagName === 'BR') { probe.append(document.createElement('br')); parts.push({break:true}); return; }
        for (const child of node.childNodes) walk(child, [...ancestors,node]);
      }
    };
    for (const node of record.source.childNodes) walk(node);
    target.append(probe);
    const threshold = parseFloat(getComputedStyle(target).fontSize) * .5;
    const lines = []; let line; let top = null; let force = false;
    for (const part of parts) {
      if (part.break) { force = true; continue; }
      if (part.space) { part.line = line; continue; }
      const y = part.measure.getBoundingClientRect().top;
      if (!line || force || Math.abs(y - top) > threshold) {
        line = document.createElement('span'); line.className='split-line';
        line.style.setProperty('--line-i',lines.length); lines.push(line); top=y; force=false;
      }
      // Measurements are complete before moving the nodes out of the probe.
      part.line = line;
    }
    for (const part of parts) {
      if (part.node) part.line.append(part.node.cloneNode(true));
      else if (part.space && part.line) part.line.append(' ');
    }
    probe.remove(); visual.append(...lines); target.append(visual);
    target.setAttribute('data-split-ready',''); record.width=width;
  }
  refresh(force=false) {
    for (const target of this.targets) {
      if (force && this.records.has(target)) this.records.get(target).width=0;
      this.split(target);
    }
  }
  destroy() {
    for (const [target,{source}] of this.records) {
      target.replaceChildren(...source.childNodes);
      target.removeAttribute('data-split-ready'); target.removeAttribute('data-text');
    }
    this.records.clear();
  }
}
