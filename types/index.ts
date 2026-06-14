export interface Profile {
  id: string;
  username: string | null;
  is_public: boolean;
  skin_tone: 'warm' | 'cool' | 'neutral' | 'deep' | null;
  body_type: string | null;
  height_range: string | null;
  style_tags: string[] | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AiSection {
  detected: boolean;
  description: string;
  color: string;
  style_tags: string[];
  dominant_color_hex: string;
}

export interface AiAccessories {
  detected: boolean;
  items: string[];
  style_tags: string[];
  impact: string;
}

export interface AiSections {
  sections: {
    top: AiSection;
    bottom: AiSection;
    shoes: AiSection;
    accessories: AiAccessories;
  };
  opening_line?: string;
  overall_style: string[];
  color_palette: string[];
  fit_notes: string;
  one_improvement: string;
  improvement_category: string;
  style_confidence_score: number;
  occasion_fit: string[];
  style_signals?: string[];
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  is_public: boolean;
  ai_sections: AiSections | null;
  style_tags: string[] | null;
  category: 'outfit' | 'top' | 'bottom' | 'shoes' | 'accessory' | null;
  notes: string | null;
  created_at: string;
}

export interface Like {
  user_id: string;
  item_id: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  item_id: string;
  product_title: string;
  product_url: string;
  product_image: string;
  price: string;
  brand: string;
  created_at: string;
}

export interface BrandMatchResult {
  title: string;
  price: string;
  link: string;
  thumbnail: string;
  source: string;
}

export type StyleTag =
  | 'casual'
  | 'formal'
  | 'streetwear'
  | 'minimalist'
  | 'Y2K'
  | 'bohemian'
  | 'preppy'
  | 'athleisure'
  | 'vintage'
  | 'techwear';
