import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({
      data: {
        selectedCount: 0,
        lastSelected:  '',
        mode:          'MULTI' as 'SINGLE' | 'MULTI',
      },
    });
  }

  getSelectedCount(): number {
    return this.get('selectedCount') as number;
  }

  getLastSelected(): string {
    return this.get('lastSelected') as string;
  }

  getMode(): string {
    return this.get('mode') as string;
  }
}
