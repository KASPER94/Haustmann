// Chargé dans <head>, avant le premier rendu de l'accueil.
// Pose l'état d'attente de l'intro, sauf quand on arrive d'une autre page du site (on recharge : l'intro rejoue).
(function () {
  try {
    if (!Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var reload = nav && nav.type === 'reload';
    var inSite = document.referrer && new URL(document.referrer).origin === location.origin;
    if (reload || !inSite) document.documentElement.classList.add('intro-wait');
  } catch (e) {}
})();
