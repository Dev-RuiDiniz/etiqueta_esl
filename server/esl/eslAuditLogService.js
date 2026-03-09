export class EslAuditLogService {
  constructor({ commandLogRepo }) {
    this.commandLogRepo = commandLogRepo;
  }

  record(entry) {
    return this.commandLogRepo.addCommandLog(entry);
  }

  list(limit = 100) {
    return this.commandLogRepo.listCommandLogs(limit);
  }
}
