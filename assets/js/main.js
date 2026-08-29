/**
 * HotBone 文華哈棒隊 - 主核心腳本
 * 包含老司機彩蛋導向、跑馬燈暫停、老司機專欄解鎖、表單互動、球員篩選與行動版導覽列
 */

document.addEventListener('DOMContentLoaded', () => {
  initEasterEgg();
  initMarqueeHover();
  initMobileMenu();
  initSecretSection();
  initPheromoneForm();
  initPodcastPlayer();
  initRosterFilter();
  setActiveNavLink();
});

/**
 * 設定當前頁面導覽列 active 狀態
 */
function setActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('text-[#D4AF37]', 'font-bold', 'border-b-2', 'border-[#D4AF37]');
      link.classList.remove('text-gray-300');
    }
  });
}

/**
 * 1. 老司機彩蛋按鈕監聽 (串接會員檢查)
 * 若未登入 -> 彈出登入 Modal
 * 若已登入 -> 跳出 confirm 並導向解鎖
 */
function initEasterEgg() {
  const eggButtons = document.querySelectorAll('#easter-egg-btn, .easter-egg-trigger');
  eggButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // 檢查是否登入
      if (window.HotBoneAuth && !window.HotBoneAuth.user) {
        window.HotBoneAuth.openModal('login', '【老司機專屬】請先登入哈棒會員以解鎖深夜專欄！');
        return;
      }

      const warningText = '【老司機警示】未滿 18 歲請由大蟒蛇陪同觀看！\n\n確定要進入哈棒隊深夜機密領域嗎？';
      if (window.confirm(warningText)) {
        if (window.location.pathname.includes('merch.html')) {
          window.location.hash = 'secret';
          unlockSecretArea();
          const secretEl = document.getElementById('secret');
          if (secretEl) {
            secretEl.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          window.location.href = 'merch.html#secret';
        }
      }
    });
  });
}

/**
 * 2. 跑馬燈 Hover 暫停邏輯
 */
function initMarqueeHover() {
  const marquees = document.querySelectorAll('.marquee-wrapper');
  marquees.forEach(marquee => {
    const contents = marquee.querySelectorAll('.marquee-content');
    marquee.addEventListener('mouseenter', () => {
      contents.forEach(content => {
        content.classList.add('marquee-paused');
      });
    });
    marquee.addEventListener('mouseleave', () => {
      contents.forEach(content => {
        content.classList.remove('marquee-paused');
      });
    });
  });
}

/**
 * 3. 行動版選單開關
 */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
    });
  }
}

/**
 * 4. 老司機深夜專欄解鎖邏輯 (merch.html)
 */
function initSecretSection() {
  const secretSection = document.getElementById('secret');
  const unlockBtn = document.getElementById('unlock-secret-btn');

  if (!secretSection) return;

  // 檢查 URL Hash 是否為 #secret
  if (window.location.hash === '#secret') {
    if (window.HotBoneAuth && !window.HotBoneAuth.user) {
      // 延遲一點等 auth 初始化
      setTimeout(() => {
        if (!window.HotBoneAuth.user) {
          window.HotBoneAuth.openModal('login', '【老司機專屬】請先登入哈棒會員以解鎖深夜專欄！');
        } else {
          unlockSecretArea();
        }
      }, 500);
    } else {
      unlockSecretArea();
    }
  }

  // 監聽 hashchange 事件
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#secret') {
      if (window.HotBoneAuth && !window.HotBoneAuth.user) {
        window.HotBoneAuth.openModal('login', '【老司機專屬】請先登入哈棒會員以解鎖深夜專欄！');
      } else {
        unlockSecretArea();
        secretSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // 解鎖按鈕點擊
  if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
      if (window.HotBoneAuth && !window.HotBoneAuth.user) {
        window.HotBoneAuth.openModal('login', '【老司機專屬】請先登入哈棒會員以解鎖深夜專欄！');
        return;
      }
      const confirmed = window.confirm('【老司機警示】未滿 18 歲請由大蟒蛇陪同觀看！\n\n您已做好直視費洛蒙的心理準備了嗎？');
      if (confirmed) {
        unlockSecretArea();
      }
    });
  }
}

