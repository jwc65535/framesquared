/**
 * SourceViewer — Syntax-highlighted TypeScript source code panel.
 * No external dependencies; uses a simple regex tokenizer.
 */

export interface SourceViewerOptions {
  source: string;
  showLineNumbers?: boolean;
}

export class SourceViewer {
  private container: HTMLElement;

  constructor(container: HTMLElement, options: SourceViewerOptions) {
    this.container = container;
    this.render(options);
  }

  private tokenize(source: string): string {
    // Escape HTML entities first
    const escaped = source
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply syntax highlighting via regex replacements
    // Order matters: comments and strings first to prevent keyword matching inside them
    return escaped
      // Line comments
      .replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>')
      // Block comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
      // Template literals (simplified)
      .replace(/(`[^`]*`)/g, '<span class="tok-string">$1</span>')
      // Double-quoted strings
      .replace(/(&quot;[^&]*?&quot;)/g, '<span class="tok-string">$1</span>')
      // Single-quoted strings
      .replace(/('(?:[^'\\]|\\.)*')/g, '<span class="tok-string">$1</span>')
      // Decorators
      .replace(/(@\w+)/g, '<span class="tok-decorator">$1</span>')
      // Keywords
      .replace(/\b(import|export|from|class|extends|const|let|var|function|return|if|else|for|while|new|this|typeof|interface|type|enum|async|await|static|readonly|private|public|protected|override|default|null|undefined|true|false|void|in|of|break|continue|throw|try|catch|finally|switch|case|as|implements|declare)\b/g,
        '<span class="tok-keyword">$1</span>')
      // Built-in types
      .replace(/\b(string|number|boolean|object|any|never|unknown|symbol|bigint)\b/g,
        '<span class="tok-type">$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-number">$1</span>');
  }

  private render(options: SourceViewerOptions): void {
    const { source, showLineNumbers = true } = options;
    const lines = source.split('\n');
    const highlighted = this.tokenize(source);
    const highlightedLines = highlighted.split('\n');

    const wrapper = document.createElement('div');
    wrapper.className = 'source-viewer';

    const toolbar = document.createElement('div');
    toolbar.className = 'source-toolbar';
    toolbar.innerHTML = `
      <span class="source-lang">TypeScript</span>
      <button class="source-copy-btn" title="Copy to clipboard">Copy</button>
    `;
    wrapper.appendChild(toolbar);

    const pre = document.createElement('pre');
    pre.className = 'source-pre';

    if (showLineNumbers) {
      const lineNumbers = document.createElement('div');
      lineNumbers.className = 'source-line-numbers';
      lineNumbers.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');
      pre.appendChild(lineNumbers);
    }

    const codeWrapper = document.createElement('div');
    codeWrapper.className = 'source-code';
    const code = document.createElement('code');
    code.innerHTML = highlightedLines.join('\n');
    codeWrapper.appendChild(code);
    pre.appendChild(codeWrapper);
    wrapper.appendChild(pre);

    // Copy button handler
    toolbar.querySelector('.source-copy-btn')!.addEventListener('click', () => {
      navigator.clipboard.writeText(source).then(() => {
        const btn = toolbar.querySelector('.source-copy-btn') as HTMLButtonElement;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    });

    this.container.innerHTML = '';
    this.container.appendChild(wrapper);
  }
}
