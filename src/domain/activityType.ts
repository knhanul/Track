export type ActivityType =
  | 'cycling'
  | 'walking'
  | 'running'
  | 'hiking'
  | 'trail_running'
  | 'unknown';

export type SelectableActivityType = Exclude<ActivityType, 'unknown'>;

export interface ActivityTypeOption {
  type: SelectableActivityType;
  label: string;
  description: string;
}

export const ACTIVITY_TYPE_OPTIONS: ActivityTypeOption[] = [
  {
    type: 'cycling',
    label: '자전거',
    description: '라이딩 경로와 속도를 기록해요.',
  },
  {
    type: 'walking',
    label: '산책',
    description: '걷는 거리와 시간을 기록해요.',
  },
  {
    type: 'running',
    label: '러닝',
    description: '러닝 거리와 페이스를 기록해요.',
  },
  {
    type: 'hiking',
    label: '등산',
    description: '산행 경로와 올라간 높이를 기록해요.',
  },
  {
    type: 'trail_running',
    label: '트레일러닝',
    description: '산길 러닝의 거리와 고도를 기록해요.',
  },
];

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  cycling: '자전거',
  walking: '산책',
  running: '러닝',
  hiking: '등산',
  trail_running: '트레일러닝',
  unknown: '활동 미지정',
};

export function formatActivityType(type: ActivityType): string {
  return ACTIVITY_LABELS[type];
}

export function isSelectableActivityType(type: ActivityType): type is SelectableActivityType {
  return type !== 'unknown';
}
