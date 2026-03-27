import type { EslProductListItem, EslTemplateSummary } from '../types/esl';

export const templateFieldDefinitions = [
  { key: 'product_code', label: 'Código do produto', type: 'text', placeholder: 'Ex: 789000000001' },
  { key: 'product_name', label: 'Nome do produto', type: 'text', placeholder: 'Ex: Arroz Integral 1kg' },
  { key: 'price', label: 'Preço', type: 'number', placeholder: 'Ex: 12.90' },
  { key: 'quantity', label: 'Quantidade', type: 'number', placeholder: 'Ex: 1' },
  { key: 'unit', label: 'Unidade', type: 'text', placeholder: 'Ex: un, kg, L' },
  { key: 'vip_price', label: 'Preço VIP', type: 'number', placeholder: 'Ex: 10.90' },
  { key: 'origin_price', label: 'Preço original', type: 'number', placeholder: 'Ex: 14.90' },
  { key: 'promotion', label: 'Promoção', type: 'text', placeholder: 'Ex: OFERTA' },
  { key: 'spec', label: 'Especificação', type: 'text', placeholder: 'Ex: Pacote 1kg' },
  { key: 'grade', label: 'Grade', type: 'text', placeholder: 'Ex: Premium' },
  { key: 'origin', label: 'Origem', type: 'text', placeholder: 'Ex: Brasil' },
  { key: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ex: Marca X' },
  { key: 'qrcode', label: 'QR Code', type: 'text', placeholder: 'URL ou código QR' },
  { key: 'f1', label: 'Campo customizado f1', type: 'text', placeholder: 'Valor livre' },
  { key: 'f2', label: 'Campo customizado f2', type: 'text', placeholder: 'Valor livre' },
  { key: 'f3', label: 'Campo customizado f3', type: 'text', placeholder: 'Valor livre' },
  { key: 'f4', label: 'Campo customizado f4', type: 'text', placeholder: 'Valor livre' },
  { key: 'f5', label: 'Campo customizado f5', type: 'text', placeholder: 'Valor livre' },
  { key: 'f6', label: 'Campo customizado f6', type: 'text', placeholder: 'Valor livre' },
  { key: 'f7', label: 'Campo customizado f7', type: 'text', placeholder: 'Valor livre' },
  { key: 'f8', label: 'Campo customizado f8', type: 'text', placeholder: 'Valor livre' },
  { key: 'f9', label: 'Campo customizado f9', type: 'text', placeholder: 'Valor livre' },
  { key: 'f10', label: 'Campo customizado f10', type: 'text', placeholder: 'Valor livre' },
  { key: 'f11', label: 'Campo customizado f11', type: 'text', placeholder: 'Valor livre' },
  { key: 'f12', label: 'Campo customizado f12', type: 'text', placeholder: 'Valor livre' },
  { key: 'f13', label: 'Campo customizado f13', type: 'text', placeholder: 'Valor livre' },
  { key: 'f14', label: 'Campo customizado f14', type: 'text', placeholder: 'Valor livre' },
  { key: 'f15', label: 'Campo customizado f15', type: 'text', placeholder: 'Valor livre' },
  { key: 'f16', label: 'Campo customizado f16', type: 'text', placeholder: 'Valor livre' }
] as const;

export type TemplateFieldKey = (typeof templateFieldDefinitions)[number]['key'];
export type TemplatePayloadForm = Record<TemplateFieldKey, string> & { extend: string };

export type TemplateFieldProfile = {
  title: string;
  description: string;
  fields: TemplateFieldKey[];
  allowExtend?: boolean;
  fieldLabels?: Partial<Record<TemplateFieldKey, string>>;
};

const templateFieldProfilesById: Record<number, TemplateFieldProfile> = {
  15218: {
    title: 'Preço Normal',
    description: 'Campos reais extraídos do layout: Produto, Valor e Código de barras. O texto "R$" é fixo no template.',
    fields: ['product_name', 'price', 'product_code'],
    fieldLabels: {
      product_name: 'Produto',
      price: 'Valor',
      product_code: 'Codigo de barras'
    }
  }
};

const fallbackTemplateFieldProfilesByType: Record<string, TemplateFieldProfile> = {
  'ESL-42R': {
    title: 'Template 42R',
    description: 'Perfil padrão para etiquetas 42R.',
    fields: ['product_name', 'price', 'origin_price', 'promotion', 'unit', 'quantity', 'f1']
  },
  'ESL-21R': {
    title: 'Template 21R',
    description: 'Perfil padrão para etiquetas pequenas.',
    fields: ['product_name', 'price', 'unit']
  }
};

const genericTemplateFieldProfile: TemplateFieldProfile = {
  title: 'Template sem mapeamento',
  description: 'Template ainda não mapeado. O sistema mostra todos os campos conhecidos do payload do produto.',
  fields: templateFieldDefinitions.map((field) => field.key),
  allowExtend: true
};

export function createEmptyTemplatePayloadForm(): TemplatePayloadForm {
  const entries = templateFieldDefinitions.map((field) => [field.key, ''] as const);
  return Object.fromEntries([...entries, ['extend', '']]) as TemplatePayloadForm;
}

export function productToTemplatePayload(product?: EslProductListItem): TemplatePayloadForm {
  const form = createEmptyTemplatePayloadForm();

  if (!product) {
    return form;
  }

  form.product_name = product.product_name ?? '';
  form.product_code = product.product_code ?? '';
  form.price = Number.isFinite(product.price) ? String(product.price) : '';
  form.quantity = product.quantity != null ? String(product.quantity) : '';

  return form;
}

export function resolveTemplateFieldProfile(template?: EslTemplateSummary | null): TemplateFieldProfile {
  if (!template) {
    return genericTemplateFieldProfile;
  }

  const byId = templateFieldProfilesById[template.id];
  if (byId) {
    return byId;
  }

  const templateType = template.esltype_code ?? '';
  if (templateType && fallbackTemplateFieldProfilesByType[templateType]) {
    return fallbackTemplateFieldProfilesByType[templateType];
  }

  return genericTemplateFieldProfile;
}
