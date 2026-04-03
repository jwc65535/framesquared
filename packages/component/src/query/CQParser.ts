/**
 * @framesquared/component – CQParser
 *
 * Parses Component Query selector strings into an AST.
 *
 * Grammar:
 *   selectorList = compound ( ',' compound )*
 *   combinatorExpr = compound ( combinator compound )*
 *   combinator = ' ' | '>' | '~' | '+'
 *   compound = simpleSelector+
 *   simpleSelector = typeSelector | idSelector | classSelector |
 *                    attributeSelector | pseudoSelector | methodSelector
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// AST node types
// ---------------------------------------------------------------------------

export interface TypeSelectorNode {
  type: 'type';
  value: string;
}

export interface IdSelectorNode {
  type: 'id';
  value: string;
}

export interface ClassSelectorNode {
  type: 'class';
  value: string;
}

export interface AttributeSelectorNode {
  type: 'attribute';
  name: string;
  operator?: string; // '=', '!=', '>', '<', '>=', '<='
  value?: string;
}

export interface PseudoSelectorNode {
  type: 'pseudo';
  name: string;
  argument?: string | SelectorNode;
}

export interface MethodSelectorNode {
  type: 'method';
  value: string;
}

export interface CompoundSelectorNode {
  type: 'compound';
  selectors: any[]; // simple selector nodes
}

export interface CombinatorNode {
  type: 'combinator';
  combinator: string; // ' ', '>', '~', '+'
  left: SelectorNode;
  right: SelectorNode;
}

export interface SelectorListNode {
  type: 'list';
  items: SelectorNode[];
}

export type SimpleSelectorNode =
  | TypeSelectorNode
  | IdSelectorNode
  | ClassSelectorNode
  | AttributeSelectorNode
  | PseudoSelectorNode
  | MethodSelectorNode;

export type SelectorNode = CompoundSelectorNode | CombinatorNode | SelectorListNode;

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

interface Token {
  type:
    | 'ident'
    | 'hash'
    | 'dot'
    | 'bracket'
    | 'colon'
    | 'brace'
    | 'combinator'
    | 'comma'
    | 'whitespace';
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      // Collapse whitespace; emit only if between meaningful tokens
      while (i < input.length && /\s/.test(input[i])) i++;
      if (tokens.length > 0 && i < input.length) {
        tokens.push({ type: 'whitespace', value: ' ' });
      }
      continue;
    }

    // Comma
    if (ch === ',') {
      // Remove trailing whitespace token
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'whitespace') {
        tokens.pop();
      }
      tokens.push({ type: 'comma', value: ',' });
      i++;
      continue;
    }

    // Combinators: >, ~, +
    if (ch === '>' || ch === '~' || ch === '+') {
      // Remove trailing whitespace
      if (tokens.length > 0 && tokens[tokens.length - 1].type === 'whitespace') {
        tokens.pop();
      }
      tokens.push({ type: 'combinator', value: ch });
      i++;
      // Skip leading whitespace after combinator
      while (i < input.length && /\s/.test(input[i])) i++;
      continue;
    }

    // #id
    if (ch === '#') {
      i++;
      let id = '';
      while (i < input.length && /[\w-]/.test(input[i])) {
        id += input[i++];
      }
      tokens.push({ type: 'hash', value: id });
      continue;
    }

    // .class
    if (ch === '.') {
      i++;
      let cls = '';
      while (i < input.length && /[\w-]/.test(input[i])) {
        cls += input[i++];
      }
      tokens.push({ type: 'dot', value: cls });
      continue;
    }

    // [attribute...]
    if (ch === '[') {
      i++;
      let content = '';
      let depth = 1;
      while (i < input.length && depth > 0) {
        if (input[i] === '[') depth++;
        else if (input[i] === ']') depth--;
        if (depth > 0) content += input[i];
        i++;
      }
      tokens.push({ type: 'bracket', value: content });
      continue;
    }

    // :pseudo
    if (ch === ':') {
      i++;
      let name = '';
      while (i < input.length && /[\w-]/.test(input[i])) {
        name += input[i++];
      }
      // Capture argument in parens
      let arg = '';
      if (i < input.length && input[i] === '(') {
        i++;
        let depth = 1;
        while (i < input.length && depth > 0) {
          if (input[i] === '(') depth++;
          else if (input[i] === ')') depth--;
          if (depth > 0) arg += input[i];
          i++;
        }
      }
      tokens.push({ type: 'colon', value: name + (arg ? `(${arg})` : '') });
      continue;
    }

    // {method}
    if (ch === '{') {
      i++;
      let name = '';
      while (i < input.length && input[i] !== '}') {
        name += input[i++];
      }
      if (i < input.length) i++; // skip '}'
      tokens.push({ type: 'brace', value: name });
      continue;
    }

    // Identifier (xtype)
    if (/[\w-]/.test(ch)) {
      let ident = '';
      while (i < input.length && /[\w-]/.test(input[i])) {
        ident += input[i++];
      }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }

    // Unknown character — skip
    i++;
  }

  // Remove trailing whitespace
  if (tokens.length > 0 && tokens[tokens.length - 1].type === 'whitespace') {
    tokens.pop();
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export class CQParser {
  private tokens: Token[];
  private pos: number;

  private constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  static parse(selector: string): SelectorNode {
    selector = selector.trim();
    if (!selector) throw new Error('CQ: empty selector');

    const tokens = tokenize(selector);
    if (tokens.length === 0) throw new Error(`CQ: invalid selector "${selector}"`);

    const parser = new CQParser(tokens);
    return parser.parseSelectorList();
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  // selectorList = combinatorExpr ( ',' combinatorExpr )*
  private parseSelectorList(): SelectorNode {
    const first = this.parseCombinatorExpr();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!this.peek() || this.peek()!.type !== 'comma') return first;

    const items: SelectorNode[] = [first];
    while (this.peek()?.type === 'comma') {
      this.advance(); // consume ','
      // Skip whitespace after comma
      while (this.peek()?.type === 'whitespace') this.advance();
      items.push(this.parseCombinatorExpr());
    }
    return { type: 'list', items } as SelectorListNode;
  }

  // combinatorExpr = compound ( (combinator | whitespace) compound )*
  private parseCombinatorExpr(): SelectorNode {
    let left: SelectorNode = this.parseCompound();

    while (this.peek()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tok = this.peek()!;

      if (tok.type === 'combinator') {
        const combinator = this.advance().value;
        const right = this.parseCompound();
        left = { type: 'combinator', combinator, left, right } as CombinatorNode;
      } else if (tok.type === 'whitespace') {
        this.advance(); // consume whitespace
        // Check if the next token is a combinator
        const next = this.peek();
        if (!next || next.type === 'comma') break;
        if (next.type === 'combinator') continue; // let the loop pick it up
        const right = this.parseCompound();
        left = { type: 'combinator', combinator: ' ', left, right } as CombinatorNode;
      } else {
        break;
      }
    }

    return left;
  }

  // compound = simpleSelector+
  private parseCompound(): CompoundSelectorNode {
    const selectors: SimpleSelectorNode[] = [];

    while (this.peek()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tok = this.peek()!;

      if (tok.type === 'ident') {
        selectors.push({ type: 'type', value: this.advance().value });
      } else if (tok.type === 'hash') {
        selectors.push({ type: 'id', value: this.advance().value });
      } else if (tok.type === 'dot') {
        selectors.push({ type: 'class', value: this.advance().value });
      } else if (tok.type === 'bracket') {
        selectors.push(this.parseAttribute(this.advance().value));
      } else if (tok.type === 'colon') {
        selectors.push(this.parsePseudo(this.advance().value));
      } else if (tok.type === 'brace') {
        selectors.push({ type: 'method', value: this.advance().value });
      } else {
        break;
      }
    }

    if (selectors.length === 0) {
      throw new Error('CQ: expected selector');
    }

    return { type: 'compound', selectors };
  }

  // [name], [name=value], [name>5], [name>=5], [name<5], [name<=5], [name!=v]
  private parseAttribute(content: string): AttributeSelectorNode {
    // Match operator: >=, <=, !=, >, <, =
    const opMatch = content.match(/^([\w-]+)\s*(>=|<=|!=|>|<|=)\s*(.*)$/);
    if (opMatch) {
      let val = opMatch[3].trim();
      // Strip quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      return { type: 'attribute', name: opMatch[1], operator: opMatch[2], value: val };
    }
    // Existence only
    return { type: 'attribute', name: content.trim() };
  }

  // :name or :name(arg)
  private parsePseudo(raw: string): PseudoSelectorNode {
    const parenIdx = raw.indexOf('(');
    if (parenIdx === -1) {
      return { type: 'pseudo', name: raw };
    }
    const name = raw.slice(0, parenIdx);
    const argStr = raw.slice(parenIdx + 1, -1); // strip parens

    // :not() gets its argument parsed as a selector
    if (name === 'not') {
      const inner = CQParser.parse(argStr);
      return { type: 'pseudo', name: 'not', argument: inner };
    }

    return { type: 'pseudo', name, argument: argStr };
  }
}
