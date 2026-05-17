export type GunaState = 'sattva' | 'rajas' | 'tamas';

export type InteractionType = 'pomodoro' | 'reflection' | 'note';

export interface Interaction {
  id: number;
  timestamp: number;
  duration_mins: number;
  guna_state: GunaState;
  type: InteractionType;
  score: number;
}

export interface NewInteraction {
  timestamp: number;
  duration_mins: number;
  guna_state: GunaState;
  type: InteractionType;
  score: number;
}

export interface MonthAggregate {
  month: number;
  guna_state: GunaState;
  total_mins: number;
}

export interface YearAggregate {
  year_of_life: number;
  total_mins: number;
}
