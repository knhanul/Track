import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { appendLocationBatch, getActiveRecordId } from '../database/recordRepository';

export const LOCATION_TASK_NAME = 'nuni-life-background-location';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[location-task]', error.message);
    return;
  }

  const recordId = await getActiveRecordId();
  if (!recordId || !data) return;

  const payload = data as { locations?: Location.LocationObject[] };
  if (!payload.locations?.length) return;

  await appendLocationBatch(recordId, payload.locations);
});
