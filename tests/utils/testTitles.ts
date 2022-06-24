// TODO: Get rid of this. Not as useful as initially thought.
export class TestTitle {
  static Authentication = class {
    static readonly context = 'end user is unauthenticated'
    static readonly throwsError = 'throws authentication error'
  }

  static ScheduleNotFound = class {
    static readonly context =
      'no schedule in the cms database corresponding to the provided room id'
    static readonly throwsError = 'throws "schedule not found" error'
  }
}
