import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { copiedText: '', pasteCount: 0 } });
  }
  getCopiedText(): string { return this.get('copiedText') as string; }
  getPasteCount(): number { return this.get('pasteCount') as number; }
}
