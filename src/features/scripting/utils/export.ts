import { ScriptData } from '../../../types';

/**
 * TipTap JSON to Markdown converter.
 * Handles headings, paragraphs, lists, blockquotes, images, tables, code blocks, and horizontal rules.
 */
export function convertJsonToMarkdown(json: any): string {
  if (!json || !json.content) return '';

  let markdown = '';

  json.content.forEach((node: any) => {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 1;
        const text = getText(node);
        if (text) {
          markdown += `${'#'.repeat(level)} ${text}\n\n`;
        }
        break;
      }
      case 'paragraph': {
        const text = getText(node);
        markdown += `${text}\n\n`;
        break;
      }
      case 'bulletList': {
        node.content?.forEach((item: any) => {
          markdown += `- ${getText(item)}\n`;
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
      case 'taskList': {
        node.content?.forEach((item: any) => {
          const checked = item.attrs?.checked ? 'x' : ' ';
          markdown += `- [${checked}] ${getText(item)}\n`;
        });
        markdown += '\n';
        break;
      }
      case 'blockquote': {
        const inner = convertJsonToMarkdown(node);
        inner.split('\n').forEach(line => {
          markdown += `> ${line}\n`;
        });
        markdown += '\n';
        break;
      }
      case 'codeBlock': {
        const lang = node.attrs?.language || '';
        markdown += `\`\`\`${lang}\n${getText(node)}\n\`\`\`\n\n`;
        break;
      }
      case 'image': {
        const src = node.attrs?.src || '';
        const alt = node.attrs?.alt || 'image';
        if (src.startsWith('data:')) {
          markdown += `![${alt}](embedded-image)\n\n`;
        } else {
          markdown += `![${alt}](${src})\n\n`;
        }
        break;
      }
      case 'horizontalRule': {
        markdown += `---\n\n`;
        break;
      }
      case 'table': {
        if (node.content) {
          node.content.forEach((row: any, rowIndex: number) => {
            if (row.content) {
              const cells = row.content.map((cell: any) => getText(cell));
              markdown += `| ${cells.join(' | ')} |\n`;
              if (rowIndex === 0) {
                markdown += `| ${cells.map(() => '---').join(' | ')} |\n`;
              }
            }
          });
          markdown += '\n';
        }
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
  if (node.text) return applyMarks(node.text, node.marks);
  if (!node.content) return '';
  
  return node.content.map((child: any) => getText(child)).join('');
}

function applyMarks(text: string, marks?: any[]): string {
  if (!marks) return text;
  
  marks.forEach((mark: any) => {
    switch (mark.type) {
      case 'bold':
        text = `**${text}**`;
        break;
      case 'italic':
        text = `_${text}_`;
        break;
      case 'strike':
        text = `~~${text}~~`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'link':
        text = `[${text}](${mark.attrs?.href || ''})`;
        break;
    }
  });
  
  return text;
}

export function exportScript(scriptData: ScriptData) {
  const version = scriptData.versions[scriptData.activeVersionId];
  if (!version) {
    alert('No active version to export.');
    return;
  }

  // Build the full document content from blocks
  let fullContent: any = { type: 'doc', content: [] };

  version.blockOrder.forEach((bId: string) => {
    const block = scriptData.blocks[bId];
    if (!block) return;
    
    const vId = version.activeVariants[bId] || block.defaultVariantId;
    const variant = block.variants[vId];
    if (!variant?.content) return;
    
    // Extract inner nodes from the doc wrapper
    if (variant.content.type === 'doc' && variant.content.content) {
      fullContent.content.push(...variant.content.content);
    }
  });

  if (fullContent.content.length === 0) {
    alert('No content to export. Write something first!');
    return;
  }

  const markdown = convertJsonToMarkdown(fullContent);

  // Build frontmatter
  let output = `---\ntitle: ${scriptData.title || 'Untitled'}\n`;
  if (scriptData.targetAudience) output += `audience: ${scriptData.targetAudience}\n`;
  if (scriptData.niche) output += `niche: ${scriptData.niche}\n`;
  output += `version: ${version.name}\n`;
  output += `date: ${new Date().toLocaleDateString()}\n---\n\n`;
  output += markdown;

  // Download
  const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (scriptData.title || 'script').replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  a.download = `${safeName}_${version.name.replace(/\s+/g, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
