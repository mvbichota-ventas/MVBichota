/* MV Bichota - banners públicos administrados desde Supabase */
(function () {
  'use strict';

  if (window.MV_BANNERS_INITIALIZED) return;
  window.MV_BANNERS_INITIALIZED = true;

  const section = document.getElementById('managedBanners');
  const slide = document.getElementById('managedBannerSlide');
  const controls = document.getElementById('managedBannerControls');
  const dots = document.getElementById('managedBannerDots');
  const previous = document.getElementById('managedBannerPrev');
  const next = document.getElementById('managedBannerNext');

  if (!section || !slide) return;

  let banners = [];
  let activeIndex = 0;
  let timer = null;
  let paused = false;
  let lastBannerSignature = '';

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function safeUrl(value, fallback) {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (raw.startsWith('#')) return raw;
    try {
      const parsed = new URL(raw, window.location.href);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function render() {
    if (!banners.length) {
      section.hidden = true;
      slide.innerHTML = '';
      if (controls) controls.hidden = true;
      stopAutoplay();
      return;
    }

    const banner = banners[activeIndex];
    const image = safeUrl(banner.image_url, '');
    const buttonText = String(banner.button_text || '').trim();
    const buttonUrl = safeUrl(banner.button_url, '#catalogo');

    slide.innerHTML = `
      <div class="managed-banner">
        <div class="managed-banner__image">
          ${image ? `<img src="${escapeHTML(image)}" alt="" loading="lazy" decoding="async">` : ''}
        </div>
        <div class="managed-banner__content">
          ${banner.title ? `<h2>${escapeHTML(banner.title)}</h2>` : ''}
          ${banner.subtitle ? `<p>${escapeHTML(banner.subtitle)}</p>` : ''}
          ${buttonText ? `<a class="managed-banner__button" href="${escapeHTML(buttonUrl)}">${escapeHTML(buttonText)}</a>` : ''}
        </div>
      </div>
    `;
    section.hidden = false;

    if (controls) controls.hidden = banners.length < 2;
    if (dots) {
      dots.innerHTML = banners.map((_, index) =>
        `<button type="button" class="managed-banners__dot ${index === activeIndex ? 'active' : ''}" data-index="${index}" aria-label="Mostrar promoción ${index + 1}" aria-current="${index === activeIndex ? 'true' : 'false'}"></button>`
      ).join('');
    }
  }

  function goTo(index) {
    if (!banners.length) return;
    activeIndex = (index + banners.length) % banners.length;
    render();
    restartAutoplay();
  }

  function stopAutoplay() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function restartAutoplay() {
    stopAutoplay();
    if (banners.length < 2 || paused) return;
    timer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % banners.length;
      render();
    }, 4000);
  }

  async function loadBanners() {
    try {
      if (typeof window.MV_getSupabaseClient !== 'function') return render();
      const client = window.MV_getSupabaseClient();
      const { data, error } = await client.from('banners')
        .select('id,title,subtitle,button_text,button_url,image_url,active,sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      const nextBanners = Array.isArray(data) ? data : [];
      const signature = JSON.stringify(nextBanners);
      if (signature !== lastBannerSignature) {
        banners = nextBanners;
        lastBannerSignature = signature;
        activeIndex = Math.min(activeIndex, Math.max(0, banners.length - 1));
        render();
      }
      restartAutoplay();
    } catch (error) {
      // Public RLS may restrict banners. Keep the rest of the storefront usable.
      console.warn('[MV Bichota] No se pudieron cargar los banners publicados:', error.message);
      section.hidden = true;
      if (controls) controls.hidden = true;
      stopAutoplay();
    }
  }

  if (previous) previous.addEventListener('click', () => goTo(activeIndex - 1));
  if (next) next.addEventListener('click', () => goTo(activeIndex + 1));
  if (dots) dots.addEventListener('click', event => {
    const button = event.target.closest('[data-index]');
    if (button) goTo(Number(button.dataset.index));
  });

  section.addEventListener('mouseenter', () => { paused = true; stopAutoplay(); });
  section.addEventListener('mouseleave', () => { paused = false; restartAutoplay(); });
  section.addEventListener('focusin', () => { paused = true; stopAutoplay(); });
  section.addEventListener('focusout', () => { paused = false; restartAutoplay(); });

  loadBanners();
  window.setInterval(loadBanners, 60000);

  try {
    if (typeof window.MV_getSupabaseClient === 'function') {
      window.MV_getSupabaseClient().channel('mv-public-banners')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, loadBanners)
        .subscribe();
    }
  } catch (error) {
    console.warn('[MV Bichota] No se pudo activar la actualización Realtime de banners:', error.message);
  }
})();
