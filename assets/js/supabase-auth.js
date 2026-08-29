/**
 * HotBone 文華哈棒隊 - Supabase 客戶端與認證整合模組
 * 包含會員登入、註冊、Google OAuth、費洛蒙等級計算、頭像切換與個人資料更新
 */

const SUPABASE_CONFIG = {
  url: 'https://egtvqsmdlcogmqdutktk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndHZxc21kbGNvZ21xZHV0a3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5Njk3MzMsImV4cCI6MjEwMzU0NTczM30.W9fSDGjEkFxtH7ShJDCdSfqQ5tEaf1-58eDfMxp243E'
};

let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

// 費洛蒙等級標準表 (依累積金額升等)
const PHEROMONE_LEVELS = [
  { level: 1, title: '費洛蒙初號機', minSpent: 0, nextThreshold: 500, badge: '🌱' },
  { level: 2, title: '生氣勃勃主力', minSpent: 500, nextThreshold: 1500, badge: '⚡' },
  { level: 3, title: '大蟒蛇資深幹部', minSpent: 1500, nextThreshold: 3000, badge: '🐍' },
  { level: 4, title: '滿貫傳奇元老', minSpent: 3000, nextThreshold: 5000, badge: '💥' },
  { level: 5, title: '終極哈棒之神', minSpent: 5000, nextThreshold: null, badge: '👑' }
];

