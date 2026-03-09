// Dead-letter queue em memória para comandos que excederam tentativas.
const deadLetters = [];

function buildId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `DLQ-${Date.now()}-${random}`;
}

export function addDeadLetter(entry) {
  const record = {
    id: buildId(),
    created_at: new Date().toISOString(),
    attempts: entry.attempts ?? 0,
    ...entry
  };

  deadLetters.unshift(record);

  if (deadLetters.length > 2000) {
    deadLetters.length = 2000;
  }

  return record;
}

export function listDeadLetters(limit = 100) {
  return deadLetters.slice(0, Math.max(1, limit));
}

export function removeDeadLetter(deadLetterId) {
  const index = deadLetters.findIndex((item) => item.id === deadLetterId);

  if (index === -1) {
    return null;
  }

  const [removed] = deadLetters.splice(index, 1);
  return removed;
}
