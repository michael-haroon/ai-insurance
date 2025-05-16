// global.d.ts (or types/pdfjs-legacy.d.ts)
declare module 'pdfjs-dist/legacy/build/pdf.js' {
    // you can tighten these types if you like,
    // but `any` works for a quick fix:
    export function getDocument(params: any): { promise: Promise<any> };
    export const GlobalWorkerOptions: { workerSrc: string };
  }