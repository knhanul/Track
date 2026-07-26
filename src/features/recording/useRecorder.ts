import { useCallback, useEffect, useRef, useState } from 'react';

import {
  completeLifeRecord,
  createLifeRecord,
  getActiveRecordId,
  getLiveMetrics,
  updateRecordStatus,
} from '../../database/recordRepository';
import type { LiveMetrics, RecorderController } from '../../domain/models';
import {
  requestTrackingPermissions,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../../location/locationService';

export function useRecorder(): RecorderController {
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async (recordId: string) => {
    setMetrics(await getLiveMetrics(recordId));
  }, []);

  useEffect(() => {
    if (!activeRecordId) return;
    void refresh(activeRecordId);
    pollTimer.current = setInterval(() => void refresh(activeRecordId), 1000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = null;
    };
  }, [activeRecordId, refresh]);

  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : '작업을 완료하지 못했습니다.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const restore = useCallback(async () => {
    const id = await getActiveRecordId();
    if (!id) return;
    setActiveRecordId(id);
    await refresh(id);
  }, [refresh]);

  const start = useCallback(async () => {
    await run(async () => {
      await requestTrackingPermissions();
      const id = await createLifeRecord();
      setActiveRecordId(id);
      await startBackgroundTracking();
      await refresh(id);
    });
  }, [refresh, run]);

  const pause = useCallback(async () => {
    if (!activeRecordId) return;
    await run(async () => {
      await stopBackgroundTracking();
      await updateRecordStatus(activeRecordId, 'paused');
      await refresh(activeRecordId);
    });
  }, [activeRecordId, refresh, run]);

  const resume = useCallback(async () => {
    if (!activeRecordId) return;
    await run(async () => {
      await updateRecordStatus(activeRecordId, 'recording');
      await startBackgroundTracking();
      await refresh(activeRecordId);
    });
  }, [activeRecordId, refresh, run]);

  const stop = useCallback(async () => {
    if (!activeRecordId) return;
    await run(async () => {
      await stopBackgroundTracking();
      await completeLifeRecord(activeRecordId);
      setMetrics(null);
      setActiveRecordId(null);
    });
  }, [activeRecordId, run]);

  return {
    activeRecordId,
    metrics,
    busy,
    error,
    restore,
    start,
    pause,
    resume,
    stop,
  };
}
