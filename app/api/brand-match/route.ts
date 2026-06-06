import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import type { BrandMatchResult } from '@/types';

const SERP_API_KEY = process.env.SERP_API_KEY!;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

interface SerpProduct {
  title?: string;
  price?: string;
  link?: string;
  thumbnail?: string;
  source?: string;
}

async function fetchFromSerpAPI(query: string): Promise<BrandMatchResult[]> {
  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    api_key: SERP_API_KEY,
    num: '3',
  });

  const res = await fetch(`https://serpapi.com/search?${params.toString()}`);
  if (!res.ok) throw new Error('SerpAPI request failed');

  const data = await res.json();
  const products: SerpProduct[] = data.shopping_results ?? [];

  return products.slice(0, 3).map((p: SerpProduct) => ({
    title: p.title ?? '',
    price: p.price ?? '',
    link: p.link ?? '',
    thumbnail: p.thumbnail ?? '',
    source: p.source ?? '',
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { itemId, section } = await req.json();
    // section: { description, color, style_tags }

    if (!itemId || !section) {
      return NextResponse.json({ error: 'itemId and section are required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore.toString());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache in wishlist table — look for cached results within 24h
    const since = new Date(Date.now() - CACHE_DURATION_MS).toISOString();
    const { data: cached } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .gte('created_at', since)
      .limit(3);

    if (cached && cached.length >= 1) {
      const results: BrandMatchResult[] = cached.map((c) => ({
        title: c.product_title,
        price: c.price,
        link: c.product_url,
        thumbnail: c.product_image,
        source: c.brand,
      }));
      return NextResponse.json({ results, cached: true });
    }

    // Fetch fresh results from SerpAPI
    const query = `${section.color} ${section.description} buy`;
    const results = await fetchFromSerpAPI(query);

    // Cache in wishlist table
    if (results.length > 0) {
      await supabase.from('wishlist').insert(
        results.map((r) => ({
          user_id: user.id,
          item_id: itemId,
          product_title: r.title,
          product_url: r.link,
          product_image: r.thumbnail,
          price: r.price,
          brand: r.source,
        }))
      );
    }

    return NextResponse.json({ results, cached: false });
  } catch (err) {
    console.error('[brand-match]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
