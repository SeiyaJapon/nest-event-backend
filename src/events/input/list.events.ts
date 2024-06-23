export class ListEvents {
  when?: WhenEventFilter.All;
}

export enum WhenEventFilter {
  All = 1,
  Today = 2,
  Tomorrow = 3,
  ThisWeek = 4,
  NextWeek = 5,
}