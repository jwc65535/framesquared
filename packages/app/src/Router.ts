/**
 * @framesquared/app – Router
 *
 * Hash-based routing using the hashchange event.  Routes are
 * patterns like 'user/:id' that extract named parameters.
 * Supports wildcard routes, before-route guards, and navigateTo.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RouteEntry {
  pattern: string;
  paramNames: string[];
  regex: RegExp;
  handler: (params: Record<string, string>) => void;
  wildcard: string | null;
}

let routes: RouteEntry[] = [];
let beforeRouteFn: ((hash: string) => boolean) | null = null;
let hashListener: ((e: Event) => void) | null = null;
let started = false;

function compileRoute(pattern: string): {
  paramNames: string[];
  regex: RegExp;
  wildcard: string | null;
} {
  const paramNames: string[] = [];
  let wildcard: string | null = null;

  let regexStr = '^';
  const parts = pattern.split('/');

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i > 0) regexStr += '\\/';

    if (part.startsWith('*')) {
      // Wildcard — captures everything after this point
      wildcard = part.slice(1);
      paramNames.push(wildcard);
      regexStr += '(.+)';
      break; // wildcard consumes the rest
    } else if (part.startsWith(':')) {
      paramNames.push(part.slice(1));
      regexStr += '([^\\/]+)';
    } else {
      regexStr += part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }

  regexStr += '$';
  return { paramNames, regex: new RegExp(regexStr), wildcard };
}

function onHashChange(): void {
  const hash = Router.getCurrentHash();

  // Before route guard
  if (beforeRouteFn && beforeRouteFn(hash) === false) return;

  for (const route of routes) {
    const match = hash.match(route.regex);
    if (match) {
      const params: Record<string, string> = {};
      for (let i = 0; i < route.paramNames.length; i++) {
        params[route.paramNames[i]] = match[i + 1] ?? '';
      }
      route.handler(params);
      return;
    }
  }
}

export const Router = {
  addRoute(pattern: string, handler: (params: Record<string, string>) => void): void {
    const { paramNames, regex, wildcard } = compileRoute(pattern);
    routes.push({ pattern, paramNames, regex, handler, wildcard });
  },

  getRoutes(): RouteEntry[] {
    return [...routes];
  },

  start(): void {
    if (started) return;
    started = true;
    hashListener = () => onHashChange();
    window.addEventListener('hashchange', hashListener);
  },

  stop(): void {
    if (hashListener) {
      window.removeEventListener('hashchange', hashListener);
      hashListener = null;
    }
    started = false;
    routes = [];
    beforeRouteFn = null;
  },

  setBeforeRoute(fn: ((hash: string) => boolean) | null): void {
    beforeRouteFn = fn;
  },

  navigateTo(hash: string): void {
    window.location.hash = hash;
  },

  getCurrentHash(): string {
    return window.location.hash.replace(/^#\/?/, '');
  },
};
