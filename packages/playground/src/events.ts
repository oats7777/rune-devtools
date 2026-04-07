import { CustomEventWithDetail } from 'rune-ts';

export class TodoToggled extends CustomEventWithDetail<{ completed: boolean }> {}
export class TodoDeleted extends CustomEventWithDetail<{ id: number }> {}
