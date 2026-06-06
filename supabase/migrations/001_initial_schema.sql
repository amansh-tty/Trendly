-- ============================================================
-- Wardrobe App — Initial Schema
-- ============================================================

-- Profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique,
  is_public boolean default false,
  skin_tone text,           -- warm/cool/neutral/deep
  body_type text,
  height_range text,
  style_tags text[],
  avatar_url text,
  created_at timestamptz default now()
);

-- Wardrobe items
create table if not exists wardrobe_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  image_url text not null,
  is_public boolean default false,
  ai_sections jsonb,        -- {top, bottom, shoes, accessories} with analysis
  style_tags text[],
  category text,            -- outfit | top | bottom | shoes | accessory
  notes text,
  created_at timestamptz default now()
);

-- Liked items (feed personalization)
create table if not exists likes (
  user_id uuid references profiles(id),
  item_id uuid references wardrobe_items(id),
  primary key (user_id, item_id)
);

-- Wishlist (brand-matched products, also used as cache)
create table if not exists wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  item_id uuid references wardrobe_items(id),
  product_title text,
  product_url text,
  product_image text,
  price text,
  brand text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table profiles enable row level security;
alter table wardrobe_items enable row level security;
alter table likes enable row level security;
alter table wishlist enable row level security;

-- ---------- profiles ----------
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Public profiles are viewable by all"
  on profiles for select
  using (is_public = true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------- wardrobe_items ----------
create policy "Users can view their own items"
  on wardrobe_items for select
  using (auth.uid() = user_id);

create policy "Public items are viewable by all"
  on wardrobe_items for select
  using (is_public = true);

create policy "Users can insert their own items"
  on wardrobe_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on wardrobe_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own items"
  on wardrobe_items for delete
  using (auth.uid() = user_id);

-- ---------- likes ----------
create policy "Users can view all likes"
  on likes for select
  using (true);

create policy "Users can manage their own likes"
  on likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on likes for delete
  using (auth.uid() = user_id);

-- ---------- wishlist ----------
create policy "Users can view their own wishlist"
  on wishlist for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own wishlist"
  on wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own wishlist"
  on wishlist for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_wardrobe_items_user_id on wardrobe_items(user_id);
create index if not exists idx_wardrobe_items_is_public on wardrobe_items(is_public);
create index if not exists idx_wardrobe_items_category on wardrobe_items(category);
create index if not exists idx_wardrobe_items_created_at on wardrobe_items(created_at desc);
create index if not exists idx_likes_user_id on likes(user_id);
create index if not exists idx_likes_item_id on likes(item_id);
create index if not exists idx_wishlist_user_id on wishlist(user_id);
create index if not exists idx_wishlist_item_id_created on wishlist(item_id, created_at desc);
