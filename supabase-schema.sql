-- ==========================================================================
-- 文華哈棒隊 (HotBone) - Supabase 資料庫完整升級腳本 (SQL Migration)
-- 包含：DROP TABLE 重新建立以確保包含 email, total_spent 等全部新欄位
-- 請將此腳本複製至 Supabase 控制台的 SQL Editor 並按下 Run 執行
-- ==========================================================================

-- 1. 重建 profiles 會員資料表（確保新增的 email, total_spent, ig 等欄位完整建立）
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,                                    -- 會員 Email（自動同步）
  nickname TEXT NOT NULL DEFAULT '熱血球友',     -- 顯示暱稱
  avatar_url TEXT DEFAULT 'assets/images/logo-emblem.png', -- 頭像網址
  role TEXT NOT NULL DEFAULT 'fan',              -- 會員身份：fan, player, vip, admin
  pheromone_level INT NOT NULL DEFAULT 1,        -- 費洛蒙等級 (Lv.1 ~ Lv.5)
  total_spent INT NOT NULL DEFAULT 0,            -- 累積贊助/消費金額 (TWD)
  instagram_handle TEXT,                         -- IG 帳號
  favorite_player TEXT DEFAULT 'Angus 隊長',     -- 最愛的哈棒球員
  bio TEXT DEFAULT '揮灑費洛蒙汗汁，生氣勃勃走出校園！', -- 個人簽名檔 / 幹話宣言
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. 啟用 Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 建立安全政策 (RLS Policies)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. 註冊自動同步 Trigger：新用戶註冊時自動存入 email 與各項欄位
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    nickname,
    avatar_url,
    role,
    pheromone_level,
    total_spent
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), '哈棒球友'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'assets/images/logo-emblem.png'),
    'fan',
    1,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 綁定 Trigger 到 auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