window.HotBoneAuth = {
  user: null,
  profile: null,
  client: supabaseClient,

  // 取得費洛蒙等級詳細資訊
  getLevelInfo(spent = 0) {
    let currentLevel = PHEROMONE_LEVELS[0];
    for (let i = PHEROMONE_LEVELS.length - 1; i >= 0; i--) {
      if (spent >= PHEROMONE_LEVELS[i].minSpent) {
        currentLevel = PHEROMONE_LEVELS[i];
        break;
      }
    }
    
    let progressPercent = 100;
    let needed = 0;
    if (currentLevel.nextThreshold) {
      const range = currentLevel.nextThreshold - currentLevel.minSpent;
      const currentProgress = spent - currentLevel.minSpent;
      progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
      needed = currentLevel.nextThreshold - spent;
    }

    return {
      ...currentLevel,
      spent,
      progressPercent,
      needed
    };
  },

  async init() {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
      this.user = session.user;
      await this.loadProfile(this.user.id);
    }
    this.updateUI();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        this.user = session.user;
        await this.loadProfile(this.user.id);
      } else {
        this.user = null;
        this.profile = null;
      }
      this.updateUI();
    });

    this.bindModalEvents();
  },

  async loadProfile(userId) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const defaultNickname = this.user.user_metadata?.full_name || this.user.email?.split('@')[0] || '熱血球友';
        const defaultAvatar = this.user.user_metadata?.avatar_url || 'assets/images/logo-emblem.png';
        const { data: newProfile } = await supabaseClient
          .from('profiles')
          .insert([
            {
              id: userId,
              email: this.user.email,
              nickname: defaultNickname,
              avatar_url: defaultAvatar,
              role: 'fan',
              pheromone_level: 1,
              total_spent: 0,
              favorite_player: 'Angus 隊長',
              bio: '揮灑費洛蒙汗汁，生氣勃勃走出校園！'
            }
          ])
          .select()
          .single();
        this.profile = newProfile;
      } else if (data) {
        this.profile = data;
      }
    } catch (e) {
      console.warn('載入 Profile 異常:', e);
    }
  },

  // 更新個人資料
  async updateProfile(updates) {
    if (!this.user || !supabaseClient) throw new Error('未登入');
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.user.id)
      .select()
      .single();

    if (error) throw error;
    this.profile = data;
    this.updateUI();
    return data;
  },

  // Email 註冊
  async signUpWithEmail(email, password, nickname) {
    if (!supabaseClient) throw new Error('Supabase Client 未就緒');
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nickname || '熱血球友'
        }
      }
    });
    if (error) throw error;
    return data;
  },

  // Email 登入
  async signInWithEmail(email, password) {
    if (!supabaseClient) throw new Error('Supabase Client 未就緒');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // Google 登入
  async signInWithGoogle() {
    if (!supabaseClient) throw new Error('Supabase Client 未就緒');
    const redirectUrl = window.location.origin + window.location.pathname;
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) throw error;
    return data;
  },

  // 登出
  async signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    this.user = null;
    this.profile = null;
    this.updateUI();
    if (window.location.pathname.includes('profile.html')) {
      window.location.href = 'index.html';
    } else {
      showPheromoneToast('已成功登出');
    }
  },

  openModal(tab = 'login', promptMessage = '') {
    const modal = document.getElementById('auth-modal');
    const promptEl = document.getElementById('auth-modal-prompt');
    if (promptEl) {
      if (promptMessage) {
        promptEl.textContent = promptMessage;
        promptEl.classList.remove('hidden');
      } else {
        promptEl.classList.add('hidden');
      }
    }
    if (modal) {
      this.switchTab(tab);
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  switchTab(tab) {
    const loginForm = document.getElementById('auth-login-form');
    const registerForm = document.getElementById('auth-register-form');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const modalTitle = document.getElementById('auth-modal-title');
    const errorMsg = document.getElementById('auth-error-msg');
    if (errorMsg) errorMsg.classList.add('hidden');

    if (tab === 'login') {
      if (loginForm) loginForm.classList.remove('hidden');
      if (registerForm) registerForm.classList.add('hidden');
      if (tabLoginBtn) {
        tabLoginBtn.classList.add('text-[#D4AF37]', 'border-[#D4AF37]', 'bg-[#800020]/30');
        tabLoginBtn.classList.remove('text-gray-400', 'border-transparent');
      }
      if (tabRegisterBtn) {
        tabRegisterBtn.classList.remove('text-[#D4AF37]', 'border-[#D4AF37]', 'bg-[#800020]/30');
        tabRegisterBtn.classList.add('text-gray-400', 'border-transparent');
      }
      if (modalTitle) modalTitle.textContent = '哈棒會員登入';
    } else {
      if (loginForm) loginForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
      if (tabRegisterBtn) {
        tabRegisterBtn.classList.add('text-[#D4AF37]', 'border-[#D4AF37]', 'bg-[#800020]/30');
        tabRegisterBtn.classList.remove('text-gray-400', 'border-transparent');
      }
      if (tabLoginBtn) {
        tabLoginBtn.classList.remove('text-[#D4AF37]', 'border-[#D4AF37]', 'bg-[#800020]/30');
        tabLoginBtn.classList.add('text-gray-400', 'border-transparent');
      }
      if (modalTitle) modalTitle.textContent = '加入哈棒兄弟會 (註冊)';
    }
  },

  bindModalEvents() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-modal-close');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const loginForm = document.getElementById('auth-login-form');
    const registerForm = document.getElementById('auth-register-form');
    const errorMsg = document.getElementById('auth-error-msg');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => this.switchTab('login'));
    if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => this.switchTab('register'));

    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', async () => {
        try {
          await this.signInWithGoogle();
        } catch (err) {
          if (errorMsg) {
            errorMsg.textContent = 'Google 登入失敗: ' + (err.message || '請稍後再試');
            errorMsg.classList.remove('hidden');
          }
        }
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
          if (submitBtn) submitBtn.disabled = true;
          if (errorMsg) errorMsg.classList.add('hidden');
          await this.signInWithEmail(email, password);
          this.closeModal();
          showPheromoneToast('登入成功！費洛蒙已完全啟動');
        } catch (err) {
          if (errorMsg) {
            errorMsg.textContent = '登入失敗：' + (err.message || '帳號或密碼錯誤');
            errorMsg.classList.remove('hidden');
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nickname = document.getElementById('register-nickname').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        try {
          if (submitBtn) submitBtn.disabled = true;
          if (errorMsg) errorMsg.classList.add('hidden');
          await this.signUpWithEmail(email, password, nickname);
          this.closeModal();
          showPheromoneToast('註冊成功！若有啟用信箱驗證，請至信箱點擊確認連結');
        } catch (err) {
          if (errorMsg) {
            errorMsg.textContent = '註冊失敗：' + (err.message || '請確認信箱格式或密碼長度');
            errorMsg.classList.remove('hidden');
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  },

  updateUI() {
    const isLoggedIn = !!this.user;
    const authButtons = document.querySelectorAll('.auth-btn-container');
    const nickname = this.profile?.nickname || this.user?.user_metadata?.full_name || this.user?.email?.split('@')[0] || '哈棒隊友';
    const spent = this.profile?.total_spent || 0;
    const levelInfo = this.getLevelInfo(spent);
    const avatarUrl = this.profile?.avatar_url || 'assets/images/logo-emblem.png';

    // 1. 更新 Navbar 會員按鈕（點擊直接進入 profile.html）
    authButtons.forEach(container => {
      if (isLoggedIn) {
        container.innerHTML = `
          <div class="flex items-center space-x-2">
            <a href="profile.html" class="flex items-center space-x-2 bg-[#1f1519] hover:bg-[#2a1b20] border border-[#D4AF37]/50 px-3 py-1.5 rounded-full text-xs text-[#D4AF37] shadow-sm transition group" title="進入會員中心">
              <img src="${avatarUrl}" class="w-4 h-4 rounded-full object-cover border border-[#D4AF37]/60" onerror="this.src='assets/images/logo-emblem.png'">
              <span class="font-bold max-w-[80px] truncate group-hover:text-yellow-400">${nickname}</span>
              <span class="text-[10px] bg-[#800020] text-yellow-300 px-1.5 py-0.2 rounded font-mono">Lv.${levelInfo.level}</span>
            </a>
            <button onclick="window.HotBoneAuth.signOut()" class="text-xs text-gray-400 hover:text-red-400 px-2 py-1 transition" title="登出">
              登出
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <button onclick="window.HotBoneAuth.openModal('login')" class="px-3 py-1.5 text-xs font-bold rounded-full bg-[#1e1518] hover:bg-[#800020] text-[#D4AF37] border border-[#D4AF37]/50 transition duration-300 flex items-center space-x-1 shadow-sm">
            <span>🔑 登入 / 註冊</span>
          </button>
        `;
      }
    });

    // 2. 更新球員卡限定秘辛 (roster.html)
    const secretBadges = document.querySelectorAll('.player-secret-box');
    secretBadges.forEach(box => {
      const lockedEl = box.querySelector('.secret-locked-state');
      const unlockedEl = box.querySelector('.secret-unlocked-state');
      if (isLoggedIn) {
        if (lockedEl) lockedEl.classList.add('hidden');
        if (unlockedEl) unlockedEl.classList.remove('hidden');
      } else {
        if (lockedEl) lockedEl.classList.remove('hidden');
        if (unlockedEl) unlockedEl.classList.add('hidden');
      }
    });

    // 3. 如果當前在 profile.html，呼叫專屬更新函式
    if (typeof window.renderProfilePage === 'function') {
      window.renderProfilePage();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.HotBoneAuth.init();
});
