export interface FilterState {
  fresh: boolean;
  onSale: boolean;
  maxPrice: number;
  dynamic: Record<string, string[]>;
}

export const CATEGORY_DYNAMIC_FILTERS: Record<
  string,
  { name: string; key: string; options: string[] }[]
> = {
  paint: [
    {
      name: 'Finish',
      key: 'finish',
      options: ['Matte', 'Gloss', 'Satin', 'Metallic'],
    },
    {
      name: 'Set Size',
      key: 'size',
      options: ['Single Tube', '6-Set', '12-Set', '24-Set'],
    },
  ],
  'stitch-sew': [
    {
      name: 'Material',
      key: 'material',
      options: ['Cotton', 'Wool', 'Linen', 'Blend'],
    },
    {
      name: 'Skill Level',
      key: 'skill',
      options: ['Beginner', 'Intermediate', 'Advanced'],
    },
  ],
  clay: [
    {
      name: 'Clay Type',
      key: 'clay_type',
      options: ['Air-Dry', 'Polymer', 'Ceramic', 'Pottery Tool'],
    },
  ],
  sketch: [
    {
      name: 'Medium',
      key: 'medium',
      options: ['Graphite', 'Ink', 'Charcoal', 'Mixed Media'],
    },
  ],
  kids: [
    {
      name: 'Age Group',
      key: 'age',
      options: ['Ages 3–5', 'Ages 6–9', 'Ages 10+'],
    },
  ],
  'diy-kits': [
    {
      name: 'Craft Type',
      key: 'craft_type',
      options: ['Crochet', 'Painting', 'Embroidery', 'Pottery'],
    },
  ],
  bundles: [
    {
      name: 'Bundle Type',
      key: 'bundle_type',
      options: ['Gift Box', 'Workshop Kit', 'Starter Stash'],
    },
  ],
};
