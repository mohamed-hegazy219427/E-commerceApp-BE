import slugify from 'slugify';

export default function createSlug(value: string): string {
  return slugify(value, { lower: true, trim: true, replacement: '_' });
}
