/**
 * @framesquared/data – Connection
 *
 * Centralized fetch() wrapper.  Supports request and response
 * interceptors, default headers, and global error handling.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type RequestInterceptor = (url: string, init: RequestInit) => [string, RequestInit];
type ResponseInterceptor = (response: any) => any;
type ErrorHandler = (error: Error) => void;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
let defaultHeaders: Record<string, string> = {};
let errorHandler: ErrorHandler | null = null;

export const Connection = {
  /**
   * Fetch with interceptors and default headers applied.
   */
  async fetch(url: string, init: RequestInit = {}): Promise<any> {
    // Apply default headers
    init.headers = { ...defaultHeaders, ...(init.headers as Record<string, string> ?? {}) };

    // Apply request interceptors
    let currentUrl = url;
    let currentInit = init;
    for (const interceptor of requestInterceptors) {
      [currentUrl, currentInit] = interceptor(currentUrl, currentInit);
    }

    try {
      let response = await fetch(currentUrl, currentInit);

      // Apply response interceptors
      for (const interceptor of responseInterceptors) {
        response = interceptor(response);
      }

      return response;
    } catch (err: any) {
      if (errorHandler) errorHandler(err);
      throw err;
    }
  },

  addRequestInterceptor(fn: RequestInterceptor): void {
    requestInterceptors.push(fn);
  },

  addResponseInterceptor(fn: ResponseInterceptor): void {
    responseInterceptors.push(fn);
  },

  setDefaultHeaders(headers: Record<string, string>): void {
    defaultHeaders = { ...headers };
  },

  setErrorHandler(handler: ErrorHandler): void {
    errorHandler = handler;
  },

  reset(): void {
    requestInterceptors.length = 0;
    responseInterceptors.length = 0;
    defaultHeaders = {};
    errorHandler = null;
  },
};
