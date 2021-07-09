/**
 * Centralizes common test scenarios that are repeated in numerous tests.
 */
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
