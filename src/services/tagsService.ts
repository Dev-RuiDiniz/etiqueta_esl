import { tagCategories, tagCorridors, tagsMock } from '../mocks/tags';
import type { Tag } from '../types/tags';
import { API_MODE, simulateNetwork } from './api';

export async function getTags(): Promise<Tag[]> {
  if (API_MODE !== 'mock') {
    return simulateNetwork([...tagsMock], { minMs: 400, maxMs: 900, failRate: 0.05 });
  }

  return simulateNetwork([...tagsMock], { minMs: 400, maxMs: 900, failRate: 0.05 });
}

export async function getTagById(tagId: string): Promise<Tag | null> {
  const tags = await getTags();
  return tags.find((tag) => tag.tagId === tagId) ?? null;
}

export async function getTagFilterOptions(): Promise<{ categories: string[]; corridors: string[] }> {
  return simulateNetwork({ categories: tagCategories, corridors: tagCorridors }, { minMs: 400, maxMs: 700, failRate: 0.03 });
}
