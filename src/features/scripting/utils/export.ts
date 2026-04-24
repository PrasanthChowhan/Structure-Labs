/**
 * BlockSuite 0.15 Text Extractor for Markdown export.
 */
export async function exportScript(useScriptStore: any) {
  const state = useScriptStore.getState();
  const doc = state.getActiveDoc();
  if (!doc) {
    alert('No active version to export.');
    return;
  }

  // Manually extract text from BlockSuite 0.15 blocks
  const blocks = doc.getBlocks();
  let markdown = '';

  blocks.forEach((block: any) => {
    const flavour = block.flavour;
    const props = block.props;

    if (flavour === 'affine:page' && props.title) {
        markdown += `# ${props.title}\n\n`;
    } else if (flavour === 'affine:paragraph') {
        const text = props.text?.toString() || '';
        markdown += `${text}\n\n`;
    }
  });

  const version = state.versions[state.activeVersionId];
  
  // Build frontmatter
  let output = `---\ntitle: ${state.title || 'Untitled'}\n`;
  if (state.targetAudience) output += `audience: ${state.targetAudience}\n`;
  if (state.niche) output += `niche: ${state.niche}\n`;
  output += `version: ${version.name}\n`;
  output += `date: ${new Date().toLocaleDateString()}\n---\n\n`;
  output += markdown;

  // Download
  const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (state.title || 'script').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  a.download = `${safeName}_${version.name.replace(/\s+/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
