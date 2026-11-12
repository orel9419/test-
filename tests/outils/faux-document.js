/**
 * Faux `document` pour construire hors navigateur les modèles 3D qui peignent
 * leurs textures sur un canvas : le contexte 2D accepte tous les appels sans
 * rien dessiner (les tests portent sur la géométrie, pas sur les textures).
 */
export function installerFauxDocument() {
  if (typeof globalThis.document !== 'undefined') return () => {};
  const contexte = () => {
    const cible = function () {};
    const proxy = new Proxy(cible, {
      get(_, cle) {
        if (cle === 'canvas') return { width: 256, height: 256 };
        if (cle === 'measureText') return () => ({ width: 10 });
        if (cle === 'getImageData' || cle === 'createImageData') return (x, y, w = 1, h = 1) => ({ data: new Uint8ClampedArray(Math.max(1, (w ?? 1) * (h ?? 1) * 4)), width: w, height: h });
        if (cle === Symbol.toPrimitive) return () => '';
        return proxy;
      },
      set() { return true; },
      apply() { return proxy; },
    });
    return proxy;
  };
  globalThis.document = {
    createElement: () => ({ width: 256, height: 256, style: {}, getContext: () => contexte(), toDataURL: () => '' }),
  };
  return () => { delete globalThis.document; };
}
