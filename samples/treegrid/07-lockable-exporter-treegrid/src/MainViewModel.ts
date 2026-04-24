import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { lastExportFormat: '', exportCount: 0 } });
  }
  getLastExportFormat(): string { return this.get('lastExportFormat') as string; }
  getExportCount(): number      { return this.get('exportCount') as number; }
}
