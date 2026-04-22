import { ScriptData, ScriptVersion } from '../../types';

/**
 * Very basic TipTap JSON to Markdown converter for MVP.
 * Focuses on headings, paragraphs, and lists.
 */
export function convertJsonToMarkdown(json: any): string {
  if (!json || !json.content) return '';

  let markdown = '';

  json.content.forEach((node: any) => {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 1;
        markdown += `${'#'.repeat(level)} ${getText(node)}\n\n`;
        break;
      }
      case 'paragraph': {
        markdown += `${getText(node)}\n\n`;
        break;
      }
      case 'bulletList': {
        node.content?.forEach((item: any) => {
          markdown += `* ${getText(item)}\n`;
        });
        markdown += '\n';
        break;
      }
      case 'orderedList': {
        node.content?.forEach((item: any, index: number) => {
          markdown += `${index + 1}. ${getText(item)}\n`;
        });
        markdown += '\n';
        break;
      }
      case 'image': {
        const src = node.attrs?.src || '';
        const alt = node.attrs?.alt || 'image';
        markdown += `![${alt}](${src})\n\n`;
        break;
      }
      case 'horizontalRule': {
        markdown += `---\n\n`;
        break;
      }
      default:
        if (node.content) {
          markdown += convertJsonToMarkdown(node);
        }
    }
  });

  return markdown;
}

function getText(node: any): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  
  return node.content.map((child: any) => {
    let text = getText(child);
    if (child.marks) {
      child.marks.forEach((mark: any) => {
        if (mark.type === 'bold') text = `**${text}**`;
        if (mark.type === 'italic') text = `_${text}_`;
        if (mark.type === 'strike') text = `~~${text}~~`;
        if (mark.type === 'link') text = `[${text}](${mark.attrs.href})`;
      });
    }
    return text;
  }).join('');
}

export function exportScript(scriptData: ScriptData) {
  const version = scriptData.versions[scriptData.activeVersionId];
  if (!version) return;

  let fullMarkdown = `---\ntitle: ${scriptData.title}\naudience: ${scriptData.targetAudience}\nniche: ${scriptData.niche}\ndate: ${new Date().toLocaleDateString()}\n---\n\n`;

  version.blockOrder.forEach((bId) => {
    const block = scriptData.blocks[bId];
    const vId = version.activeVariants[bId];
    const variant = block.variants[vId];
    fullMarkdown += convertJsonToMarkdown(variant.content);
  });

  const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scriptData.title.replace(/\s+/g, '_')}_${version.name.replace(/\s+/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
