/* MV Bichota · Ofertas del Día. Los productos se leen del catálogo público de Supabase. */
(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const money = value => 'USD ' + Number(value || 0).toFixed(2);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  function renderTimer(endTime) {
    const timer = $('#dailyOffersTimer');
    if (!timer) return;
    const remaining = Math.max(0, endTime - Date.now());
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timer.innerHTML = '<b>' + String(hours).padStart(2, '0') + '</b><i>:</i><b>' +
      String(minutes).padStart(2, '0') + '</b><i>:</i><b>' +
      String(seconds).padStart(2, '0') + '</b>';
    if (remaining <= 0) {
      $('#dailyOffers').hidden = true;
      clearInterval(window.MV_DAILY_OFFERS_TIMER);
    }
  }

  function showNotification(message) {
    const notice = document.createElement('div');
    notice.className = 'daily-offers__notice';
    notice.textContent = message;
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 2400);
  }

  async function init() {
    const section = $('#dailyOffers');
    const grid = $('#dailyOffersGrid');
    if (!section || !grid || !window.MV_getSupabaseClient || !window.MVStoreData) return;

    try {
      const [catalog, settingResult] = await Promise.all([
        window.MVStoreData.load(),
        window.MV_getSupabaseClient().from('store_settings')
          .select('setting_value').eq('setting_key', 'daily_offers').maybeSingle()
      ]);
      if (settingResult.error) throw settingResult.error;
      const config = settingResult.data?.setting_value;
      const endTime = Date.parse(config?.endsAt || '');
      if (!config?.active || !Array.isArray(config.products) || !config.products.length ||
          !Number.isFinite(endTime) || endTime <= Date.now()) return;

      const products = catalog.products || [];
      const offers = config.products.map(offer => {
        const product = products.find(item => String(item.dbId || item.id) === String(offer.productId));
        const discount = Number(offer.discount);
        if (!product || product.active === false || product.available === false ||
            !Number.isFinite(discount) || discount <= 0 || discount > 90) return null;
        const originalPrice = Number(product.price || 0);
        return { product, discount, originalPrice, price: originalPrice * (1 - discount / 100) };
      }).filter(Boolean);

      if (!offers.length) return;

      grid.innerHTML = offers.map(({ product, discount, originalPrice, price }) => {
        const image = product.image || '';
        const brand = product.brand || product.brand_name || product.categoryName || '';
        return '<article class="daily-offer-card">' +
          '<span class="daily-offer-card__badge">-' + discount + '%</span>' +
          '<div class="daily-offer-card__image"><img src="' + escapeHTML(image) + '" alt="' + escapeHTML(product.name) + '" loading="lazy"></div>' +
          '<h3 class="daily-offer-card__name">' + escapeHTML(product.name) + '</h3>' +
          '<div class="daily-offer-card__prices"><strong>' + money(price) + '</strong><del>' + money(originalPrice) + '</del></div>' +
          '<span class="daily-offer-card__brand">' + escapeHTML(brand || 'MV Bichota') + '</span>' +
          '<div class="daily-offer-card__actions"><span class="daily-offer-card__unit">' + escapeHTML(product.unit || 'unidad') + '</span>' +
          '<button type="button" class="daily-offer-card__add" data-offer-product="' + escapeHTML(product.id) + '"><span aria-hidden="true">🛒</span> Añadir</button></div>' +
          '</article>';
      }).join('');

      grid.addEventListener('click', event => {
        const button = event.target.closest('[data-offer-product]');
        if (!button) return;
        const offer = offers.find(item => String(item.product.id) === String(button.dataset.offerProduct));
        if (!offer) return;
        if (!window.mvCart || typeof window.mvCart.addItem !== 'function') {
          showNotification('El carrito todavía se está cargando. Inténtalo de nuevo.');
          return;
        }
        window.mvCart.addItem({
          id: offer.product.id,
          name: offer.product.name,
          price: Number(offer.price.toFixed(2)),
          image: offer.product.image,
          unit: offer.product.unit || 'unidad',
          category: offer.product.category || ''
        });
      });

      section.hidden = false;
      renderTimer(endTime);
      window.MV_DAILY_OFFERS_TIMER = setInterval(() => renderTimer(endTime), 1000);
    } catch (error) {
      console.warn('[MV Bichota] No se pudieron cargar las Ofertas del Día:', error.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
