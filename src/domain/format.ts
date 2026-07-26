export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function formatDistance(distanceM: number): string {
  return (Math.max(0, distanceM) / 1000).toFixed(2);
}

export function formatSpeed(speedKph: number): string {
  return Math.max(0, speedKph).toFixed(1);
}

export function formatElevation(elevationM: number): string {
  return Math.round(Math.max(0, elevationM)).toLocaleString('ko-KR');
}
