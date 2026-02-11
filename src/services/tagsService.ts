import { tagsMock, type Tag } from '../mocks/tags';

const TAGS_MIN_DELAY_MS = 400;
const TAGS_MAX_DELAY_MS = 900;
const SHOULD_FAIL = false;
const FAILURE_CHANCE = 0.1;

function getRandomDelay() {
  return Math.floor(Math.random() * (TAGS_MAX_DELAY_MS - TAGS_MIN_DELAY_MS + 1)) + TAGS_MIN_DELAY_MS;
}

function shouldThrowError() {
  return SHOULD_FAIL || Math.random() < FAILURE_CHANCE;
}

export async function getTags(): Promise<Tag[]> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, getRandomDelay());
  });

  if (shouldThrowError()) {
    throw new Error('Erro ao carregar etiquetas');
  }

  return tagsMock;
}

export async function getTagById(tagId: string): Promise<Tag | null> {
  const tags = await getTags();
  return tags.find((tag) => tag.tagId === tagId) ?? null;
}
