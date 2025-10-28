function _(t, E, e) {
  return t.slice(E, E + e);
}
function r(t) {
  const E = new Uint8Array(t);
  let e = 0;
  const n = [];
  for (; e + 512 < E.byteLength; ) {
    const T = new TextDecoder().decode(_(E, e + 0, 100)).replace(/\0/g, "");
    if (T.length === 0) break;
    const c = new TextDecoder("ascii").decode(_(E, e + 124, 12)).replace(/\0/g, "").trim(), A = parseInt(c, 8), R = _(
      E,
      e + 156,
      1
    )[0] - 48;
    [0, 5].includes(R) && n.push({
      name: T,
      size: A,
      isFile: R === 0,
      offset: e
    }), e += A + 512, e = Math.ceil(e / 512) * 512;
  }
  return n;
}
function S(t, E) {
  return _(
    new Uint8Array(E),
    t.offset + 512,
    t.size
  );
}
export {
  r as getEntries,
  S as untar
};
//# sourceMappingURL=libuntar.js.map
