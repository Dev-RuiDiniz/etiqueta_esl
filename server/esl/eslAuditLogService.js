import { addCommandLog, listCommandLogs } from '../db/eslCommandLogRepo.js';

export class EslAuditLogService {
  record(entry) {
    return addCommandLog(entry);
  }

  list(limit = 100) {
    return listCommandLogs(limit);
  }
}
