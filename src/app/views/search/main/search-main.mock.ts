import { MainSessionDto } from '../../../model/request.model';

const APP_NAMES   = ['api-gateway', 'auth-service', 'user-service', 'order-service', 'payment-service', 'notification-service', 'report-service', 'batch-runner', 'data-sync', 'scheduler'];
const LOCATIONS   = ['/api/v1/users', '/api/v1/orders', '/api/v1/products', '/api/v1/payments', '/api/v1/reports', '/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/notifications', '/api/v1/batch/run', '/api/v1/sync'];
const NAMES       = ['MainRequest', 'BackgroundJob', 'ScheduledTask', 'AsyncProcess', 'SyncWorker', 'EventHandler', 'DataProcessor', 'FileExporter', 'CacheRefresh', 'CleanupTask'];
const USERS       = ['alice', 'bob', 'charlie', 'diana', 'ethan', 'fiona', 'george', 'hannah', 'ivan', 'julia', 'admin', 'system', 'batch', 'scheduler', null];
const EXCEPTIONS  = [
  { type: 'java.lang.NullPointerException',       message: 'Cannot invoke method on null object' },
  { type: 'java.sql.SQLException',                message: 'Connection timeout exceeded' },
  { type: 'java.io.IOException',                  message: 'File not found: /tmp/data.csv' },
  { type: 'java.lang.IllegalArgumentException',   message: 'Invalid parameter: pageSize must be > 0' },
  { type: 'org.springframework.web.HttpException', message: '503 Service Unavailable' },
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.trunc(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function generateMockMainSessions(count = 2000): MainSessionDto[] {
  const now = Math.floor(Date.now() / 1000);
  const results: MainSessionDto[] = [];

  for (let i = 0; i < count; i++) {
    const start = now - randInt(0, 7 * 24 * 3600);
    const durationSeconds = randInt(1, 3600);

    const roll = Math.random();
    const isInProgress = roll < 0.1;
    const isKO         = !isInProgress && roll < 0.25;

    const end: number | null = isInProgress ? null : start + durationSeconds;
    const exception = isKO ? { ...rand(EXCEPTIONS), stackTraceRows: [], cause: null } : null;

    results.push({
      id:          uuid(),
      sessionId:   uuid(),
      instanceId:  uuid(),
      user:        rand(USERS) ?? '',
      start,
      end,
      threadName:  `thread-${randInt(1, 50)}`,
      command:     'MAIN',
      name:        rand(NAMES),
      type:        rand(['VIEW', 'SERVER']),
      location:    rand(LOCATIONS),
      exception,
      requestsMask: randInt(0, 15),
      appName:     rand(APP_NAMES),
    } as MainSessionDto);
  }

  return results.sort((a, b) => b.start - a.start);
}
