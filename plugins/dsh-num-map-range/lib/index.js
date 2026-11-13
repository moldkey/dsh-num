/**
 * 数字工具：map range — 数字工具
 */

export const name = "dsh-num-map-range";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/tools/";
const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

const CN_DIGIT = "零一二三四五六七八九";
const CN_UNIT = ["", "十", "百", "千"];
const CN_BIG = ["", "万", "亿", "万亿"];
const EN_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SYMBOL = { CNY: "¥", USD: "$", EUR: "€", GBP: "£", JPY: "¥", HKD: "HK$", KRW: "₩", RUB: "₽", INR: "₹", AUD: "A$", CAD: "C$", SGD: "S$" };
const FIN = { "一": "壹", "二": "贰", "三": "叁", "四": "肆", "五": "伍", "六": "陆", "七": "柒", "八": "捌", "九": "玖", "十": "拾", "百": "佰", "千": "仟", "零": "零" };
function fin(s) { return s.replace(/[一二三四五六七八九十百千零]/g, (c) => FIN[c] || c); }
const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

function n(v) { const x = Number(String(v).replace(/[,，\s]/g, "")); if (!Number.isFinite(x)) throw new Error("不是数字"); return x; }
function f(x) { return (Math.round(x * 100) / 100).toString(); }

function cnNum(x) {
  x = Math.floor(Math.abs(x));
  if (x === 0) return "零";
  const groups = [];
  while (x > 0) { groups.push(x % 10000); x = Math.floor(x / 10000); }
  let out = "";
  for (let g = groups.length - 1; g >= 0; g--) {
    let v = groups[g]; let s = "";
    if (v === 0) { if (out && !/零$/.test(out)) out += "零"; continue; }
    for (let p = 3; p >= 0; p--) {
      const d = Math.floor(v / Math.pow(10, p)) % 10;
      if (d === 0) { if (s && !/零$/.test(s) && String(v % Math.pow(10, p)).replace(/0+$/, "") !== "") s += "零"; }
      else { if (s.endsWith("零") && s.length > 1) s = s.slice(0, -1); s += CN_DIGIT[d] + CN_UNIT[p]; }
    }
    s = s.replace(/零+$/, "").replace(/零+/g, "零");
    if (s) out += s + CN_BIG[g];
  }
  return out.replace(/^一十/, "十");
}

function enNum(x) {
  x = Math.floor(Math.abs(x));
  if (x === 0) return "zero";
  const scales = [[1000000000, "billion"], [1000000, "million"], [1000, "thousand"]];
  let out = "";
  for (const [v, name] of scales) { if (x >= v) { out += enNum(Math.floor(x / v)) + " " + name + " "; x %= v; } }
  if (x >= 100) { out += EN_ONES[Math.floor(x / 100)] + " hundred "; x %= 100; }
  if (x > 0) { if (out) out += "and "; if (x < 20) out += EN_ONES[x]; else out += EN_TENS[Math.floor(x / 10)] + (x % 10 ? "-" + EN_ONES[x % 10] : ""); }
  return out.trim();
}

const OPS = {
  cny_upper: (t) => {
    const x = n(t); const neg = x < 0; const v = Math.round(Math.abs(x) * 100);
    const yuan = Math.floor(v / 100), jiao = Math.floor(v / 10) % 10, fen = v % 10;
    let s = (neg ? "负" : "") + (yuan ? cnNum(yuan) + "元" : "");
    if (!yuan) s += "零元";
    if (jiao === 0 && fen === 0) s += "整";
    else {
      if (jiao) s += CN_DIGIT[jiao] + "角";
      if (fen) s += (jiao ? "" : "零") + CN_DIGIT[fen] + "分";
      if (!jiao && !fen) s += "整";
    }
    return fin(s);
  },
  cny_format: (t) => { const x = n(t); return "¥" + x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); },
  num_to_cn: (t) => cnNum(n(t)),
  cn_to_num: (t) => {
    const s = String(t).trim().replace(/[元整]/g, "");
    if (/^\d+$/.test(s)) return s;
    const map = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    const unit = { 十: 10, 百: 100, 千: 1000, 万: 10000, 亿: 100000000 };
    let total = 0, section = 0, num = 0;
    for (const c of s) {
      if (map[c] !== undefined) num = map[c];
      else if (unit[c] !== undefined) {
        if (unit[c] >= 10000) { section = (section + (num || 0)) * unit[c]; total += section; section = 0; }
        else section += (num || 1) * unit[c];
        num = 0;
      }
    }
    return String(total + section + num);
  },
  num_to_roman: (t) => { let x = Math.floor(Math.abs(n(t))); if (x <= 0 || x > 3999) return "支持 1–3999"; let out = ""; for (const [v, s] of ROMAN) { while (x >= v) { out += s; x -= v; } } return out; },
  roman_to_num: (t) => { const s = String(t).toUpperCase().trim(); let total = 0; for (let i = 0; i < s.length; i++) { const v = (ROMAN.find((r) => r[1] === s[i]) || [0])[0]; const next = s[i + 1] ? (ROMAN.find((r) => r[1] === s[i + 1]) || [0])[0] : 0; total += v < next ? -v : v; } return String(total); },
  num_to_english: (t) => enNum(n(t)),
  digit_group: (t) => { const x = n(t); const [i, d] = String(x).split("."); return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d ? "." + d : ""); },
  ordinal_cn: (t) => "第" + cnNum(n(t)),
  ordinal_en: (t) => { const x = Math.floor(n(t)); const mod100 = x % 100; const mod10 = x % 10; const suf = mod100 >= 11 && mod100 <= 13 ? "th" : mod10 === 1 ? "st" : mod10 === 2 ? "nd" : mod10 === 3 ? "rd" : "th"; return x + suf; },
  scientific: (t) => n(t).toExponential(6).replace(/e\+?/, "e"),
  round_money: (t) => n(t).toFixed(2),
  currency_symbol: (t) => SYMBOL[String(t).trim().toUpperCase()] || "未知货币代码",
  to_percent: (t, a) => { const x = n(t); const d = Math.max(0, Number(a) || 2); return (x * 100).toFixed(d) + "%"; },
  parse_num: (t) => { const s = String(t).replace(/[^\d.\-eE+]/g, ""); return f(Number(s)); },
  clamp: (t, a) => { const [lo, hi] = String(a).split(",").map(Number); return f(Math.max(lo, Math.min(hi, n(t)))); },
  lerp: (t, a) => { const [to, p] = String(a).split(",").map(Number); return f(n(t) + (to - n(t)) * (p || 0)); },
  map_range: (t, a) => { const v = String(a).split(",").map(Number); if (v.length !== 4) throw new Error("a=输入最小,输入最大,输出最小,输出最大"); const r = (n(t) - v[0]) / ((v[1] - v[0]) || 1); return f(v[2] + r * (v[3] - v[2])); },
};

export function apply(ctx, config) {
  void config;
  ctx.tools.register({
    name: "num_map_range",
    description: "map range",
    parameters: {
      text: { "type": "string", required: true, "description": "数字" },
      a: { "type": "string", "description": "参数 a" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      const t = args && args.text != null ? String(args.text) : "";
      const a = args && args.a != null ? String(args.a) : "";
      try {
        const fn = OPS["map_range"];
        if (!fn) throw new Error("未知操作");
        return { text: ["数字工具：map range", "=".repeat(52), String(fn(t, a)), "", "更多工具：" + SITE].join(NL) };
      } catch (e) {
        return { text: "处理失败: " + String((e && e.message) || e) };
      }
    },
  });
}