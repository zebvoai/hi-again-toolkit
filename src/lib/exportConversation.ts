import type { Message } from '@/types';
import { formatModelName } from '@/lib/utils';

export const exportAsMarkdown = (messages: Message[], title: string): void => {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let markdown = `# ${title}\n\n*Exported on ${date}*\n\n---\n\n`;

  messages.forEach((message) => {
    const role = message.role === 'user' ? '## 👤 User' : `## 🤖 Assistant`;
    const model = message.metadata?.model ? ` (${formatModelName(message.metadata.model)})` : '';
    
    let content = '';
    if (typeof message.content === 'string') {
      content = message.content;
    } else if (typeof message.content === 'object') {
      // Multi-model response
      Object.entries(message.content).forEach(([modelName, modelContent]) => {
        content += `\n### ${formatModelName(modelName)}\n\n${modelContent}\n`;
      });
    }

    markdown += `${role}${model}\n\n${content}\n\n---\n\n`;
  });

  downloadFile(markdown, `${sanitizeFilename(title)}.md`, 'text/markdown');
};

export const exportAsJSON = (messages: Message[], title: string): void => {
  const exportData = {
    title,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      model: msg.metadata?.model,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  downloadFile(json, `${sanitizeFilename(title)}.json`, 'application/json');
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
};
