import { tagCategories, tagCorridors, tagsMock } from '../mocks/tags';
import type { Tag } from '../types/tags';
import { API_MODE, simulateNetwork } from './api';
import { mapStatusSnapshotToTag } from './esl/mapper';
import { queryEslStatus } from './esl/statusService';

export async function getTags(): Promise<Tag[]> {
  if (API_MODE !== 'mock') {
    // Modo real: usa snapshots do BFF e normaliza para o contrato de Tag da UI.
    const result = await queryEslStatus(1, 200);

    if (!result.success) {
      throw new Error(result.error_msg || 'Falha ao carregar etiquetas do ESL BFF.');
    }

    return (result.data ?? []).map((snapshot) => mapStatusSnapshotToTag(snapshot));
  }

  return simulateNetwork([...tagsMock], { minMs: 400, maxMs: 900, failRate: 0.05 });
}

export async function getTagById(tagId: string): Promise<Tag | null> {
  const tags = await getTags();
  return tags.find((tag) => tag.tagId === tagId) ?? null;
}

export async function getTagFilterOptions(): Promise<{ categories: string[]; corridors: string[] }> {
  if (API_MODE !== 'mock') {
    // Em integração real, filtros são derivados dos dados retornados pelo BFF.
    const tags = await getTags();

    const categories = Array.from(new Set(tags.map((tag) => tag.category))).sort();
    const corridors = Array.from(new Set(tags.map((tag) => tag.corridor))).sort();

    return { categories, corridors };
  }

  return simulateNetwork({ categories: tagCategories, corridors: tagCorridors }, { minMs: 400, maxMs: 700, failRate: 0.03 });
}