function unlockSecretArea() {
  const secretSection = document.getElementById('secret');
  const overlay = document.getElementById('secret-lock-overlay');
  const statusBadge = document.getElementById('secret-status-badge');

  if (secretSection) {
    secretSection.classList.remove('secret-locked');
    secretSection.classList.add('secret-unlocked');
  }

  if (overlay) {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 600);
  }

  if (statusBadge) {
    statusBadge.innerHTML = '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-900/80 text-green-300 border border-green-500 shadow-sm animate-pulse">🔓 已解鎖老司機視角</span>';
  }
}

/**
 * 5. 合作表單「發射費洛蒙」提交回饋
 */
function initPheromoneForm() {
  const form = document.getElementById('pheromone-form');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('form-name');
      const senderName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '熱血球友';

      showPheromoneToast(senderName);
      form.reset();
    });
  }
}

function showPheromoneToast(name) {
  let toast = document.getElementById('pheromone-toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pheromone-toast';
    toast.className = 'fixed bottom-8 right-8 z-50 transform translate-y-24 opacity-0 transition-all duration-500 ease-out max-w-md';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="bg-[#1a0f12] border-2 border-[#D4AF37] text-white p-5 rounded-2xl shadow-2xl backdrop-blur-md rainbow-glow">
      <div class="flex items-start space-x-3">
        <div class="text-3xl animate-bounce">⚾💥</div>
        <div>
          <h4 class="font-bold text-[#D4AF37] text-lg font-headline">費洛蒙已全力發射！</h4>
          <p class="text-sm text-gray-300 mt-1">
            感謝 <span class="text-yellow-400 font-bold">${name}</span>！隊長 Angus 與不焚者蔡仲已收到您的費洛蒙信號，請保持棒子生氣勃勃！
          </p>
        </div>
      </div>
    </div>
  `;

  // 顯示動畫
  setTimeout(() => {
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  }, 50);

  // 5 秒後自動隱藏
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 5000);
}

/**
 * 6. Podcast 簡易播放器互動 (legends.html)
 */
function initPodcastPlayer() {
  const playBtn = document.getElementById('podcast-play-btn');
  const playIcon = document.getElementById('podcast-play-icon');
  const pauseIcon = document.getElementById('podcast-pause-icon');
  const progressBar = document.getElementById('podcast-progress');
  const waves = document.querySelectorAll('.podcast-wave');

  if (!playBtn) return;

  let isPlaying = false;
  let progressInterval = null;
  let currentProgress = 35;

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;

    if (isPlaying) {
      if (playIcon) playIcon.classList.add('hidden');
      if (pauseIcon) pauseIcon.classList.remove('hidden');
      waves.forEach(w => w.classList.add('animate-pulse'));

      progressInterval = setInterval(() => {
        currentProgress += 0.5;
        if (currentProgress > 100) currentProgress = 0;
        if (progressBar) progressBar.style.width = `${currentProgress}%`;
      }, 300);
    } else {
      if (playIcon) playIcon.classList.remove('hidden');
      if (pauseIcon) pauseIcon.classList.add('hidden');
      waves.forEach(w => w.classList.remove('animate-pulse'));
      if (progressInterval) clearInterval(progressInterval);
    }
  });
}

/**
 * 7. 球員名冊篩選器 (roster.html)
 */
function initRosterFilter() {
  const filterButtons = document.querySelectorAll('.roster-filter-btn');
  const playerCards = document.querySelectorAll('.player-card-item');

  if (!filterButtons.length || !playerCards.length) return;

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // 更新按鈕樣式
      filterButtons.forEach(b => {
        b.classList.remove('bg-[#800020]', 'text-[#D4AF37]', 'border-[#D4AF37]');
        b.classList.add('bg-[#1a1416]', 'text-gray-400', 'border-gray-700');
      });
      btn.classList.remove('bg-[#1a1416]', 'text-gray-400', 'border-gray-700');
      btn.classList.add('bg-[#800020]', 'text-[#D4AF37]', 'border-[#D4AF37]');

      // 篩選卡牌
      playerCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'block';
          card.classList.add('animate-fadeIn');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}
