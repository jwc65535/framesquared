import { ViewModel } from '@framesquared/app';

export class MainViewModel extends ViewModel {
  constructor() {
    super({ data: { lastEvent: '', eventCount: 0 } });
  }
  getLastEvent():  string { return this.get('lastEvent')  as string; }
  getEventCount(): number { return this.get('eventCount') as number; }
}
