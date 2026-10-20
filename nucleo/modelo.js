// ---------- Núcleo de cor e modelo de camadas (Kubelka-Munk em 3 bandas, sRGB linear) ----------
var M = [[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]];
var WHITE = [0.95047, 1.0, 1.08883];
var P_T = 0.8, A_T = 1.8; // Paravina et al. 2015, CIEDE2000
var EPS = 216 / 24389, KAP = 24389 / 27;
function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
function s2l(c) { c = c / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function l2s(x) { x = clamp(x, 0, 1); var c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; return Math.round(c * 255); }
function fLab(t) { return t > EPS ? Math.cbrt(t) : (KAP * t + 16) / 116; }
function lin2lab(r, g, b) {
  var x = (M[0][0] * r + M[0][1] * g + M[0][2] * b) / WHITE[0];
  var y = (M[1][0] * r + M[1][1] * g + M[1][2] * b) / WHITE[1];
  var z = (M[2][0] * r + M[2][1] * g + M[2][2] * b) / WHITE[2];
  var fx = fLab(x), fy = fLab(y), fz = fLab(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function lab2lin(L, a, b) {
  var fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  var xr = fx * fx * fx > EPS ? fx * fx * fx : (116 * fx - 16) / KAP;
  var yr = L > KAP * EPS ? Math.pow((L + 16) / 116, 3) : L / KAP;
  var zr = fz * fz * fz > EPS ? fz * fz * fz : (116 * fz - 16) / KAP;
  var X = xr * WHITE[0], Y = yr * WHITE[1], Z = zr * WHITE[2];
  return [3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z];
}
function lab2rgb8(lab) { var l = lab2lin(lab[0], lab[1], lab[2]); return [l2s(l[0]), l2s(l[1]), l2s(l[2])]; }
function hexOf(rgb) { return "#" + rgb.map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("").toUpperCase(); }
function dE00(l1, l2) {
  var rad = Math.PI / 180, deg = 180 / Math.PI;
  var L1 = l1[0], a1 = l1[1], b1 = l1[2], L2 = l2[0], a2 = l2[1], b2 = l2[2];
  var C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  var G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
  var a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  var C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  function hue(ap, b) { if (ap === 0 && b === 0) return 0; var h = Math.atan2(b, ap) * deg; return h < 0 ? h + 360 : h; }
  var h1p = hue(a1p, b1), h2p = hue(a2p, b2);
  var dLp = L2 - L1, dCp = C2p - C1p, dhp;
  if (C1p * C2p === 0) dhp = 0; else { var d = h2p - h1p; if (d > 180) d -= 360; else if (d < -180) d += 360; dhp = d; }
  var dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * rad / 2);
  var Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2, hbp;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) hbp = (h1p + h2p + 360) / 2;
  else hbp = (h1p + h2p - 360) / 2;
  var T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.20 * Math.cos((4 * hbp - 63) * rad);
  var dTh = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
  var Rc = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
  var Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
  var Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  var Rt = -Math.sin(2 * dTh * rad) * Rc;
  var tl = dLp / Sl, tc = dCp / Sc, th = dHp / Sh;
  return Math.sqrt(tl * tl + tc * tc + th * th + Rt * tc * th);
}
function classify(de) {
  if (de <= P_T) return { cls: "ok", text: "Imperceptível" };
  if (de <= A_T) return { cls: "warn", text: "Perceptível, aceitável" };
  return { cls: "bad", text: "Acima do limiar de aceitabilidade" };
}

// Kubelka-Munk, uma banda. rinf: refletância de espessura infinita; S: espalhamento por mm; x: espessura em mm; rg: fundo.
var RMIN = 0.002, RMAX = 0.98;
function kmLayer(rinf, S, x, rg) {
  rinf = clamp(rinf, RMIN, RMAX);
  if (x <= 0 || S <= 0) return rg;
  var ks = (1 - rinf) * (1 - rinf) / (2 * rinf);
  var a = 1 + ks, b = Math.sqrt(Math.max(a * a - 1, 1e-12));
  var t = Math.tanh(b * S * x);
  var cth = 1 / Math.max(t, 1e-9);
  return (1 - rg * (a - b * cth)) / (a - rg + b * cth);
}
// Camada definida por cor opaca (Lab) e espalhamento S (por mm, igual nas 3 bandas ou vetor de 3).
function layerFromLab(lab, S) {
  var l = lab2lin(lab[0], lab[1], lab[2]).map(function (v) { return clamp(v, RMIN, RMAX); });
  var Sv = Array.isArray(S) ? S : [S, S, S];
  return { rinf: l, S: Sv };
}
function applyLayer(layer, x, rgv) { return [0, 1, 2].map(function (i) { return kmLayer(layer.rinf[i], layer.S[i], x, rgv[i]); }); }
function labOfLin(v) { return lin2lab(clamp(v[0], 0, 1), clamp(v[1], 0, 1), clamp(v[2], 0, 1)); }
// Pilha: substrato (opaco, Lab) -> cimento -> cerâmica. Devolve refletâncias lineares e Lab de cada nível.
function simulate(p) {
  var sub = lab2lin(p.sub[0], p.sub[1], p.sub[2]).map(function (v) { return clamp(v, RMIN, RMAX); });
  var cem = layerFromLab(p.cemLab, p.cemS), cer = p.ceramic;
  var afterCem = applyLayer(cem, p.cemX, sub);
  var fin = applyLayer(cer, p.cerX, afterCem);
  return { sub: sub, afterCem: afterCem, fin: fin, finLab: labOfLin(fin), afterCemLab: labOfLin(afterCem) };
}
// Translucidez (Johnston): ΔE00 entre cerâmica sobre fundo branco e sobre fundo preto, espessura x.
function tp(layer, x, wL) {
  var w = lab2lin(wL, 0, 0), k = [0.0005, 0.0005, 0.0005];
  var rw = applyLayer(layer, x, w), rb = applyLayer(layer, x, k);
  return dE00(labOfLin(rw), labOfLin(rb));
}
// Calibração a partir de medidas: cor sobre fundo preto (Rg ~ 0) e sobre fundo branco (Rg conhecido), espessura x0.
function calibrate(labBlack, labWhite, x0, whiteL) {
  var r0 = lab2lin(labBlack[0], labBlack[1], labBlack[2]).map(function (v) { return clamp(v, RMIN, RMAX); });
  var rw = lab2lin(labWhite[0], labWhite[1], labWhite[2]).map(function (v) { return clamp(v, RMIN, RMAX); });
  var rgw = clamp(lab2lin(whiteL, 0, 0)[1], 0.05, 1);
  var rinf = [], S = [], bad = false;
  for (var i = 0; i < 3; i++) {
    var R0 = r0[i], R = rw[i];
    if (R <= R0 * 1.0005) { bad = true; R = R0 * 1.0005 + 1e-6; }
    var a = 0.5 * (R + (R0 - R + rgw) / (R0 * rgw));
    if (!(a > 1)) { a = 1.0005; bad = true; }
    var b = Math.sqrt(a * a - 1);
    var c = (1 - a * R0) / (b * R0);
    var sx;
    if (c <= 1.0000001) { sx = 8; bad = true; } else sx = 0.5 * Math.log((c + 1) / (c - 1)) / b; // arccoth
    rinf.push(clamp(a - b, RMIN, RMAX));
    S.push(Math.max(sx / x0, 0.05));
  }
  return { rinf: rinf, S: S, warn: bad };
}
