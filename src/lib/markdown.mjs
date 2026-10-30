// Plugins Markdown (Sätteri) pour les articles du journal.

const NB = ' ';

// Espaces insécables : avant : ; ? ! % € », après «, et dans les milliers (10 000)
export function typo(t) {
  return t
    .replace(/ ([:;?!%€»])/g, NB + '$1')
    .replace(/« /g, '«' + NB)
    .replace(/(\d) (\d{3})(?!\d)/g, '$1' + NB + '$2');
}

// Appels de source : {1} ou {1,3} renvoient aux entrées de `sources` dans le frontmatter
const REF = /\{(\d+(?:,\d+)*)\}/g;
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function refHtml(ids, sources, file) {
  return '<sup class="j-ref">' + ids.split(',').map((n) => {
    const s = sources[Number(n) - 1];
    if (!s) throw new Error(`${file} : l'appel {${n}} ne correspond à aucune source du frontmatter`);
    const t = attr(typo(s.title));
    return `<a href="${attr(s.url)}" target="_blank" rel="noopener" title="${t}" aria-label="Source ${n}${NB}: ${t}">${n}</a>`;
  }).join('') + '</sup>';
}

const sourcesOf = (ctx) => ctx.data.astro?.frontmatter?.sources ?? [];
const fileOf = (ctx) => (ctx.fileURL ? ctx.fileURL.pathname.split('/').pop() : 'article');

// Un seul plugin : deux plugins qui modifient le même nœud de texte s'annulent
export const articlePlugin = {
  name: 'haustmann-article',
  text(node, ctx) {
    // search() ignore la position de la regex globale, contrairement à test()
    if (node.value.search(REF) < 0) {
      const v = typo(node.value);
      if (v !== node.value) ctx.setProperty(node, 'value', v);
      return;
    }
    const out = [];
    let last = 0;
    for (const m of node.value.matchAll(REF)) {
      if (m.index > last) out.push({ type: 'text', value: typo(node.value.slice(last, m.index)) });
      out.push({ type: 'html', value: refHtml(m[1], sourcesOf(ctx), fileOf(ctx)) });
      last = m.index + m[0].length;
    }
    if (last < node.value.length) out.push({ type: 'text', value: typo(node.value.slice(last)) });
    ctx.replaceNode(node, out);
  },
  // les blocs HTML (encadrés, tableaux) peuvent aussi appeler une source
  html(node, ctx) {
    if (node.value.search(REF) < 0) return;
    ctx.setProperty(node, 'value', node.value.replace(REF, (_, ids) => refHtml(ids, sourcesOf(ctx), fileOf(ctx))));
  },
};
