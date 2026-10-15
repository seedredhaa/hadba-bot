/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Z": () => (/* binding */ worker_main)
});

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-date.mjs
// Hadaba dynamic date & countdown engine
// Supports Gregorian {Y-M-D H:m [ص/م]}, repeating {*-M-D}, {Y-*-D}, {Y-M-*},
// and Hijri <Y-M-D H:m [ص/م]> with auto-conversion and live countdowns in Asia/Riyadh.

const digits = (s) => s.replace(/[٠-٩۰-۹]/g, c => String(c.charCodeAt(0) - (c >= '۰' ? 0x6f0 : 0x660)));

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Riyadh offset: UTC+3 (10800000 ms)
const RIYADH_OFFSET_MS = 3 * 3600 * 1000;

function toRiyadhDate(timestamp) {
  const d = new Date(typeof timestamp === 'number' ? timestamp : timestamp.getTime());
  return new Date(d.getTime() + RIYADH_OFFSET_MS);
}

function getRiyadhParts(timestamp) {
  const d = toRiyadhDate(timestamp);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay()
  };
}

function createRiyadhDate(year, month, day, hour = 0, minute = 0, second = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - RIYADH_OFFSET_MS);
}

function arabicPlural(n, singular, dual, plural, pluralAcc) {
  if (n === 1) return singular;
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return `${n} ${plural}`;
  return `${n} ${pluralAcc}`;
}

function formatDuration(diffMs) {
  const isPast = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const totalMins = Math.floor(absMs / 60000);
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = totalMins % 60;

  if (totalMins < 1) return '[الآن]';

  const prefix = isPast ? 'منذ ' : 'بعد ';
  const parts = [];
  if (days > 0) {
    parts.push(arabicPlural(days, 'يوم', 'يومان', 'أيام', 'يوم'));
    if (hours > 0) {
      parts.push(arabicPlural(hours, 'ساعة', 'ساعتان', 'ساعات', 'ساعة'));
    }
  } else if (hours > 0) {
    parts.push(arabicPlural(hours, 'ساعة', 'ساعتان', 'ساعات', 'ساعة'));
    if (mins > 0) {
      parts.push(arabicPlural(mins, 'دقيقة', 'دقيقتان', 'دقائق', 'دقيقة'));
    }
  } else {
    parts.push(arabicPlural(mins, 'دقيقة', 'دقيقتان', 'دقائق', 'دقيقة'));
  }
  return `[${prefix}${parts.join(' و ')}]`;
}

function getHijriFormatted(date) {
  const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = fmt.formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value ?? '1444';
  const m = parts.find(p => p.type === 'month')?.value ?? '01';
  const d = parts.find(p => p.type === 'day')?.value ?? '01';
  return `[${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}هـ]`;
}

function getGregorianFormatted(date) {
  const p = getRiyadhParts(date);
  const y = String(p.year).padStart(4, '0');
  const m = String(p.month).padStart(2, '0');
  const d = String(p.day).padStart(2, '0');
  return `[${y}-${m}-${d}م]`;
}

function hijriToGregorian(hYear, hMonth, hDay, hour = 0, minute = 0) {
  const approxGYear = Math.floor(hYear * 0.970224 + 621.57);
  const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  let tMin = Date.UTC(approxGYear - 1, 0, 1);
  let tMax = Date.UTC(approxGYear + 2, 0, 1);
  let found = null;

  while (tMin <= tMax) {
    const tMid = Math.floor((tMin + tMax) / (2 * 86400000)) * 86400000 + 43200000;
    const d = new Date(tMid);
    const parts = fmt.formatToParts(d);
    const hy = parseInt(parts.find(p => p.type === 'year')?.value ?? '0', 10);
    const hm = parseInt(parts.find(p => p.type === 'month')?.value ?? '0', 10);
    const hd = parseInt(parts.find(p => p.type === 'day')?.value ?? '0', 10);

    const cmp = (hy - hYear) || (hm - hMonth) || (hd - hDay);
    if (cmp === 0) {
      const partsG = getRiyadhParts(d);
      found = createRiyadhDate(partsG.year, partsG.month, partsG.day, hour, minute);
      break;
    } else if (cmp < 0) {
      tMin = tMid + 86400000;
    } else {
      tMax = tMid - 86400000;
    }
  }
  return found ?? createRiyadhDate(approxGYear, 1, 1, hour, minute);
}

function parseHourMinute(hourStr, minStr, periodStr) {
  let h = hourStr !== undefined ? parseInt(hourStr, 10) : 0;
  const m = minStr !== undefined ? parseInt(minStr, 10) : 0;
  if (periodStr) {
    const p = periodStr.trim();
    if (p === 'ص' || p.toUpperCase() === 'AM') {
      if (h === 12) h = 0;
    } else if (p === 'م' || p.toUpperCase() === 'PM') {
      if (h < 12) h += 12;
    }
  }
  return { hour: Math.max(0, Math.min(23, h)), minute: Math.max(0, Math.min(59, m)) };
}

function daysInGregorianMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseAndEvaluateDateTag(rawTag, nowTimestamp = Date.now()) {
  const clean = digits(rawTag.trim());
  const isHijri = clean.startsWith('<') && clean.endsWith('>');
  const isGregorian = clean.startsWith('{') && clean.endsWith('}');
  if (!isHijri && !isGregorian) return null;

  const content = clean.slice(1, -1).trim();
  // Regex pattern matching: (Year)-(Month)-(Day) [optional time]
  // Y, M, D can be numbers or *
  const match = content.match(/^(\*|\d{1,4})\s*-\s*(\*|\d{1,2})\s*-\s*(\*|\d{1,2})(?:\s+(\d{1,2})(?::(\d{1,2}))?(?:\s*(ص|م|AM|PM|am|pm))?)?$/u);
  if (!match) return null;

  const [, rawY, rawM, rawD, rawHour, rawMin, rawPeriod] = match;
  const { hour, minute } = parseHourMinute(rawHour, rawMin, rawPeriod);
  const now = typeof nowTimestamp === 'number' ? new Date(nowTimestamp) : nowTimestamp;
  const currentRiyadh = getRiyadhParts(now);

  let targetDate;

  if (isHijri) {
    // Hijri date
    const hYear = rawY === '*' ? 1448 : parseInt(rawY, 10);
    const hMonth = rawM === '*' ? 1 : parseInt(rawM, 10);
    const hDay = rawD === '*' ? 1 : parseInt(rawD, 10);
    targetDate = hijriToGregorian(hYear, hMonth, hDay, hour, minute);
  } else {
    // Gregorian date with wildcard handling
    let y = rawY === '*' ? '*' : parseInt(rawY, 10);
    let m = rawM === '*' ? '*' : parseInt(rawM, 10);
    let d = rawD === '*' ? '*' : parseInt(rawD, 10);

    if (y === '*') {
      // Annual repeating: test current year
      let candidateYear = currentRiyadh.year;
      const targetMonth = m;
      const targetDay = Math.min(d, daysInGregorianMonth(candidateYear, targetMonth));
      let candidate = createRiyadhDate(candidateYear, targetMonth, targetDay, hour, minute);
      if (candidate.getTime() <= now.getTime()) {
        candidateYear++;
        candidate = createRiyadhDate(candidateYear, targetMonth, Math.min(d, daysInGregorianMonth(candidateYear, targetMonth)), hour, minute);
      }
      targetDate = candidate;
    } else if (m === '*') {
      // Monthly repeating: test current month in specified year (or current year)
      let candidateYear = typeof y === 'number' ? y : currentRiyadh.year;
      let candidateMonth = currentRiyadh.month;
      // if specified year is in the past, adjust to current year
      if (candidateYear < currentRiyadh.year) candidateYear = currentRiyadh.year;

      const targetDay = Math.min(d, daysInGregorianMonth(candidateYear, candidateMonth));
      let candidate = createRiyadhDate(candidateYear, candidateMonth, targetDay, hour, minute);
      if (candidate.getTime() <= now.getTime()) {
        candidateMonth++;
        if (candidateMonth > 12) {
          candidateMonth = 1;
          candidateYear++;
        }
        candidate = createRiyadhDate(candidateYear, candidateMonth, Math.min(d, daysInGregorianMonth(candidateYear, candidateMonth)), hour, minute);
      }
      targetDate = candidate;
    } else if (d === '*') {
      // Daily repeating
      let candidateYear = typeof y === 'number' ? y : currentRiyadh.year;
      let candidateMonth = typeof m === 'number' ? m : currentRiyadh.month;
      let candidateDay = currentRiyadh.day;
      let candidate = createRiyadhDate(candidateYear, candidateMonth, candidateDay, hour, minute);
      if (candidate.getTime() <= now.getTime()) {
        candidate = new Date(candidate.getTime() + 86400000);
      }
      targetDate = candidate;
    } else {
      // Fixed date
      targetDate = createRiyadhDate(y, m, d, hour, minute);
    }
  }

  const parts = getRiyadhParts(targetDate);
  const weekday = WEEKDAYS_AR[parts.weekday];
  const hijriStr = getHijriFormatted(targetDate);
  const gregStr = getGregorianFormatted(targetDate);
  const diffMs = targetDate.getTime() - now.getTime();
  const durationStr = formatDuration(diffMs);

  const formatted = `${weekday} ${hijriStr} ${gregStr} ${durationStr}`;
  return { targetDate, formatted };
}

// Replaces all {date...} and <date...> tags inside text while accurately recalculating UTF-16 entity offsets.
function formatDynamicDatesInText(text, entities = [], nowTimestamp = Date.now()) {
  if (typeof text !== 'string') return { text, entities };

  // Match {...} or <...> where content looks like a date tag
  const tagRegex = /(?:\{[\s\S]*?\}|<[\s\S]*?>)/g;
  let match;
  const replacements = [];

  while ((match = tagRegex.exec(text)) !== null) {
    const rawTag = match[0];
    const evaluated = parseAndEvaluateDateTag(rawTag, nowTimestamp);
    if (evaluated) {
      replacements.push({
        start: match.index,
        end: match.index + rawTag.length,
        replacement: evaluated.formatted
      });
    }
  }

  if (!replacements.length) {
    return { text, entities: entities ? structuredClone(entities) : [] };
  }

  let newText = '';
  let cursor = 0;
  const deltas = [];

  for (const r of replacements) {
    newText += text.slice(cursor, r.start);
    const newStart = newText.length;
    newText += r.replacement;
    const newEnd = newText.length;
    cursor = r.end;
    deltas.push({
      oldStart: r.start,
      oldEnd: r.end,
      newStart,
      newEnd,
      diff: r.replacement.length - (r.end - r.start)
    });
  }
  newText += text.slice(cursor);

  const newEntities = [];
  if (Array.isArray(entities)) {
    for (const ent of entities) {
      let offset = ent.offset;
      let length = ent.length;
      const entEnd = offset + length;

      for (const d of deltas) {
        if (offset >= d.oldEnd) {
          // Entity starts after replacement
          offset += d.diff;
        } else if (offset <= d.oldStart && entEnd >= d.oldEnd) {
          // Entity completely spans the replacement
          length += d.diff;
        } else if (offset >= d.oldStart && entEnd <= d.oldEnd) {
          // Entity is inside the replaced tag
          offset = d.newStart;
          length = d.replacement ? d.replacement.length : (d.newEnd - d.newStart);
        }
      }
      newEntities.push({ ...ent, offset: Math.max(0, offset), length: Math.max(1, length) });
    }
  }

  return { text: newText, entities: newEntities };
}

// Dynamic evaluation helper for full Telegram message payload
function applyDynamicDatesToPayload(payload, nowTimestamp = Date.now()) {
  if (!payload || typeof payload !== 'object') return payload;
  const res = structuredClone(payload);
  if (typeof res.text === 'string') {
    const formatted = formatDynamicDatesInText(res.text, res.entities, nowTimestamp);
    res.text = formatted.text;
    if (res.entities) res.entities = formatted.entities;
  }
  if (typeof res.caption === 'string') {
    const formatted = formatDynamicDatesInText(res.caption, res.caption_entities, nowTimestamp);
    res.caption = formatted.text;
    if (res.caption_entities) res.caption_entities = formatted.entities;
  }
  return res;
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-emoji.mjs
function validateEmojiId(value) {
  if(typeof value!=="string"||!/^[1-9][0-9]{0,23}$/.test(value))throw Error("معرّف إيموجي بريميوم غير صالح.");
  return value;
}
function validateMenuIcon(value) {
  if(value===undefined)return undefined;
  if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).some(k=>!["id","alt"].includes(k)))throw Error("أيقونة الزر غير صالحة.");
  const id=validateEmojiId(value.id),alt=value.alt??"⭐";
  if(typeof alt!=="string"||!alt||alt.length>32||/[\p{Cc}\p{Cs}]/u.test(alt))throw Error("رمز الإيموجي البديل غير صالح.");
  return {id,alt};
}
function boundary(text,offset) {
  return offset===0||offset===text.length||!(text.charCodeAt(offset)>=0xdc00&&text.charCodeAt(offset)<=0xdfff&&text.charCodeAt(offset-1)>=0xd800&&text.charCodeAt(offset-1)<=0xdbff);
}
// Telegram offsets are UTF-16 code units, matching JavaScript string offsets.
function takeCustomIcon(text,entities=[],start=0,end=text.length) {
  if(!Array.isArray(entities))throw Error("بيانات الإيموجي غير صالحة.");
  const chosen=entities.filter(e=>e?.type==="custom_emoji"&&e.offset<end&&e.offset+e.length>start);
  if(!chosen.length)return {text:text.slice(start,end).trim()};
  if(chosen.length!==1)throw Error("تليجرام يدعم أيقونة بريميوم واحدة لكل زر. أرسل إيموجيًا واحدًا مع اسم الزر.");
  const entity=chosen[0],a=entity.offset,b=a+entity.length;
  if(!Number.isInteger(a)||!Number.isInteger(entity.length)||entity.length<1||entity.length>32||a<start||b>end||!boundary(text,a)||!boundary(text,b))throw Error("موضع إيموجي بريميوم غير صالح. أعد إرساله من لوحة الإيموجي في تليجرام.");
  const icon=validateMenuIcon({id:entity.custom_emoji_id,alt:text.slice(a,b)});
  return {text:(text.slice(start,a)+text.slice(b,end)).replace(/\s+/g," ").trim(),icon};
}
function iconFromMessage(message) {
  if(message.sticker?.custom_emoji_id)return validateMenuIcon({id:message.sticker.custom_emoji_id,alt:message.sticker.emoji??"⭐"});
  if(typeof message.text!=="string")throw Error("أرسل إيموجي بريميوم من لوحة تليجرام، وليس صورة.");
  const parsed=takeCustomIcon(message.text,message.entities);
  if(!parsed.icon)throw Error("هذا إيموجي عادي أو فقد بياناته عند النسخ. أرسل إيموجي بريميوم مباشرة من لوحة تليجرام أو حوّل رسالة تحتويه.");
  return parsed.icon;
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-rich.mjs

const COLORS = new Map([
  ["أزرق","primary"],["ازرق","primary"],["blue","primary"],["primary","primary"],
  ["أخضر","success"],["اخضر","success"],["green","success"],["success","success"],
  ["أحمر","danger"],["احمر","danger"],["red","danger"],["danger","danger"],
  ["عادي",undefined],["افتراضي",undefined],["default",undefined],
]);
const FORMATTING = new Set(["bold","italic","underline","strikethrough","spoiler","blockquote","expandable_blockquote","code","pre","text_link"]);
const colorName = {primary:"أزرق",success:"أخضر",danger:"أحمر"};
const hadaba_rich_digits = (s) => s.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)-(c>="۰"?0x6f0:0x660)));
const looksLikeUrl = (s) => /^(?:[a-z][a-z0-9+.-]*:|www\.|[^\s|/]+\.[a-z]{2,}(?:[/:?#]|$))/i.test(s.trim());

function hadaba_rich_button(label,url,style,icon) {
  if(typeof label!=="string" || !label.trim() || label.trim().length>80 || /[\r\n|\p{Cc}\p{Cs}]/u.test(label))throw Error("عنوان زر الرابط يكون من حرف إلى 80 حرفًا، في سطر واحد وبدون |.");
  if(typeof url!=="string" || url.length>2048 || /[\s|\p{Cc}]/u.test(url))throw Error("رابط الزر غير صالح. استخدم رابطًا كاملًا يبدأ بـ https://، واستبدل | داخل الرابط بـ %7C.");
  let parsed;try{parsed=new URL(url);}catch{throw Error("رابط الزر غير صالح. مثال: https://t.me/YourChannel");}
  if(!["http:","https:","tg:"].includes(parsed.protocol) || !parsed.hostname)throw Error("روابط الأزرار تدعم http:// وhttps:// وtg:// فقط.");
  if(style!==undefined && !["primary","success","danger"].includes(style))throw Error("لون الزر غير مدعوم. اختر أزرق أو أخضر أو أحمر أو عادي.");
  if(icon!==undefined)validateEmojiId(icon);
  return {text:label.trim(),url,...(style?{style}:{}),...(icon?{icon_custom_emoji_id:icon}:{})};
}

// Stored keyboards and imported backups can contain URL buttons only.
function validateInlineKeyboard(rows) {
  if(rows===undefined)return undefined;
  if(!Array.isArray(rows) || rows.length>100 || rows.some(row=>!Array.isArray(row)||!row.length||row.length>8) || rows.reduce((n,row)=>n+row.length,0)>100)throw Error("أزرار الروابط: الحد 100 زر، ومن زر واحد إلى 8 أزرار في الصف.");
  return rows.map(row=>row.map(b=>{
    if(!b || typeof b!=="object" || Array.isArray(b) || Object.keys(b).some(k=>!["text","url","style","icon_custom_emoji_id"].includes(k)))throw Error("صيغة زر الرابط غير صحيحة.");
    return hadaba_rich_button(b.text,b.url,b.style,b.icon_custom_emoji_id);
  }));
}

function mergeRanges(ranges) {
  const merged=[];
  for(const r of ranges.sort((a,b)=>a[0]-b[0])) {
    const previous=merged.at(-1);
    if(previous&&r[0]<=previous[1])previous[1]=Math.max(previous[1],r[1]);else merged.push([...r]);
  }
  return merged;
}

function removeSyntax(text,entities,ranges) {
  // Remove the entire line for a line containing only button/layout syntax.
  const tokens=mergeRanges(ranges);
  let lineStart=0;
  for(const line of text.split("\n")) {
    const lineEnd=lineStart+line.length;
    const pieces=tokens.filter(([start,end])=>start<lineEnd&&end>lineStart);
    if(pieces.length) {
      let cursor=lineStart,remainder="";
      for(const [start,end]of pieces){remainder+=text.slice(cursor,Math.max(cursor,start));cursor=Math.max(cursor,end);}
      remainder+=text.slice(Math.min(cursor,lineEnd),lineEnd);
      if(!remainder.trim())ranges.push([lineStart,Math.min(text.length,lineEnd+1)]);
    }
    lineStart=lineEnd+1;
  }
  const removed=mergeRanges(ranges);
  const map=(index)=>index-removed.reduce((n,[start,end])=>n+Math.max(0,Math.min(index,end)-start),0);
  let next="",cursor=0;
  for(const [start,end]of removed){next+=text.slice(cursor,start);cursor=end;}next+=text.slice(cursor);
  const left=next.length-next.trimStart().length,right=next.trimEnd().length;
  const formatted=[];
  for(const entity of entities) {
    const start=entity.offset,end=start+entity.length;
    const overlapping=removed.some(([a,b])=>a<end&&b>start);
    if(overlapping&&!FORMATTING.has(entity.type))continue;
    const a=Math.max(left,map(start)),b=Math.min(right,map(end));
    if(b>a)formatted.push({...entity,offset:a-left,length:b-a});
  }
  return {text:next.slice(left,Math.max(left,right)),entities:formatted};
}

function parseRichText(text,entities=[]) {
  const buttons=[],ranges=[];
  // Balanced parentheses allow URLs such as /FAQ_(Students) and multiple buttons on one line.
  for(let i=0;i<text.length;i++) {
    if(text[i]!=="(")continue;
    let depth=1,separator=-1,end=-1;
    for(let j=i+1;j<text.length&&text[j]!=="\n"&&text[j]!=="\r";j++) {
      if(text[j]==="(")depth++;
      else if(text[j]===")"&&!--depth){end=j+1;break;}
      else if(text[j]==="|"&&depth===1&&separator<0)separator=j;
    }
    if(end<0&&separator>=0&&looksLikeUrl(text.slice(separator+1).split(/[\r\n|]/)[0]))throw Error("أغلق قوس زر الرابط. الصيغة: (عنوان الزر|https://example.com).");
    if(end<0||separator<0)continue;
    let cursor=i+1;const fields=text.slice(i+1,end-1).split("|").map(raw=>{const start=cursor+raw.length-raw.trimStart().length,end=cursor+raw.trimEnd().length;cursor+=raw.length+1;return {value:raw.trim(),start,end};});
    let labelField=fields[0],urlField=fields[1];
    // Preserve Telegram entity offsets even when the URL precedes the Arabic label.
    if(looksLikeUrl(labelField.value)&&!looksLikeUrl(urlField.value))[labelField,urlField]=[urlField,labelField];
    // A vertical bar in a formula or ordinary text is not a button definition.
    if(!looksLikeUrl(urlField.value))continue;
    if(fields.length>4)throw Error("صيغة الزر: (العنوان|الرابط|اللون اختياري|إيموجي:المعرّف اختياري).");
    const named=takeCustomIcon(text,entities,labelField.start,labelField.end);let style,icon=named.icon?.id,colorSeen=false,iconSeen=false;
    for(const option of fields.slice(2)) {
      const value=option.value.normalize("NFKC").toLowerCase(),match=value.match(/^(?:إيموجي|ايموجي|emoji)\s*:\s*(.*)$/u);
      if(match){if(iconSeen)throw Error("استخدم معرّف إيموجي واحدًا للزر.");const id=validateEmojiId(match[1]);if(icon&&icon!==id)throw Error("إيموجي الاسم يختلف عن المعرّف المكتوب. استخدم أحدهما.");icon=id;iconSeen=true;}
      else{if(colorSeen||!COLORS.has(value))throw Error("لون الزر غير مدعوم. اختر أزرق أو أخضر أو أحمر أو عادي.");style=COLORS.get(value);colorSeen=true;}
    }
    buttons.push(hadaba_rich_button(named.text,urlField.value,style,icon));ranges.push([i,end]);i=end-1;
    if(buttons.length>100)throw Error("الحد 100 زر رابط في الرد الواحد.");
  }
  const layouts=[...text.matchAll(/\[صف\s*:\s*([^\]\r\n]*)\]/gu)];
  if(layouts.length>1)throw Error("استخدم سطر [صف:...] مرة واحدة فقط في الرد.");
  let counts;
  if(layouts.length) {
    const match=layouts[0],pattern=hadaba_rich_digits(match[1]).trim();
    if(!/^[1-8](?:\s*-\s*[1-8])*$/.test(pattern))throw Error("صيغة الصفوف غير صحيحة. مثال: [صف:1-2-1]؛ كل صف من زر إلى 8 أزرار.");
    counts=pattern.split("-").map(Number);
    if(counts.reduce((n,c)=>n+c,0)!==buttons.length)throw Error(`مجموع أرقام الصفوف يجب أن يساوي عدد أزرار الروابط (${buttons.length}).`);
    ranges.push([match.index,match.index+match[0].length]);
  }
  if(!ranges.length)return {text,entities:structuredClone(entities)};
  if(!buttons.length)throw Error("أضف أزرار الروابط قبل سطر ترتيب الصفوف.");
  const rows=[];let offset=0;
  for(const size of counts??Array(Math.ceil(buttons.length/2)).fill(2)) {rows.push(buttons.slice(offset,offset+size));offset+=size;}
  return {...removeSyntax(text,entities,ranges),inlineKeyboard:validateInlineKeyboard(rows)};
}

function buttonsToSource(rows=[]) {
  return rows.flat().map(b=>`(${b.text}|${b.url}${b.style?"|"+colorName[b.style]:""}${b.icon_custom_emoji_id?"|إيموجي:"+b.icon_custom_emoji_id:""})`).join("\n")+(rows.length?`\n[صف:${rows.map(row=>row.length).join("-")}]`:"");
}

function parseButtonEditor(text,entities=[]) {
  const parsed=parseRichText(text,entities);
  if(!parsed.inlineKeyboard?.length || parsed.text.trim())throw Error("أرسل أسطر الأزرار وترتيب الصفوف فقط. لتغيير النص أو الصورة اختر «تغيير الرد».");
  return parsed.inlineKeyboard;
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-guide.mjs
const GUIDE_PAGES = [
  {title:"إنشاء الرد",html:`<b>دليل هضبة 🌄 • إنشاء الرد</b>

1️⃣ افتح خاص البوت وأرسل /groups، واختر المجموعة التي تريد إضافة الرد إليها.
2️⃣ تأكد من اسم «القائمة الحالية» في /admin، ثم اختر «إضافة زر» أو أرسل /add.
3️⃣ اكتب اسم الرد، مثل: التواصل.
4️⃣ عندما يطلب البوت الجواب، أرسل نصك المنسق، أو صورة مع وصفها. تستطيع وضع أزرار الروابط في الرسالة نفسها بهذه الطريقة:

<pre>يسعدنا تواصلك مع فريق القناة 🌄
(التواصل|https://t.me/YourContact)
(القناة|https://t.me/YourChannel)
[صف:1-1]</pre>

استبدل الروابط بروابطكم. يُحفظ الرد وتظهر معاينته، ثم يظهر ضمن أزرار /menu في المجموعة المختارة فقط. تستطيع استخدام الاسم نفسه في مجموعات مختلفة، ولكل اسم جوابه الخاص. الضغط على اسم الرد يرسل اسمه في الشات، ويجيب البوت بالنص أو الصورة وأزرار الروابط تحتها.

الإضافة والتعديل للمالك والمساعدين فقط. أرسل /cancel لإلغاء الإدخال.`},
  {title:"الروابط والصفوف",html:`<b>دليل هضبة 🌄 • أزرار الروابط وترتيبها</b>

كل زر يُكتب في سطر مستقل، بنفس طريقة البوت السابق:
<pre>(عنوان الزر|https://example.com)</pre>

يمكنك نسخ ردودكم القديمة بهذه الصيغة. البوت يخفي أسطر الصيغة من النص ويحولها إلى أزرار تحت الرد.

بدون تحديد الصفوف: زران في كل صف، والزر الأخير وحده إذا كان العدد فرديًا.
لتحديدها: أضف <code>[صف:1-2-1]</code>. أول صف زر واحد، الثاني زران، الثالث زر واحد. الأرقام من اليسار إلى اليمين في الصيغة، ومجموعها يساوي عدد الأزرار.

<pre>روابط تهمك 👇
(الموقع|https://example.com)
(التواصل|https://t.me/YourContact)
(الخدمات|https://example.com/services)
(القناة|https://t.me/YourChannel)
[صف:1-2-1]</pre>

لخمسة أزرار يمكنك مثلًا استخدام <code>[صف:1-1-2-1]</code>. الحد 100 زر رابط في الرد، ومن زر إلى 8 أزرار في الصف. لكل زر عنوان حتى 80 حرفًا. تدعم الروابط http:// وhttps:// وtg://.`},
  {title:"ألوان الأزرار",html:`<b>دليل هضبة 🌄 • ألوان الأزرار</b>

لإضافة لون، اكتب حقلًا ثالثًا بعد الرابط:
<pre>(الموقع|https://example.com|أزرق)
(التواصل|https://t.me/YourContact|أخضر)
(تنبيه|https://example.com/notice|أحمر)
[صف:1-1-1]</pre>

🔵 أزرق — يمكنك أيضًا كتابة blue أو primary.
🟢 أخضر — green أو success.
🔴 أحمر — red أو danger.
⚪ عادي — لون تليجرام الافتراضي؛ اكتب عادي أو احذف حقل اللون.

كل زر له لونه المستقل. هذه الألوان يدعمها تليجرام؛ شكلها قد يختلف حسب إصدار التطبيق والمظهر. لا يدعم النص العادي ألوانًا تختارها بنفسك.`},
  {title:"التنسيق والصور",html:`<b>دليل هضبة 🌄 • تنسيق النص والصور</b>

اكتب الجواب في تليجرام، ثم حدّد الكلمات واضغط قائمة التنسيق. اختر <b>عريضًا</b>، <i>مائلًا</i>، <u>تحته خط</u>، <s>مشطوبًا</s>، <tg-spoiler>مخفيًا</tg-spoiler>، اقتباسًا، كودًا أو رابطًا داخل النص. يحفظ هضبة تنسيق تليجرام كما أرسلته، حتى مع الإيموجي وأزرار الروابط.

لرد بصورة: أرسل صورة واحدة، واكتب الجواب وصيغ الأزرار في وصف الصورة. تظهر الصورة ووصفها والأزرار في رسالة واحدة. ينطبق ذلك أيضًا على الفيديو والملف والصوت. يمكنك إرسال صورة بلا وصف، ثم إضافة أزرارها من محرر «أزرار الروابط».

إذا كان الرد نصًا وأزرارًا فقط دون نص، يعرض البوت «اختر من الروابط التالية 👇». أما الصورة فيمكن أن تظهر بالأزرار وحدها.

الحد: 4096 حرفًا للرسالة، و1024 حرفًا لوصف الوسائط. أرسل ملفًا أو صورة واحدة في كل رد؛ الألبومات غير مدعومة. استخدم أسطرًا فارغة وإيموجي لتقسيم المعلومات، ونسّق الكلام من قائمة تليجرام بدل كتابة رموز تنسيق يدويًا.`},
  {title:"التعديل والمساعدون",html:`<b>دليل هضبة 🌄 • تعديل الردود والعمل مع الفريق</b>

📝 اختر المجموعة أولًا من /groups، ثم افتح /replies أو /admin ثم «الأزرار والردود»، واختر اسم الرد.
• «تغيير الرد»: أرسل النص أو الصورة الجديدة؛ إذا أرسلت معها صيغ أزرار تستبدل أزراره الحالية، وإذا لم ترسل صيغًا تبقى أزراره الحالية.
• «أزرار الروابط»: غيّر الروابط والألوان والصفوف وحدها، أو اختر «إزالة أزرار الروابط».
• «معاينة الرد»: شاهد الرد كما يظهر للطلاب.
• يمكنك تغيير الاسم، إخفاء الرد وإظهاره، تغيير ترتيبه أو حذفه.

👥 لإضافة مساعد: اطلب منه فتح البوت وإرسال /id. من حساب المالك افتح /admin ثم «المساعدون» ← «إضافة مساعد»، وأرسل رقمه. بعد الإضافة حدد مجموعاته بعلامة ✅. ولتغيير مجموعات مساعد موجود: «المساعدون» ← اسمه ← «تحديد مجموعات المساعد». يستطيع إنشاء الردود وتعديلها في مجموعاته المسموح بها فقط، والمالك يدير الصلاحيات وربط المجموعات والنسخ الاحتياطية. اختيار المجموعة مستقل لكل مساعد؛ تظهر له المجموعات التي سمح بها المالك فقط.

💾 من لوحة المالك خذ نسخة احتياطية؛ تشمل النصوص والصور وأزرار الروابط وألوانها وترتيبها. يمكن أخذ نسخة لقائمة واحدة أو لجميع القوائم. عند الاستعادة تختار قائمة المصدر والوجهة، وتراجع العدد قبل التأكيد؛ تُستبدل ردود الوجهة وحدها.

🔗 في المجموعة المرتبطة أرسل /menu لتحديث قائمة المواضيع. لربط مجموعة جديدة أضف البوت ثم أرسل /connect من حساب المالك. إدارة الردود تكون في خاص البوت.

لشرح النسخ بين المجموعات وقائمة الخاص، افتح صفحة «المجموعات المستقلة».

تجد الدليل دائمًا في /guide وفي قائمة الأوامر عند كتابة /.`},
  {title:"المجموعات المستقلة",html:`<b>دليل هضبة 🌄 • لكل مجموعة قائمتها</b>

1️⃣ من حساب المالك، أضف هضبة للمجموعة وأرسل فيها /connect. المجموعة الجديدة تبدأ دون ردود.
2️⃣ افتح خاص هضبة وأرسل /groups أو /admin ← «اختيار المجموعة». اضغط اسم المجموعة؛ يظهر اسمها في رأس كل شاشة إضافة وتعديل.
3️⃣ أضف الردود من /add، أو عدّلها من /replies. تظهر في تلك المجموعة وحدها. في المجموعة أرسل /menu لإظهار القائمة، أو من لوحة المالك اختر «تحديث الردود والأزرار».

كل مجموعة لها أسماء أزرارها وأجوبتها وترتيبها وعدد الأزرار في الصف وإحصاءاتها. يمكن أن يكون زر «التواصل» في مجموعتين، ويعرض رابطًا وجوابًا مختلفين في كل واحدة.

📋 <b>لنسخ الردود:</b> اختر المجموعة الوجهة، ثم «نسخ ردود من قائمة»، واختر المصدر وراجع العدد وأكّد. تُنسخ الصور والتنسيقات وأزرار الروابط وألوانها. الأسماء الموجودة في الوجهة تُتخطى دون استبدال. بعد النسخ تعدّل كل قائمة بصورة مستقلة.

📁 <b>الخاص / الردود المحفوظة:</b> قائمة خاصة بالمحادثة مع البوت. تحفظ نسخة الردود القديمة، ويمكن استخدامها مصدرًا للنسخ إلى المجموعات الجديدة. معاينة المدير في الخاص تعرض المجموعة المختارة؛ المستخدم العادي يرى قائمة الخاص فقط.

⏸ /disconnect يوقف البوت في المجموعة ويحفظ ردودها. يمكنك اختيارها من الإدارة، ثم /connect في المجموعة يعيد تشغيلها بنفس محتواها.

المساعدون يستطيعون اختيار مجموعاتهم المسموح بها فقط وإدارة محتواها. يحددها المالك من «المساعدون» ← اسم المساعد ← «تحديد مجموعات المساعد». عند تغيير المجموعة يُلغى الإدخال الجاري، وتُرفض أزرار التعديل القديمة حتى لا تعدّل قائمة أخرى بالخطأ.`},
  {title:"صلاحيات المساعدين",html:`<b>دليل هضبة 🌄 • مساعدون لكل مجموعة</b>

<b>إضافة مساعد جديد:</b>
1️⃣ اطلب منه فتح البوت وإرسال /id، ليعطيك رقم حسابه.
2️⃣ من حساب المالك افتح /admin ← «المساعدون» ← «إضافة مساعد»، ثم أرسل رقمه.
3️⃣ تظهر قائمة المجموعات مباشرة. اضغط اسم المجموعة ليظهر ✅ ويسمح للمساعد بإدارتها. يمكنك اختيار مجموعة واحدة أو أكثر. الاختيارات تُحفظ فورًا.

<b>تغيير صلاحيات مساعد موجود:</b>
/admin ← «المساعدون» ← اسم المساعد ← «تحديد مجموعات المساعد».
✅ تعني مسموح، و⬜ تعني غير مسموح. اضغط المجموعة لسحب الصلاحية أو إضافتها. قائمة الخاص مستقلة، ولا تعطِ صلاحيتها للمساعد إلا إذا رغبت أن يدير ردود الخاص أيضًا.

<b>ماذا يستطيع المساعد؟</b>
تظهر له في /groups المجموعات المسموح بها فقط. يستطيع إضافة الردود وتعديل النص والصور والروابط والألوان، وترتيب الأزرار وإخفاءها وحذفها ومراجعة إحصاءاتها في تلك المجموعات. النسخ بين قائمتين يحتاج صلاحية على المصدر والوجهة معًا. يستطيع المساعد أيضًا تحديث قائمته من زر «تحديث الردود والأزرار» أو /refresh؛ لا يستطيع تحديث مجموعة غير مسموح له بها.

لا يستطيع إعطاء صلاحيات لنفسه أو لغيره، أو ربط المجموعات، أو أخذ النسخ الاحتياطية واستعادتها؛ هذه العمليات للمالك فقط.

<b>سحب الصلاحية:</b>
يُوقف الإدخال الجاري وتُرفض أزرار التعديل القديمة، فلا يستطيع إكمال تعديل للمجموعة بعد سحب صلاحيتها. ردود المجموعة تبقى محفوظة.

المساعد الجديد يبدأ دون صلاحيات لأي قائمة. والمساعدون المسجلون قبل تحديث صلاحيات المجموعات يحتاجون أن يحدد لهم المالك مجموعاتهم. لا تؤثر إدارة الصلاحيات على ردودك أو صلاحيات المالك.`},
  {title:"تصميم الفهرس",html:`<b>دليل هضبة 🌄 • تصميم الفهرس</b>

اختر المجموعة من /groups، ثم /admin ← «تنسيق الأزرار». كل خيار مسودة اختيارية؛ لا تتغير إعداداتك الحالية حتى تضغط «حفظ فقط» أو «حفظ وتحديث المجموعة».

🧩 <b>قوالب الصفوف:</b> قائمة عمودية، زران أو ثلاثة أو أربعة أو ستة في الصف، زر رئيسي ثم أزواج، صفوف متدرجة 1–2–3، بطاقات 2–1، أو صفوف متناوبة 1–3. قالب «فهرس مرقّم» يضيف ترقيمًا عربيًا، وقالب «فهرس ملون» يعطي ألوانًا متناوبة.

✏️ <b>صفوف مخصصة:</b> أرسل مثلًا <code>1-3-2</code> أو <code>١-٣-٢</code>. يتكرر النمط في كل صفحة، وآخر صف يعرض ما بقي من الأزرار. من 1 إلى 6 أزرار في الصف. العناوين القصيرة أنسب للشبكات الكثيفة.

🎨 <b>الألوان:</b> عادي، أزرق، أخضر، أحمر، ألوان متناوبة، أو لون لكل صف. ولتمييز زر معين، افتح تفاصيله ثم «تصميم هذا الزر»، واختر لونًا مستقلًا أو «حسب القالب». تستطيع هناك أيضًا تحديد حجمه ومكانه وحدود صفه. ألوان الأزرار وشكلها يعتمدان على إصدار تليجرام ومظهره.

🔢 <b>الترقيم والزخرفة:</b> أرقام عربية أو إنجليزية، نقاط، إطارات أو أسهم. يتغير شكل العنوان الظاهر فقط؛ اسم الرد ومحتواه يبقيان محفوظين. الضغط على العنوان المرقّم يفتح الجواب الصحيح، ويمكن أيضًا كتابة اسم الرد الأصلي.

⚙️ <b>خيارات الفهرس:</b> 6 أو 12 أو 18 أو 24 أو 36 زرًا بالصفحة، لوحة دائمة أو مخفية بعد الضغط، ارتفاع تلقائي، عنوان للفهرس ونص مخصص لخانة الإدخال.

👁 اضغط «معاينة» لتشاهد الفهرس في الخاص. «حفظ فقط» يحفظ دون إرسال رسالة للمجموعة، و«حفظ وتحديث المجموعة» يحفظ وينشر القائمة. /cancel يلغي المسودة. خيار «التنسيق السابق» يعيد إعدادات آخر تنسيق إلى مسودة جديدة تراجعها قبل الحفظ.`},
  {title:"ترتيب الأزرار والروابط",html:`<b>دليل هضبة 🌄 • الترتيب الاختياري</b>

/admin ← «ترتيب الأزرار».

🔤 <b>أبجدي: العربية ثم الإنجليزية:</b> تظهر معاينة قبل الحفظ. يقارن الأسماء دون التشكيل والزخارف في البداية، ويعامل أشكال الألف بمرونة، ويرتب الأرقام طبيعيًا مثل 2 قبل 10. الفرز لا يغيّر أسماء الأزرار ولا أجوبتها. يُطبّق مرة واحدة عند التأكيد؛ الردود الجديدة تُضاف للنهاية.

🖐 <b>اختر الأول ثم الثاني:</b> اضغط أسماء الأزرار بالتسلسل المطلوب. يمكنك التراجع عن آخر اختيار. «أكمل البقية وراجع» يجعل اختياراتك أولًا ويترك بقية الأزرار بترتيبها الحالي، ثم يطلب تأكيد الحفظ.

📝 <b>إرسال ترتيب كنص:</b> أرسل اسم كل زر بسطر، أو رقم موضعه الحالي. تستطيع إرسال بعض الأزرار المهمة فقط. الأسماء غير الموجودة والمكررة تُرفض، ويعرض البوت المعاينة قبل أي تغيير.

↶ <b>الرجوع للترتيب السابق:</b> يعرض الترتيب السابق للمراجعة؛ الأزرار التي أُضيفت لاحقًا تبقى، والمحذوفة لا تعود. لا يغيّر هذا الخيار نصوص الردود أو صورها.

🔗 <b>تنسيق روابط الرد:</b> من تفاصيل أي رد اختر «تنسيق روابط الرد». جرّب من زر إلى 8 أزرار في الصف، زرًا رئيسيًا ثم أزواجًا، صفوفًا متدرجة أو نمطًا مخصصًا، وألوانًا موحدة أو متناوبة. اضغط «معاينة الرد» لرؤية الصورة والنص والروابط معًا. لا تتغير الروابط أو عناوينها أو ترتيبها، ولا يحفظ الشكل قبل التأكيد. ويمكن ترتيب الروابط يدويًا بتغيير ترتيب أسطرها في محرر «أزرار الروابط».

🔄 <b>تحديث المجموعة:</b> المالك والمساعد المصرح له يستطيعان الضغط على «تحديث الردود والأزرار» أو إرسال /refresh في الخاص بعد اختيار المجموعة، أو داخل المجموعة نفسها. التحديث ينشر الإعدادات المحفوظة فقط، ولا يعتمد مسودة لم تحفظها.

كل تنسيق وترتيب يخص المجموعة المختارة وحدها. إذا تغير المحتوى أو سُحبت الصلاحية أثناء المعاينة، يطلب البوت مراجعة جديدة بدل استبدال تعديلات الفريق.`},
  {title:"تصميم زر واحد",html:`<b>دليل هضبة 🌄 • تصميم زر واحد</b>

/groups ← اختر المجموعة، ثم /admin ← «الأزرار والردود» ← اسم الزر ← «تصميم هذا الزر».

🎨 <b>لون هذا الزر:</b> عادي، أزرق، أخضر أو أحمر، أو «حسب القالب» ليتبع لون المجموعة. يخص اللون زر الفهرس الذي تختاره.

↔️ <b>حجم هذا الزر:</b> «سطر كامل» يجعله وحده، أو اختر صفًا مع زر ثانٍ، أو 3 أو 4 أو 5 أو 6 أزرار. «حسب القالب» يعيد الحجم إلى نمط المجموعة. يعتمد الحجم على توزيع الصف، وليس على مقاس بالبكسل أو حجم خط تختاره. العرض والارتفاع النهائيان حسب تليجرام.

📍 <b>مكان هذا الزر:</b> أول القائمة أو آخرها، تقديم أو تأخير موضع واحد، قبل أو بعد زر تختاره، أو كتابة رقم موضعه مثل <code>٣</code>. بقية الأزرار تحتفظ بترتيبها النسبي. رقم الموضع يشمل الأزرار المخفية أيضًا، وهي لا تظهر للطلاب.

🧱 <b>حدود الصف:</b> شغّل «يبدأ سطرًا جديدًا» أو «ينتهي السطر بعده» إذا أردت فصله عن جيرانه. يبدأ الحجم المستقل صفًا جديدًا إذا اختلف عن حجم الصف السابق؛ الأزرار ذات الحجم المتوافق تستطيع مشاركة الصف. إذا لم توجد أزرار كافية، أو قابل صفه زرًا مستقلًا أو حدًا جديدًا، يظهر تنبيه ويوزع تليجرام العرض على الموجود.

👁 <b>معاينة الزر ومكانه:</b> تعرض الصفحة التي يوجد فيها الزر مباشرة، مع رقم صفه وموضعه داخل الصف. اتجاه العرض حسب تطبيق تليجرام. الزر المخفي يظهر في هذه المعاينة فقط، ويبقى مخفيًا للطلاب.

↩️ <b>إلغاء تخصيصه:</b> يعيد اللون والحجم وحدود الصف إلى القالب في المسودة، ويبقي المكان الذي اخترته. تغيير قالب المجموعة لاحقًا يحترم التخصيص المستقل حتى تلغيه.

💾 «حفظ فقط» يحفظ التصميم دون نشر رسالة للمجموعة. «حفظ وتحديث المجموعة» يحفظ وينشر الفهرس الجديد. إغلاق المسودة أو /cancel يلغي اختياراتها. جميع الخيارات اختيارية وتخص المجموعة المحددة فقط، والمساعد يعمل داخل مجموعاته المسموح بها.

<b>مثال:</b> اجعل «التواصل» أخضر، بحجم «سطر كامل»، وفي أول القائمة، ثم عاينه واحفظه. تبقى الصورة ونص الجواب وأزرار روابطه محفوظة كما هي.`},
  {title:"إشعارات إضافات المساعدين",html:`<b>دليل هضبة 🌄 • إشعارات المالك</b>

🔔 تصل إلى مالك البوت رسالة في الخاص عندما يحفظ مساعد ردًا جديدًا، أو ينسخ ردودًا جديدة إلى إحدى مجموعاته.

تتضمن الرسالة:
• اسم المساعد الظاهر في تيليجرام (النيك نيم)، بدل رقم حسابه.
• اسم المجموعة التي أضاف إليها.
• اسم الزر المضاف، أو ملخص الأزرار إذا نسخ عدة ردود.
• زر لمعاينة أحدث نسخة من الرد، وزر لفتح لوحة المجموعة.

لا ترسل إضافة المالك لنفسه إشعارًا. تعديل الجواب الموجود أو لون الزر أو ترتيبه ليس إضافة جديدة، ولا يرسل إشعار إضافة. المسودة الملغاة أو الرد الذي لم ينجح حفظه لا يرسل إشعارًا.

⚙️ الإشعارات مفعلة. يستطيع المالك إيقافها أو تشغيلها من /admin ← «إشعارات المساعدين». هذا الإعداد للمالك فقط، ولا يغيّر صلاحيات المساعدين أو مجموعاتهم.

يُجهز إشعار الإضافة مع حفظ الرد في العملية نفسها. إذا كرر تيليجرام التحديث، لا تُعاد إضافة الرد أو إنشاء إشعار جديد له، وإذا تعذر إرسال الإشعار مؤقتًا يبقى محفوظًا لإعادة المحاولة.`},
  {title:"العد التنازلي والمواعيد",html:`<b>دليل هضبة 🌄 • حساب الأيام والتواريخ والعد التنازلي</b>

ميزة ذكية لحساب المواعيد وعرض الأيام المتبقية أو المنقضية تلقائيًا لحظة طلب الرد:

📅 <b>التقويم الميلادي:</b>
• 24 ساعة: <code>{2026-10-27 16:00}</code>
• 12 ساعة: <code>{2026-10-27 4:00 م}</code>
• بدون ساعة: <code>{2026-10-27}</code>

🌙 <b>التقويم الهجري:</b>
• 24 ساعة: <code>&lt;1448-04-15 16:00&gt;</code>
• 12 ساعة: <code>&lt;1448-04-15 4:00 م&gt;</code>
• بدون ساعة: <code>&lt;1448-04-15&gt;</code>

🔄 <b>المواعيد المتجددة تلقائيًا (بوضع نجمة * مكان التكرار):</b>
• تكرار سنوي: <code>{*-07-15 00:00}</code> أو <code>{*-07-15}</code>
• تكرار شهري (مثل الرواتب): <code>{2026-*-27 00:00}</code>
• تكرار يومي: <code>{2026-10-* 12:00 AM}</code>

⚡️ <b>كيف يظهر للطلاب؟</b>
يتحول التاج تلقائيًا إلى اسم اليوم، والتاريخ الهجري والميلادي، والعد التنازلي:
<code>الخميس [1448-04-15هـ] [2026-10-27م] [بعد 12 يوم و 5 ساعات]</code>

⏱ <b>المعالج التفاعلي الذكي:</b>
يمكنك الضغط على «⏱ إضافة موعد» في لوحة الإدارة وسيرشدك البوت خطوة بخطوة (السنة، الشهر، اليوم، الوقت، واسم الزر) لتثبيت الرد بسهولة.`}
];

const PUBLIC_COMMANDS = [
  {command:"start",description:"بدء استخدام هضبة"},
  {command:"menu",description:"أزرار الردود"},
  {command:"guide",description:"شروحات مكتوبة ومصورة لكل مزايا هضبة"},
  {command:"help",description:"طريقة الاستخدام"},
  {command:"id",description:"رقم حسابك"},
  {command:"refresh",description:"تحديث الردود والأزرار للمجموعة المسموح بها"},
];
const PRIVATE_COMMANDS = [
  PUBLIC_COMMANDS[0],PUBLIC_COMMANDS[1],PUBLIC_COMMANDS[2],
  {command:"groups",description:"اختيار المجموعة لإدارة ردودها"},
  {command:"admin",description:"لوحة إدارة هضبة للمالك والمساعدين"},
  {command:"add",description:"إضافة رد للمجموعة المختارة"},
  {command:"date",description:"إضافة موعد أو عد تنازلي ذكي"},
  {command:"replies",description:"ردود المجموعة المختارة وتعديلها"},
  {command:"cancel",description:"إلغاء الإدخال الحالي"},
  PUBLIC_COMMANDS[3],PUBLIC_COMMANDS[4],PUBLIC_COMMANDS[5],
];

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-illustrated.mjs
// Generated by scripts/compile-guides.py; edit docs/guides/source.py.
const GUIDE_CATEGORIES={"begin": "البداية والمجموعات", "replies": "الردود والنصوص والوسائط", "design": "التنسيق والألوان وتصميم الأزرار", "order": "الترتيب والحفظ والتحديث", "team": "المساعدون والعمل بين المجموعات", "tools": "النسخ الاحتياطية والإحصاءات والمشكلات"};
const GUIDE_ARTICLES=[{"id": "use", "title": "البداية واستخدام أزرار هضبة", "category": "begin", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D8%A8%D8%AF%D8%A7%D9%8A%D8%A9-%D9%88%D8%A7%D8%B3%D8%AA%D8%AE%D8%AF%D8%A7%D9%85-%D8%A3%D8%B2%D8%B1%D8%A7%D8%B1-%D9%87%D8%B6%D8%A8%D8%A9-10-13", "path": "ردود-هضبة--البداية-واستخدام-أزرار-هضبة-10-13"}, {"id": "groups", "title": "مجموعة مستقلة لكل قائمة", "category": "begin", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9-%D9%85%D8%B3%D8%AA%D9%82%D9%84%D8%A9-%D9%84%D9%83%D9%84-%D9%82%D8%A7%D8%A6%D9%85%D8%A9-10-13", "path": "ردود-هضبة--مجموعة-مستقلة-لكل-قائمة-10-13"}, {"id": "create", "title": "إنشاء زر وحفظ الجواب", "category": "begin", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A5%D9%86%D8%B4%D8%A7%D8%A1-%D8%B2%D8%B1-%D9%88%D8%AD%D9%81%D8%B8-%D8%A7%D9%84%D8%AC%D9%88%D8%A7%D8%A8-10-13", "path": "ردود-هضبة--إنشاء-زر-وحفظ-الجواب-10-13"}, {"id": "text", "title": "تنسيق نص الرد خطوة بخطوة", "category": "replies", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AA%D9%86%D8%B3%D9%8A%D9%82-%D9%86%D8%B5-%D8%A7%D9%84%D8%B1%D8%AF-%D8%AE%D8%B7%D9%88%D8%A9-%D8%A8%D8%AE%D8%B7%D9%88%D8%A9-10-13", "path": "ردود-هضبة--تنسيق-نص-الرد-خطوة-بخطوة-10-13"}, {"id": "media", "title": "الصور والملفات والفيديو والصوت", "category": "replies", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D8%B5%D9%88%D8%B1-%D9%88%D8%A7%D9%84%D9%85%D9%84%D9%81%D8%A7%D8%AA-%D9%88%D8%A7%D9%84%D9%81%D9%8A%D8%AF%D9%8A%D9%88-%D9%88%D8%A7%D9%84%D8%B5%D9%88%D8%AA-10-13", "path": "ردود-هضبة--الصور-والملفات-والفيديو-والصوت-10-13"}, {"id": "links", "title": "إنشاء أزرار الروابط داخل الجواب", "category": "replies", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A5%D9%86%D8%B4%D8%A7%D8%A1-%D8%A3%D8%B2%D8%B1%D8%A7%D8%B1-%D8%A7%D9%84%D8%B1%D9%88%D8%A7%D8%A8%D8%B7-%D8%AF%D8%A7%D8%AE%D9%84-%D8%A7%D9%84%D8%AC%D9%88%D8%A7%D8%A8-10-13", "path": "ردود-هضبة--إنشاء-أزرار-الروابط-داخل-الجواب-10-13"}, {"id": "inline-rows", "title": "توزيع أزرار الروابط في صفوف", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AA%D9%88%D8%B2%D9%8A%D8%B9-%D8%A3%D8%B2%D8%B1%D8%A7%D8%B1-%D8%A7%D9%84%D8%B1%D9%88%D8%A7%D8%A8%D8%B7-%D9%81%D9%8A-%D8%B5%D9%81%D9%88%D9%81-10-13", "path": "ردود-هضبة--توزيع-أزرار-الروابط-في-صفوف-10-13"}, {"id": "colors", "title": "كل ألوان الأزرار وطريقة توزيعها", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D9%83%D9%84-%D8%A3%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%A3%D8%B2%D8%B1%D8%A7%D8%B1-%D9%88%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%AA%D9%88%D8%B2%D9%8A%D8%B9%D9%87%D8%A7-10-13", "path": "ردود-هضبة--كل-ألوان-الأزرار-وطريقة-توزيعها-10-13"}, {"id": "edit", "title": "تعديل رد قديم دون إعادة إنشائه", "category": "replies", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AA%D8%B9%D8%AF%D9%8A%D9%84-%D8%B1%D8%AF-%D9%82%D8%AF%D9%8A%D9%85-%D8%AF%D9%88%D9%86-%D8%A5%D8%B9%D8%A7%D8%AF%D8%A9-%D8%A5%D9%86%D8%B4%D8%A7%D8%A6%D9%87-10-13", "path": "ردود-هضبة--تعديل-رد-قديم-دون-إعادة-إنشائه-10-13"}, {"id": "lifecycle", "title": "تسمية الزر وإخفاؤه وإظهاره وحذفه", "category": "replies", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AA%D8%B3%D9%85%D9%8A%D8%A9-%D8%A7%D9%84%D8%B2%D8%B1-%D9%88%D8%A5%D8%AE%D9%81%D8%A7%D8%A4%D9%87-%D9%88%D8%A5%D8%B8%D9%87%D8%A7%D8%B1%D9%87-%D9%88%D8%AD%D8%B0%D9%81%D9%87-10-13", "path": "ردود-هضبة--تسمية-الزر-وإخفاؤه-وإظهاره-وحذفه-10-13"}, {"id": "templates", "title": "معرض قوالب الكيبورد: كل 11 قالبًا", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D9%85%D8%B9%D8%B1%D8%B6-%D9%82%D9%88%D8%A7%D9%84%D8%A8-%D8%A7%D9%84%D9%83%D9%8A%D8%A8%D9%88%D8%B1%D8%AF-%D9%83%D9%84-11-%D9%82%D8%A7%D9%84%D8%A8%D8%A7-10-13", "path": "ردود-هضبة--معرض-قوالب-الكيبورد-كل-11-قالبا-10-13"}, {"id": "custom", "title": "ابتكار صفوف مخصصة للكيبورد", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D8%A8%D8%AA%D9%83%D8%A7%D8%B1-%D8%B5%D9%81%D9%88%D9%81-%D9%85%D8%AE%D8%B5%D8%B5%D8%A9-%D9%84%D9%84%D9%83%D9%8A%D8%A8%D9%88%D8%B1%D8%AF-10-13", "path": "ردود-هضبة--ابتكار-صفوف-مخصصة-للكيبورد-10-13"}, {"id": "decoration", "title": "الترقيم والزخرفة دون تغيير الأسماء", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D8%AA%D8%B1%D9%82%D9%8A%D9%85-%D9%88%D8%A7%D9%84%D8%B2%D8%AE%D8%B1%D9%81%D8%A9-%D8%AF%D9%88%D9%86-%D8%AA%D8%BA%D9%8A%D9%8A%D8%B1-%D8%A7%D9%84%D8%A3%D8%B3%D9%85%D8%A7%D8%A1-10-13", "path": "ردود-هضبة--الترقيم-والزخرفة-دون-تغيير-الأسماء-10-13"}, {"id": "options", "title": "خيارات ظهور اللوحة والصفحات والعنوان", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AE%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA-%D8%B8%D9%87%D9%88%D8%B1-%D8%A7%D9%84%D9%84%D9%88%D8%AD%D8%A9-%D9%88%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A7%D8%AA-%D9%88%D8%A7%D9%84%D8%B9%D9%86%D9%88%D8%A7%D9%86-10-13", "path": "ردود-هضبة--خيارات-ظهور-اللوحة-والصفحات-والعنوان-10-13"}, {"id": "alphabetical", "title": "الترتيب الأبجدي: العربية ثم الإنجليزية", "category": "order", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D8%AA%D8%B1%D8%AA%D9%8A%D8%A8-%D8%A7%D9%84%D8%A3%D8%A8%D8%AC%D8%AF%D9%8A-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-%D8%AB%D9%85-%D8%A7%D9%84%D8%A5%D9%86%D8%AC%D9%84%D9%8A%D8%B2%D9%8A%D8%A9-10-13", "path": "ردود-هضبة--الترتيب-الأبجدي-العربية-ثم-الإنجليزية-10-13"}, {"id": "manual", "title": "الترتيب اليدوي بالضغط أو بالنص", "category": "order", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D8%AA%D8%B1%D8%AA%D9%8A%D8%A8-%D8%A7%D9%84%D9%8A%D8%AF%D9%88%D9%8A-%D8%A8%D8%A7%D9%84%D8%B6%D8%BA%D8%B7-%D8%A3%D9%88-%D8%A8%D8%A7%D9%84%D9%86%D8%B5-10-13", "path": "ردود-هضبة--الترتيب-اليدوي-بالضغط-أو-بالنص-10-13"}, {"id": "individual", "title": "تصميم زر واحد: لونه وحجمه ومكانه", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AA%D8%B5%D9%85%D9%8A%D9%85-%D8%B2%D8%B1-%D9%88%D8%A7%D8%AD%D8%AF-%D9%84%D9%88%D9%86%D9%87-%D9%88%D8%AD%D8%AC%D9%85%D9%87-%D9%88%D9%85%D9%83%D8%A7%D9%86%D9%87-10-13", "path": "ردود-هضبة--تصميم-زر-واحد-لونه-وحجمه-ومكانه-10-13"}, {"id": "link-format", "title": "تنسيق روابط رد محفوظ دون تغيير محتواه", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AA%D9%86%D8%B3%D9%8A%D9%82-%D8%B1%D9%88%D8%A7%D8%A8%D8%B7-%D8%B1%D8%AF-%D9%85%D8%AD%D9%81%D9%88%D8%B8-%D8%AF%D9%88%D9%86-%D8%AA%D8%BA%D9%8A%D9%8A%D8%B1-%D9%85%D8%AD%D8%AA%D9%88%D8%A7%D9%87-10-13", "path": "ردود-هضبة--تنسيق-روابط-رد-محفوظ-دون-تغيير-محتواه-10-13"}, {"id": "helpers", "title": "إضافة المساعدين وتحديد مجموعات كل مساعد", "category": "team", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A5%D8%B6%D8%A7%D9%81%D8%A9-%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D9%8A%D9%86-%D9%88%D8%AA%D8%AD%D8%AF%D9%8A%D8%AF-%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A7%D8%AA-%D9%83%D9%84-%D9%85%D8%B3%D8%A7%D8%B9%D8%AF-10-13", "path": "ردود-هضبة--إضافة-المساعدين-وتحديد-مجموعات-كل-مساعد-10-13"}, {"id": "alerts", "title": "إشعارات إضافات المساعدين باسمهم الظاهر", "category": "team", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A5%D8%B4%D8%B9%D8%A7%D8%B1%D8%A7%D8%AA-%D8%A5%D8%B6%D8%A7%D9%81%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D9%8A%D9%86-%D8%A8%D8%A7%D8%B3%D9%85%D9%87%D9%85-%D8%A7%D9%84%D8%B8%D8%A7%D9%87%D8%B1-10-13", "path": "ردود-هضبة--إشعارات-إضافات-المساعدين-باسمهم-الظاهر-10-13"}, {"id": "refresh", "title": "الحفظ والمعاينة وتحديث أزرار المجموعة", "category": "order", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D8%AD%D9%81%D8%B8-%D9%88%D8%A7%D9%84%D9%85%D8%B9%D8%A7%D9%8A%D9%86%D8%A9-%D9%88%D8%AA%D8%AD%D8%AF%D9%8A%D8%AB-%D8%A3%D8%B2%D8%B1%D8%A7%D8%B1-%D8%A7%D9%84%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9-10-13", "path": "ردود-هضبة--الحفظ-والمعاينة-وتحديث-أزرار-المجموعة-10-13"}, {"id": "copy", "title": "نسخ ردود بين مجموعتين بصورة مستقلة", "category": "team", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D9%86%D8%B3%D8%AE-%D8%B1%D8%AF%D9%88%D8%AF-%D8%A8%D9%8A%D9%86-%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%AA%D9%8A%D9%86-%D8%A8%D8%B5%D9%88%D8%B1%D8%A9-%D9%85%D8%B3%D8%AA%D9%82%D9%84%D8%A9-10-13", "path": "ردود-هضبة--نسخ-ردود-بين-مجموعتين-بصورة-مستقلة-10-13"}, {"id": "backup", "title": "النسخ الاحتياطية واستعادة قائمة واحدة", "category": "tools", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D9%86%D8%B3%D8%AE-%D8%A7%D9%84%D8%A7%D8%AD%D8%AA%D9%8A%D8%A7%D8%B7%D9%8A%D8%A9-%D9%88%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%A9-%D9%82%D8%A7%D8%A6%D9%85%D8%A9-%D9%88%D8%A7%D8%AD%D8%AF%D8%A9-10-13", "path": "ردود-هضبة--النسخ-الاحتياطية-واستعادة-قائمة-واحدة-10-13"}, {"id": "stats", "title": "إحصاءات طلبات الردود لكل مجموعة", "category": "tools", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A5%D8%AD%D8%B5%D8%A7%D8%A1%D8%A7%D8%AA-%D8%B7%D9%84%D8%A8%D8%A7%D8%AA-%D8%A7%D9%84%D8%B1%D8%AF%D9%88%D8%AF-%D9%84%D9%83%D9%84-%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9-10-13", "path": "ردود-هضبة--إحصاءات-طلبات-الردود-لكل-مجموعة-10-13"}, {"id": "problems", "title": "حل المشكلات وحدود البوت وكل الأوامر", "category": "tools", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%AD%D9%84-%D8%A7%D9%84%D9%85%D8%B4%D9%83%D9%84%D8%A7%D8%AA-%D9%88%D8%AD%D8%AF%D9%88%D8%AF-%D8%A7%D9%84%D8%A8%D9%88%D8%AA-%D9%88%D9%83%D9%84-%D8%A7%D9%84%D8%A3%D9%88%D8%A7%D9%85%D8%B1-10-13", "path": "ردود-هضبة--حل-المشكلات-وحدود-البوت-وكل-الأوامر-10-13"}, {"id": "premium", "title": "إيموجيات بريميوم داخل الأزرار", "category": "design", "url": "https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A5%D9%8A%D9%85%D9%88%D8%AC%D9%8A%D8%A7%D8%AA-%D8%A8%D8%B1%D9%8A%D9%85%D9%8A%D9%88%D9%85-%D8%AF%D8%A7%D8%AE%D9%84-%D8%A7%D9%84%D8%A3%D8%B2%D8%B1%D8%A7%D8%B1-10-14", "path": "ردود-هضبة--إيموجيات-بريميوم-داخل-الأزرار-10-14"}];
const GUIDE_ILLUSTRATION_COUNT=63;
const GUIDE_HUB="https://telegra.ph/%D8%B1%D8%AF%D9%88%D8%AF-%D9%87%D8%B6%D8%A8%D8%A9--%D8%A7%D9%84%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D9%83%D8%A7%D9%85%D9%84-%D9%84%D9%84%D9%85%D8%B2%D8%A7%D9%8A%D8%A7-%D9%88%D8%A7%D9%84%D8%B4%D8%B1%D9%88%D8%AD%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%B5%D9%88%D8%B1%D8%A9-10-13";

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-groups.mjs
const PRIVATE_SCOPE = "private";
const PRIVATE_TITLE = "الخاص / الردود المحفوظة";
const validScope = value => value === PRIVATE_SCOPE || (typeof value === "string" && /^-\d{1,16}$/.test(value) && Number.isSafeInteger(Number(value)));
const selectionToken = () => crypto.randomUUID().replaceAll("-", "").slice(0, 12);

// The first transaction after upgrading saves a snapshot of the original state.
// Legacy shared replies become independent copies in each already linked group.
// Their originals stay in the private collection, including historical counters.
function upgradeGroups(state) {
  const s = structuredClone(state);
  if (s.schemaVersion >= 3) return {state:s, migrated:false};
  if (s.schemaVersion >= 2) return upgradeHelperScopes(s);
  const columns = [1,2,3].includes(s.columns) ? s.columns : 2;
  s.collections = {[PRIVATE_SCOPE]:{title:PRIVATE_TITLE, columns, revision:1}};
  s.selections = {};
  s.nextId = Math.max(s.nextId || 1, ...s.buttons.map(b => b.id + 1));
  const originals = s.buttons.map(b => ({...b, scope:PRIVATE_SCOPE}));
  s.buttons = [...originals];
  for (const [scope,title] of Object.entries(s.groups)) {
    s.collections[scope] = {title, columns, revision:1};
    for (const b of originals) s.buttons.push({...structuredClone(b), id:s.nextId++, scope});
  }
  const groups = Object.keys(s.groups);
  if (s.owner && groups.length === 1) s.selections[s.owner] = {scope:groups[0], token:selectionToken()};
  // Old drafts and callbacks did not carry a group. Never infer their target.
  s.sessions = {};
  s.pages = {};
  s.schemaVersion = 2;
  return upgradeHelperScopes(s);
}

// No implicit access for helpers who previously had global permissions.
// The owner explicitly chooses their collections after this migration.
function upgradeHelperScopes(s) {
  s.adminScopes = {};
  s.adminVersions = {};
  s.nextAdminVersion = 1;
  for (const uid of Object.keys(s.admins)) {
    s.adminScopes[uid] = [];
    s.adminVersions[uid] = s.nextAdminVersion++;
    delete s.selections[uid];
    delete s.sessions[uid];
    delete s.pages[`${uid}:${uid}`];
  }
  s.schemaVersion = 3;
  return {state:s, migrated:true};
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-menu.mjs

const DECORATIONS={plain:"بدون إضافات",numbers:"ترقيم 1، 2، 3",arabic:"ترقيم ١، ٢، ٣",bullets:"نقاط •",brackets:"إطارات 〔 〕",arrows:"أسهم ↗"};
const THEMES={default:"اللون العادي",primary:"أزرق",success:"أخضر",danger:"أحمر",cycle:"ألوان متناوبة",bands:"لون لكل صف"};
const PRESETS={
  one:{name:"قائمة عمودية",pattern:[1]},two:{name:"زران في الصف",pattern:[2]},three:{name:"3 أزرار في الصف",pattern:[3]},four:{name:"شبكة 4",pattern:[4]},six:{name:"شبكة مصغرة 6",pattern:[6]},
  hero:{name:"زر رئيسي ثم أزواج",pattern:[1,2,2]},steps:{name:"متدرج 1–2–3",pattern:[1,2,3]},cards:{name:"بطاقات 2–1",pattern:[2,1]},wave:{name:"متناوب 1–3",pattern:[1,3]},
  index:{name:"فهرس مرقّم",pattern:[3],decoration:"arabic",theme:"primary"},rainbow:{name:"فهرس ملون",pattern:[2,3],theme:"cycle"},
};
const hadaba_menu_COLORS=["primary","success","danger"];
const norm=s=>String(s).normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
function validateMenuStyle(value) {
  if(value===undefined)return undefined;
  if(!["default",...hadaba_menu_COLORS].includes(value))throw Error("لون الزر غير صالح.");return value;
}
function validateButtonPlacement(value) {
  if(value===undefined)return undefined;
  if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).some(k=>!["rowSize","breakBefore","breakAfter"].includes(k)))throw Error("تنسيق موضع الزر غير صالح.");
  if(value.rowSize!==undefined&&(!Number.isInteger(value.rowSize)||value.rowSize<1||value.rowSize>6))throw Error("حجم صف الزر من 1 إلى 6 أزرار.");
  for(const k of ["breakBefore","breakAfter"])if(value[k]!==undefined&&typeof value[k]!=="boolean")throw Error("خيارات حدود الصف غير صالحة.");
  const clean={...(value.rowSize!==undefined?{rowSize:value.rowSize}:{}),...(value.breakBefore?{breakBefore:true}:{}),...(value.breakAfter?{breakAfter:true}:{})};
  return Object.keys(clean).length?clean:undefined;
}
function buttonMenuFields(button) {
  const style=validateMenuStyle(button.menuStyle),placement=validateButtonPlacement(button.menuPlacement),icon=validateMenuIcon(button.menuIcon);
  return {...(style!==undefined?{menuStyle:style}:{}),...(placement?{menuPlacement:placement}:{}),...(icon?{menuIcon:icon}:{})};
}
function moveMenuButton(buttons,id,position) {
  const index=buttons.findIndex(b=>b.id===id);
  if(index<0||!Number.isInteger(position)||position<0||position>=buttons.length)throw Error("موضع الزر غير صالح.");
  const result=[...buttons],button=result.splice(index,1)[0];result.splice(position,0,button);return result;
}
function validatePattern(pattern,max=6) {
  if(!Array.isArray(pattern)||!pattern.length||pattern.length>12||pattern.some(n=>!Number.isInteger(n)||n<1||n>max))throw Error(`حدد من صف واحد إلى 12 صفًا؛ كل صف من زر إلى ${max} أزرار.`);
  return [...pattern];
}
function parsePattern(text,max=6) {
  const digits=String(text).trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
  if(!/^\d+(?:[\s,،-]+\d+)*$/.test(digits))throw Error("أرسل أعداد الصفوف مثل 1-3-2 أو ١-٣-٢.");
  return validatePattern(digits.split(/[\s,،-]+/).map(Number),max);
}
function validateMenuLayout(value,columns=2) {
  if(value!==undefined&&(!value||typeof value!=="object"||Array.isArray(value)))throw Error("صيغة تنسيق الأزرار غير صالحة.");
  const v=value??{},allowed=["pattern","pageSize","decoration","theme","persistent","oneTime","resize","heading","placeholder"];
  if(Object.keys(v).some(k=>!allowed.includes(k)))throw Error("تنسيق الأزرار يحتوي على حقول غير مسموحة.");
  const result={pattern:validatePattern(v.pattern??[columns]),pageSize:v.pageSize??12,decoration:v.decoration??"plain",theme:v.theme??"default",persistent:v.persistent??true,oneTime:v.oneTime??false,resize:v.resize??true,heading:v.heading??"",placeholder:v.placeholder??"اختر من أزرار هضبة"};
  if(![6,12,18,24,36].includes(result.pageSize)||!Object.hasOwn(DECORATIONS,result.decoration)||!Object.hasOwn(THEMES,result.theme))throw Error("خيار تنسيق غير صالح.");
  if([result.persistent,result.oneTime,result.resize].some(x=>typeof x!=="boolean")||result.persistent&&result.oneTime)throw Error("خيارات ظهور اللوحة غير صالحة.");
  if(typeof result.heading!=="string"||result.heading.length>500||typeof result.placeholder!=="string"||!result.placeholder.trim()||result.placeholder.length>64)throw Error("عنوان القائمة حتى 500 حرف، ونص خانة الإدخال من حرف إلى 64 حرفًا.");
  return result;
}
const currentMenu=collection=>validateMenuLayout(collection?.menuLayout,collection?.columns??2);
function iconLabel(button) {
  const icon=validateMenuIcon(button.menuIcon),label=button.label;
  if(!icon||!/[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(icon.alt)||!label.startsWith(icon.alt))return label;
  let rest=label.slice(icon.alt.length).replace(/^[\uFE0E\uFE0F]/u,"");
  const next=rest.codePointAt(0);if(next===0x200d||next>=0x1f3fb&&next<=0x1f3ff)return label;
  return rest.trim()||label;
}
function decorate(label,i,kind) {
  if(kind==="numbers")return `${i+1}. ${label}`;
  if(kind==="arabic")return `${String(i+1).replace(/\d/g,n=>"٠١٢٣٤٥٦٧٨٩"[Number(n)])}. ${label}`;
  if(kind==="bullets")return "• "+label;if(kind==="brackets")return `〔${label}〕`;if(kind==="arrows")return "↗ "+label;return label;
}
function menuItems(buttons,config) {
  const bases=new Map(buttons.map(b=>[norm(b.label),b.id])),used=new Set();
  return buttons.map((b,index)=>{
    let text=decorate(iconLabel(b),index,config.decoration);
    while(used.has(norm(text))||(bases.has(norm(text))&&bases.get(norm(text))!==b.id))text+=` ⟨${b.id}⟩`;
    used.add(norm(text));return {button:b,index,text};
  });
}
function menuGrid(buttons,config,page=0) {
  const items=menuItems(buttons,config),pages=Math.ceil(items.length/config.pageSize);page=Math.max(0,Math.min(page,Math.max(0,pages-1)));
  const selected=items.slice(page*config.pageSize,(page+1)*config.pageSize).map(item=>({...item,placement:validateButtonPlacement(item.button.menuPlacement)})),rows=[],positions=[];let i=0,row=0;
  while(i<selected.length){
    const size=selected[i].placement?.rowSize??config.pattern[row%config.pattern.length],cells=[];
    while(i<selected.length&&cells.length<size){
      const item=selected[i],placement=item.placement;
      // A fixed size starts a new row when it conflicts with its neighbors.
      // Equal sizes can share a row. Boundaries never insert empty rows.
      if(cells.length&&(placement?.breakBefore||placement?.rowSize!==undefined&&placement.rowSize!==size))break;
      cells.push(item);i++;if(placement?.breakAfter)break;
    }
    rows.push(cells.map((item,column)=>{
      const color=item.button.menuStyle??(config.theme==="cycle"?hadaba_menu_COLORS[item.index%3]:config.theme==="bands"?hadaba_menu_COLORS[row%3]:config.theme);
      positions.push({id:item.button.id,index:item.index,row:row+1,column:column+1,columns:cells.length,rowSize:size});
      const icon=validateMenuIcon(item.button.menuIcon);
      return {text:item.text,...(hadaba_menu_COLORS.includes(color)?{style:color}:{}),...(icon?{icon_custom_emoji_id:icon.id}:{})};
    }));row++;
  }
  return {rows,page,pages,positions};
}
function menuMatch(text,buttons,config) {
  const key=norm(text),rendered=menuItems(buttons,config).find(item=>norm(item.text)===key);
  if(rendered)return rendered.button;
  const exact=buttons.find(b=>b.key===key);if(exact)return exact;
  // Keep previously displayed numbered buttons useful after a reorder.
  let plain=String(text).trim().replace(/\s+⟨\d+⟩/g,"").replace(/^[0-9٠-٩۰-۹]+[.)]\s+/,"").replace(/^[•↗]\s+/,"");
  if(plain.startsWith("〔")&&plain.endsWith("〕"))plain=plain.slice(1,-1);
  return buttons.find(b=>b.key===norm(plain));
}
const ar=new Intl.Collator("ar",{numeric:true,sensitivity:"base",ignorePunctuation:true}),en=new Intl.Collator("en",{numeric:true,sensitivity:"base",ignorePunctuation:true});
function alphabetKey(label) {
  const key=String(label).normalize("NFKD").replace(/\p{M}/gu,"").replace(/[أإآٱ]/g,"ا").replace(/^[^\p{L}\p{N}]+/u,"").trim(),letter=key.match(/\p{L}/u)?.[0];
  return {key,kind:letter&&/\p{Script=Arabic}/u.test(letter)?0:letter&&/\p{Script=Latin}/u.test(letter)?1:2};
}
function alphabetize(buttons) {
  return [...buttons].sort((a,b)=>{const x=alphabetKey(a.label),y=alphabetKey(b.label);return x.kind-y.kind||(x.kind===0?ar:en).compare(x.key,y.key)||a.position-b.position||a.id-b.id;});
}
function shapeLinks(buttons,pattern) {
  pattern=validatePattern(pattern,8);const flat=structuredClone(buttons.flat()),rows=[];let i=0,row=0;
  while(i<flat.length){const size=pattern[row++%pattern.length];rows.push(flat.slice(i,i+size));i+=size;}return rows;
}
function colorLinks(buttons,theme) {
  if(!Object.hasOwn(THEMES,theme))throw Error("لون الروابط غير صالح.");let index=0;
  return buttons.map((row,r)=>row.map(b=>{const next={...b},color=theme==="cycle"?hadaba_menu_COLORS[index%3]:theme==="bands"?hadaba_menu_COLORS[r%3]:theme;index++;delete next.style;if(hadaba_menu_COLORS.includes(color))next.style=color;return next;}));
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-menu-editor.mjs




const MENU_ACTIONS=new Set(["layout","columns","lcat","lp","lt","ld","ls","lo","lcustom","ltext","lreset","lprev","lpreview","lsave","order","sortreview","manual","orderpaste","orderpick","manualundo","manualrest","orderapply","orderundo","lfmt","lshape","lcolor","lrows","lshow","linksave","bst","bschoose","bssave","bscat","bssize","bsbreak","bsmove","bsnumber","bsanchors","bsanchor","bsreset","bsicon","bsnoicon"]);
const BACK=[["↩️ لوحة الإدارة","home"]];
const hadaba_menu_editor_norm=s=>String(s).normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
const n=value=>{const num=Number(value);if(!Number.isSafeInteger(num))throw Error("اختيار غير صالح.");return num;};
const pairs=items=>{const rows=[];for(let i=0;i<items.length;i+=2)rows.push(items.slice(i,i+2));return rows;};
class MenuEditor {
  constructor(engine){this.e=engine;}
  draft(uid,steps,nonce) {
    const e=this.e,s=e.s.sessions[uid],scope=e.requireScope(uid);
    if(!s||!steps.includes(s.step)||s.expires<e.now||s.data.scope!==scope||s.data.token!==e.context(uid).token||(arguments.length>=3&&s.data.nonce!==nonce))throw Error("هذه المعاينة قديمة أو ملغاة. افتح التنسيق أو الترتيب مجددًا.");return structuredClone(s.data);
  }
  scopeRevision(uid,data) {if(this.e.s.collections[this.e.requireScope(uid)].revision!==data.revision)throw Error("تغيرت القائمة منذ المعاينة. ابدأ مجددًا لمراجعة التغييرات قبل الحفظ.");}
  saveDraft(uid,step,data) {this.e.session(uid,step,{...data,nonce:selectionToken()});return this.e.s.sessions[uid].data;}
  canPublish(uid,publish) {const scope=this.e.requireScope(uid);if(publish&&(scope===PRIVATE_SCOPE||!this.e.s.groups[scope]))throw Error("هذه القائمة ليست مجموعة مرتبطة. احفظ دون نشر، أو أعد ربط المجموعة.");}
  saveRows(uid,action,nonce) {
    const rows=[[["💾 حفظ فقط",`${action}:${nonce}`]]],scope=this.e.requireScope(uid);
    if(scope!==PRIVATE_SCOPE&&this.e.s.groups[scope])rows.push([["🔄 حفظ وتحديث المجموعة",`${action}:${nonce}:pub`]]);
    rows.push(BACK);return rows;
  }
  preview(uid,layout,buttons,focusId) {
    const e=this.e,scope=e.requireScope(uid),all=buttons??e.sorted(true,scope),index=all.findIndex(b=>b.id===focusId),grid=menuGrid(all,layout,index<0?0:Math.floor(index/layout.pageSize)),position=grid.positions.find(p=>p.id===focusId),button=all[index];
    const focus=position?`🔎 ${button.label}\nالصف ${position.row} • الموضع ${position.column} من ${position.columns} في الصف\n`:"";
    e.q("sendMessage",{chat_id:uid,text:`👁 معاينة مؤقتة فقط • ${e.title(scope)}\n${focus}${layout.heading||"اختر زرًا من الفهرس 👇"}\n${grid.pages>1?`الصفحة ${grid.page+1} من ${grid.pages}.\n`:""}لم تُحفظ التغييرات ولم تُنشر في المجموعة.`,reply_markup:grid.rows.length?{keyboard:grid.rows,resize_keyboard:layout.resize,is_persistent:layout.persistent,one_time_keyboard:layout.oneTime,input_field_placeholder:layout.placeholder}:{remove_keyboard:true}});
  }
  beginLayout(uid,edit,columns) {
    const e=this.e,scope=e.requireScope(uid),layout=currentMenu(e.s.collections[scope]);if(columns!==undefined)layout.pattern=[n(columns)];
    this.saveDraft(uid,"layout_edit",{layout:validateMenuLayout(layout),revision:e.s.collections[scope].revision});this.layoutPanel(uid,"main",edit);
  }
  layoutPanel(uid,category="main",edit) {
    const e=this.e,d=this.draft(uid,["layout_edit"]),t=d.nonce;let rows;
    if(category==="presets")rows=pairs(Object.entries(PRESETS).map(([key,p])=>[p.name,`lp:${key}:${t}`]));
    else if(category==="colors")rows=pairs(Object.entries(THEMES).map(([key,name])=>[name,`lt:${key}:${t}`]));
    else if(category==="decor")rows=pairs(Object.entries(DECORATIONS).map(([key,name])=>[name,`ld:${key}:${t}`]));
    else if(category==="options")rows=[[["6 أزرار بالصفحة",`ls:6:${t}`],["12 زرًا",`ls:12:${t}`]],[["18 زرًا",`ls:18:${t}`],["24 زرًا",`ls:24:${t}`],["36 زرًا",`ls:36:${t}`]],[[`${d.layout.persistent?"✅":"⬜"} لوحة دائمة`,`lo:persistent:${t}`]],[[`${d.layout.oneTime?"✅":"⬜"} إخفاء بعد الضغط`,`lo:oneTime:${t}`]],[[`${d.layout.resize?"✅":"⬜"} ارتفاع تلقائي`,`lo:resize:${t}`]],[["✏️ عنوان الفهرس",`ltext:heading:${t}`],["✏️ نص خانة الإدخال",`ltext:placeholder:${t}`]]];
    else if(category==="main") {
      rows=[[["🧩 قوالب الصفوف",`lcat:presets:${t}`],["✏️ صفوف مخصصة",`lcustom:${t}`]],[["🎨 الألوان",`lcat:colors:${t}`],["🔢 الترقيم والزخرفة",`lcat:decor:${t}`]],[["⚙️ خيارات الفهرس",`lcat:options:${t}`],["👁 معاينة",`lpreview:${t}`]],[["↩️ إعدادات بسيطة",`lreset:${t}`]]];
      if(e.s.collections[e.requireScope(uid)].previousMenuLayout)rows.push([["↶ التنسيق السابق",`lprev:${t}`]]);
    } else throw Error("قسم تنسيق غير صالح.");
    if(category!=="main")rows.push([["↩️ مسودة التنسيق",`lcat:main:${t}`]]);
    const summary=`📍 ${e.title(e.requireScope(uid))}\n🎨 مسودة تنسيق الأزرار\nالصفوف المتكررة: ${d.layout.pattern.join(" – ")}\nالأزرار بالصفحة: ${d.layout.pageSize}\n${THEMES[d.layout.theme]} • ${DECORATIONS[d.layout.decoration]}\n${d.layout.heading?"عنوان: "+d.layout.heading.slice(0,150)+"\n":""}\nكل الخيارات اختيارية. جرّب المعاينة ثم احفظ؛ إغلاق المسودة لا يغيّر القائمة الحالية.`;
    e.panel(uid,summary,[...rows,...this.saveRows(uid,"lsave",t)],edit);
  }
  orderPanel(uid,edit) {
    const e=this.e,scope=e.requireScope(uid),rows=[[["🔤 أبجدي: العربية ثم الإنجليزية","sortreview"]],[["🖐 اختر الأول ثم الثاني","manual:0"],["📝 إرسال ترتيب كنص","orderpaste"]]];
    if(e.s.collections[scope].previousOrder?.length)rows.push([["↶ الرجوع للترتيب السابق","orderundo"]]);
    e.panel(uid,`📍 ${e.title(scope)}\n🔢 ترتيب الأزرار\nاختر الطريقة. لا يتغير الترتيب حتى تراجع القائمة وتؤكد الحفظ. يمكنك اختيار بعض الأزرار أولًا، وتبقى بقية الأزرار بترتيبها الحالي.\nالفرز الأبجدي يراعي العربية قبل الإنجليزية، ويتجاهل التشكيل والزخارف في المقارنة، ويرتب الأرقام طبيعيًا.`,[...rows,BACK],edit);
  }
  reviewOrder(uid,ids,revision,kind,edit) {
    const e=this.e,scope=e.requireScope(uid),current=e.sorted(false,scope),selected=new Set(ids);
    if(selected.size!==ids.length||ids.some(id=>!current.some(b=>b.id===id)))throw Error("توجد أزرار غير صالحة أو مكررة في الترتيب.");
    ids=[...ids,...current.filter(b=>!selected.has(b.id)).map(b=>b.id)];
    this.saveDraft(uid,"order_review",{ids,revision,kind});this.orderReviewPanel(uid,edit);
  }
  orderReviewPanel(uid,edit) {
    const e=this.e,d=this.draft(uid,["order_review"]),scope=e.requireScope(uid),text=d.ids.slice(0,18).map((id,i)=>`${i+1}. ${e.button(id,scope)?.label.slice(0,55)??"زر تغيّر"}`).join("\n");
    e.panel(uid,`📍 ${e.title(scope)}\n👁 معاينة الترتيب المقترح (${d.ids.length} زر)\n${text}${d.ids.length>18?`\n… و${d.ids.length-18} زرًا أخرى.`:""}\n\nالترتيب الحالي محفوظ حتى تضغط حفظ. الفرز يطبّق مرة واحدة عند التأكيد؛ الردود الجديدة تُضاف للنهاية.`,[[["👁 معاينة الفهرس",`lpreview:${d.nonce}`]],...this.saveRows(uid,"orderapply",d.nonce)],edit);
  }
  manualPanel(uid,page=0,edit) {
    const e=this.e,d=this.draft(uid,["order_manual"]),scope=e.requireScope(uid);this.scopeRevision(uid,d);
    const chosen=new Set(d.ids),remaining=e.sorted(false,scope).filter(b=>!chosen.has(b.id)),pages=Math.max(1,Math.ceil(remaining.length/8));page=Math.max(0,Math.min(page,pages-1));
    const rows=remaining.slice(page*8,(page+1)*8).map(b=>[[b.label.slice(0,50),`orderpick:${b.id}:${d.nonce}:${page}`]]),nav=[];
    if(page)nav.push(["السابق",`manual:${page-1}:${d.nonce}`]);if(page+1<pages)nav.push(["التالي",`manual:${page+1}:${d.nonce}`]);if(nav.length)rows.push(nav);
    if(d.ids.length)rows.push([["↶ إلغاء آخر اختيار",`manualundo:${d.nonce}`]]);
    rows.push([["👁 أكمل البقية وراجع",`manualrest:${d.nonce}`]],BACK);
    const picked=d.ids.slice(0,12).map((id,i)=>`${i+1}. ${e.button(id,scope).label.slice(0,45)}`).join("\n");
    e.panel(uid,`📍 ${e.title(scope)}\n🖐 اختر الزر رقم ${d.ids.length+1}\n${picked}${d.ids.length>12?`\nو${d.ids.length-12} اختيارات أخرى.`:""}\n\nاختياراتك مسودة فقط. «أكمل البقية وراجع» يضيف الأزرار المتبقية بترتيبها الحالي، ثم يطلب تأكيد الحفظ.`,rows,edit);
  }
  beginLinks(uid,id,revision,edit) {
    const e=this.e,b=e.button(n(id),e.requireScope(uid));if(!b||b.revision!==n(revision))throw Error("تغير الرد. افتح تفاصيله مجددًا.");
    if(!b.inlineKeyboard?.length)throw Error("أضف أزرار روابط أولًا من «أزرار الروابط»، ثم نسّقها هنا.");
    this.saveDraft(uid,"link_format",{id:b.id,revision:b.revision,keyboard:structuredClone(b.inlineKeyboard)});this.linkPanel(uid,edit);
  }
  linkPanel(uid,edit) {
    const e=this.e,d=this.draft(uid,["link_format"]),b=e.button(d.id,e.requireScope(uid));
    e.panel(uid,`🔗 مسودة تنسيق روابط: ${b?.label??"رد تغيّر"}\n${d.keyboard.flat().length} زر • الصفوف: ${d.keyboard.map(r=>r.length).join(" – ")}\nتغيير الشكل أو اللون يحفظ العناوين والروابط وترتيبها. النص والصورة لا يتغيران. لا يُطبّق شيء قبل الحفظ.`,[...pairs([...[1,2,3,4,6,8].map(count=>[`${count} في الصف`,`lshape:${count}:${d.nonce}`]),["زر رئيسي ثم أزواج",`lshape:hero:${d.nonce}`],["متدرج 1–2–3",`lshape:steps:${d.nonce}`],["✏️ صفوف مخصصة",`lrows:${d.nonce}`]]),...pairs(Object.entries(THEMES).map(([key,name])=>[name,`lcolor:${key}:${d.nonce}`])),[["👁 معاينة الرد",`lshow:${d.nonce}`]],...this.saveRows(uid,"linksave",d.nonce)],edit);
  }
  buttonDraft(uid,nonce,steps=["layout_button"]) {
    const d=this.draft(uid,steps,nonce),scope=this.e.requireScope(uid),b=this.e.button(d.id,scope);
    if(!b||b.revision!==d.revision||this.e.s.collections[scope].revision!==d.collectionRevision)throw Error("تغير الزر أو قائمة المجموعة منذ المعاينة. افتح تصميم الزر مجددًا لمراجعة مكانه قبل الحفظ.");
    return d;
  }
  proposedButtonMenu(uid,d) {
    const e=this.e,scope=e.requireScope(uid);
    return d.ids.map(id=>e.button(id,scope)).filter(b=>b&&(b.enabled||b.id===d.id)).map(b=>b.id===d.id?{...b,menuStyle:d.style==="inherit"?undefined:d.style,menuPlacement:validateButtonPlacement(d.placement),menuIcon:validateMenuIcon(d.icon)}:b);
  }
  buttonStylePanel(uid,edit,category="main") {
    const e=this.e,s=e.s.sessions[uid],d=this.buttonDraft(uid,s.data.nonce),scope=e.requireScope(uid),b=e.button(d.id,scope),t=d.nonce,all=this.proposedButtonMenu(uid,d),index=all.findIndex(v=>v.id===d.id),config=currentMenu(e.s.collections[scope]),grid=menuGrid(all,config,Math.floor(index/config.pageSize)),pos=grid.positions.find(v=>v.id===d.id);let rows;
    if(category==="color")rows=pairs([["حسب القالب","inherit"],...Object.entries(THEMES).filter(([k])=>["default","primary","success","danger"].includes(k)).map(([key,label])=>[label,key])].map(([label,key])=>[`${d.style===key?"✅ ":""}${label}`,`bschoose:${key}:${t}`]));
    else if(category==="size")rows=pairs([["حسب القالب","inherit"],["سطر كامل",1],["مع زر ثانٍ (2)",2],["3 أزرار في الصف",3],["4 أزرار في الصف",4],["5 أزرار في الصف",5],["مصغّر (6)",6]].map(([label,size])=>[`${(d.placement.rowSize??"inherit")===size?"✅ ":""}${label}`,`bssize:${size}:${t}`]));
    else if(category==="place")rows=[[["⏫ أول زر",`bsmove:first:${t}`],["⏬ آخر زر",`bsmove:last:${t}`]],[["⬆️ موضع للأعلى",`bsmove:up:${t}`],["⬇️ موضع للأسفل",`bsmove:down:${t}`]],[["قبل زر أختاره",`bsanchors:before:0:${t}`],["بعد زر أختاره",`bsanchors:after:0:${t}`]],[["🔢 كتابة رقم الموضع",`bsnumber:${t}`]]];
    else if(category==="breaks")rows=[[[`${d.placement.breakBefore?"✅":"⬜"} يبدأ سطرًا جديدًا`,`bsbreak:before:${t}`]],[[`${d.placement.breakAfter?"✅":"⬜"} ينتهي السطر بعده`,`bsbreak:after:${t}`]]];
    else if(category==="main")rows=[[["🎨 لون هذا الزر",`bscat:color:${t}`],["↔️ حجم هذا الزر",`bscat:size:${t}`]],[["📍 مكان هذا الزر",`bscat:place:${t}`],["🧱 حدود الصف",`bscat:breaks:${t}`]],[["✨ إيموجي بريميوم",`bsicon:${t}`]],...(d.icon?[[["🗑 إزالة أيقونة بريميوم",`bsnoicon:${t}`]]]:[]),[["↩️ إلغاء تخصيصه",`bsreset:${t}`]]];
    else throw Error("قسم تصميم غير صالح.");
    if(category!=="main")rows.push([["↩️ تصميم هذا الزر",`bscat:main:${t}`]]);
    rows.push([["👁 معاينة الزر ومكانه",`lpreview:${t}`]]);
    const size=d.placement.rowSize===1?"سطر كامل":d.placement.rowSize?`${d.placement.rowSize} أزرار في صفه`:"حسب قالب المجموعة",position=pos?`الصف ${pos.row} • الموضع ${pos.column} من ${pos.columns} • الصفحة ${grid.page+1}`:"";
    const warning=(d.icon?"\n✨ أيقونة بريميوم محفوظة. ظهورها يحتاج صلاحية الإيموجي للبوت في تليجرام.":"")+(pos&&d.placement.rowSize&&pos.columns<d.placement.rowSize?"\n⚠️ هذا الصف يحتوي أزرارًا أقل من الحجم المختار؛ يتسع الزر وفق الموجود. جرّب نقله قبل أزرار أخرى أو تعديل حدود الصف.":"");
    e.panel(uid,`📍 ${e.title(scope)}\n🛠 تصميم هذا الزر: ${b.label}\n🎨 اللون: ${d.style==="inherit"?"حسب قالب المجموعة":THEMES[d.style]}\n↔️ الحجم: ${size}\n🔢 ترتيبه: ${d.ids.indexOf(d.id)+1} من ${d.ids.length}\n${position}${!b.enabled?"\n⏸ الزر مخفي؛ يظهر هنا للمعاينة فقط.":""}${warning}\n\nالحجم يتحدد بعدد الأزرار في الصف؛ العرض والارتفاع النهائيان حسب تليجرام. «الموضع» داخل الصف بحسب ترتيب الأزرار، واتجاه العرض حسب التطبيق.\nكل اختياراتك مسودة حتى تحفظها.`,[...rows,...this.saveRows(uid,"bssave",t),[["↩️ تفاصيل هذا الزر",`button:${d.id}`]]],edit);
  }
  buttonAnchors(uid,d,side,page=0,edit) {
    if(!["before","after"].includes(side))throw Error("موضع غير صالح.");
    const e=this.e,scope=e.requireScope(uid),others=d.ids.filter(id=>id!==d.id),pages=Math.max(1,Math.ceil(others.length/8));page=Math.max(0,Math.min(page,pages-1));
    const rows=others.slice(page*8,(page+1)*8).map(id=>[[e.button(id,scope).label.slice(0,45),`bsanchor:${side}:${id}:${d.nonce}`]]),nav=[];
    if(page)nav.push(["السابق",`bsanchors:${side}:${page-1}:${d.nonce}`]);if(page+1<pages)nav.push(["التالي",`bsanchors:${side}:${page+1}:${d.nonce}`]);if(nav.length)rows.push(nav);
    rows.push([["↩️ تصميم هذا الزر",`bscat:main:${d.nonce}`]]);
    e.panel(uid,`📍 اختر الزر الذي تريد وضع «${e.button(d.id,scope).label}» ${side==="before"?"قبله":"بعده"}.\nيحفظ بقية الأزرار بترتيبها. الاختيار مسودة قبل الحفظ.`,rows,edit);
  }
  saved(uid,scope,publish,text,edit) {
    const e=this.e;e.clear(uid);if(publish)e.publish(uid,scope);e.panel(uid,text+" ✅\n"+(publish?"تم تجهيز القائمة المحدثة لإرسالها للمجموعة.":"الحفظ لا ينشر رسالة للمجموعة. اضغط تحديث الأزرار أو أرسل /refresh لعرض القائمة المحدثة."),[[["👁 تجربة الأزرار","preview"]],...(scope!==PRIVATE_SCOPE&&e.s.groups[scope]?[[["🔄 تحديث الردود والأزرار","refresh"]]]:[]),BACK],edit);
  }
  dispatch(a,p,uid,edit) {
    const e=this.e,scope=e.requireScope(uid);
    if(a==="layout"||a==="columns"){this.beginLayout(uid,edit,a==="columns"?p[1]:undefined);return;}
    if(a==="order"){e.clear(uid);this.orderPanel(uid,edit);return;}
    if(a==="sortreview"){const all=e.sorted(false,scope);this.reviewOrder(uid,alphabetize(all).map(b=>b.id),e.s.collections[scope].revision,"alphabetical",edit);return;}
    if(a==="orderundo"){const previous=e.s.collections[scope].previousOrder;if(!previous?.length)throw Error("لا يوجد ترتيب سابق محفوظ.");const available=new Set(e.sorted(false,scope).map(b=>b.id));this.reviewOrder(uid,previous.filter(id=>available.has(id)),e.s.collections[scope].revision,"undo",edit);return;}
    if(a==="manual") {
      if(p[2]===undefined)this.saveDraft(uid,"order_manual",{ids:[],revision:e.s.collections[scope].revision});else this.draft(uid,["order_manual"],p[2]);
      this.manualPanel(uid,n(p[1]??0),edit);return;
    }
    if(a==="orderpaste") {
      this.saveDraft(uid,"order_input",{revision:e.s.collections[scope].revision});
      e.panel(uid,"أرسل أسماء الأزرار بالترتيب الذي تريده، كل اسم بسطر. تستطيع إرسال أرقام مواضعها الحالية بدل الأسماء. ابدأ بالأزرار المهمة فقط؛ البقية تحتفظ بترتيبها، ثم تظهر المعاينة قبل الحفظ.\n\n"+e.sorted(false,scope).slice(0,35).map((b,i)=>`${i+1}. ${b.label.slice(0,55)}`).join("\n"),[BACK],edit);return;
    }
    if(["orderpick","manualundo","manualrest"].includes(a)) {
      const d=this.draft(uid,["order_manual"],a==="orderpick"?p[2]:p[1]);this.scopeRevision(uid,d);
      if(a==="manualrest"){this.reviewOrder(uid,d.ids,d.revision,"manual",edit);return;}
      if(a==="manualundo")d.ids.pop();else {const id=n(p[1]);if(!e.button(id,scope)||d.ids.includes(id))throw Error("هذا الزر غير متاح للاختيار. حدّث مسودة الترتيب.");d.ids.push(id);}
      this.saveDraft(uid,"order_manual",d);this.manualPanel(uid,a==="orderpick"?n(p[3]):0,edit);return;
    }
    if(a==="orderapply") {
      const d=this.draft(uid,["order_review"],p[1]);this.scopeRevision(uid,d);const publish=p[2]==="pub";this.canPublish(uid,publish);
      const previous=e.sorted(false,scope).map(b=>b.id);if(d.ids.length!==previous.length||new Set(d.ids).size!==previous.length||d.ids.some(id=>!e.button(id,scope)))throw Error("تغيرت الأزرار. راجع الترتيب مجددًا.");
      e.s.collections[scope].previousOrder=previous;d.ids.forEach((id,i)=>{const b=e.button(id,scope);b.position=i;b.revision++;});e.change(uid,"order",d.kind);this.saved(uid,scope,publish,"تم حفظ الترتيب المختار",edit);return;
    }
    if(a==="lpreview") {
      const d=this.draft(uid,["layout_edit","layout_button","order_review"],p[1]);let config=currentMenu(e.s.collections[scope]),all=e.sorted(true,scope);
      if(e.s.sessions[uid].step==="layout_edit")config=d.layout;
      if(e.s.sessions[uid].step==="order_review")all=d.ids.map(id=>e.button(id,scope)).filter(b=>b?.enabled);
      const individual=e.s.sessions[uid].step==="layout_button";
      if(individual)all=this.proposedButtonMenu(uid,this.buttonDraft(uid,p[1]));
      this.preview(uid,config,all,individual?d.id:undefined);return;
    }
    if(a==="lcat"){this.draft(uid,["layout_edit"],p[2]);this.layoutPanel(uid,p[1],edit);return;}
    if(["lp","lt","ld","ls","lo","lcustom","ltext","lreset","lprev","lsave"].includes(a)) {
      const tail=["lcustom","lreset","lprev","lsave"].includes(a)?p[1]:p[2],d=this.draft(uid,["layout_edit"],tail);
      if(a==="lsave") {
        this.scopeRevision(uid,d);const publish=p[2]==="pub";this.canPublish(uid,publish);const layout=validateMenuLayout(d.layout);
        e.s.collections[scope].previousMenuLayout=currentMenu(e.s.collections[scope]);e.s.collections[scope].menuLayout=layout;e.s.collections[scope].columns=layout.pattern[0];if(scope===PRIVATE_SCOPE)e.s.columns=layout.pattern[0];
        e.change(uid,"menu_layout");this.saved(uid,scope,publish,"تم حفظ تنسيق الفهرس",edit);return;
      }
      if(a==="lcustom"){e.session(uid,"layout_rows",d);e.panel(uid,"أرسل نمط الصفوف مثل 1-3-2 أو ١-٣-٢. يتكرر النمط في كل صفحة، وآخر صف يأخذ الأزرار المتبقية. من 1 إلى 6 أزرار في الصف. لا يحفظ قبل التأكيد.",[BACK],edit);return;}
      if(a==="ltext") {if(!["heading","placeholder"].includes(p[1]))throw Error("حقل غير صالح.");e.session(uid,"layout_text",{...d,field:p[1]});e.panel(uid,p[1]==="heading"?"أرسل عنوان الفهرس (حتى 500 حرف)، أو - للعودة للعنوان الافتراضي.":"أرسل نص خانة الإدخال (حتى 64 حرفًا)، أو - للنص الافتراضي.",[BACK],edit);return;}
      if(a==="lp"){if(!Object.hasOwn(PRESETS,p[1]))throw Error("قالب غير صالح.");const preset=PRESETS[p[1]];d.layout={...d.layout,...preset};delete d.layout.name;}
      if(a==="lt")d.layout.theme=p[1];if(a==="ld")d.layout.decoration=p[1];if(a==="ls")d.layout.pageSize=n(p[1]);
      if(a==="lo"){if(!["persistent","oneTime","resize"].includes(p[1]))throw Error("خيار غير صالح.");d.layout[p[1]]=!d.layout[p[1]];if(d.layout.oneTime&&p[1]==="oneTime")d.layout.persistent=false;if(d.layout.persistent&&p[1]==="persistent")d.layout.oneTime=false;}
      if(a==="lreset")d.layout=validateMenuLayout(undefined,2);
      if(a==="lprev"){if(!e.s.collections[scope].previousMenuLayout)throw Error("لا يوجد تنسيق سابق.");d.layout=validateMenuLayout(e.s.collections[scope].previousMenuLayout);}
      d.layout=validateMenuLayout(d.layout);this.saveDraft(uid,"layout_edit",d);this.layoutPanel(uid,"main",edit);return;
    }
    if(a==="lfmt"){this.beginLinks(uid,p[1],p[2],edit);return;}
    if(["lshape","lcolor","lrows","lshow","linksave"].includes(a)) {
      const d=this.draft(uid,["link_format"],["lshape","lcolor"].includes(a)?p[2]:p[1]),b=e.button(d.id,scope);if(!b||b.revision!==d.revision)throw Error("تغير الرد منذ المعاينة. افتح تنسيق الروابط مجددًا.");
      if(a==="linksave"){const publish=p[2]==="pub";this.canPublish(uid,publish);b.inlineKeyboard=validateInlineKeyboard(d.keyboard);b.revision++;e.change(uid,"link_format",b.id);e.show(uid,b);this.saved(uid,scope,publish,"تم حفظ تنسيق أزرار الروابط",edit);return;}
      if(a==="lshow"){e.q(b.method,{...b.payload,chat_id:uid,reply_markup:{inline_keyboard:d.keyboard}});return;}
      if(a==="lrows"){e.session(uid,"link_rows",d);e.panel(uid,"أرسل نمط الصفوف مثل 1-3-2. يتكرر النمط حتى تنتهي الروابط. من 1 إلى 8 أزرار في الصف. لا تتغير الروابط قبل الحفظ.",[BACK],edit);return;}
      if(a==="lshape")d.keyboard=shapeLinks(d.keyboard,p[1]==="hero"?[1,2,2]:p[1]==="steps"?[1,2,3]:[n(p[1])]);else d.keyboard=colorLinks(d.keyboard,p[1]);
      this.saveDraft(uid,"link_format",d);this.linkPanel(uid,edit);return;
    }
    if(a==="bst") {
      const b=e.button(n(p[1]),scope);if(!b||b.revision!==n(p[2]))throw Error("تغير الزر. افتحه مجددًا.");
      this.saveDraft(uid,"layout_button",{id:b.id,revision:b.revision,collectionRevision:e.s.collections[scope].revision,ids:e.sorted(false,scope).map(b=>b.id),style:b.menuStyle??"inherit",placement:validateButtonPlacement(b.menuPlacement)??{},icon:validateMenuIcon(b.menuIcon)});this.buttonStylePanel(uid,edit);return;
    }
    if(["bschoose","bssave","bscat","bssize","bsbreak","bsmove","bsnumber","bsanchors","bsanchor","bsreset","bsicon","bsnoicon"].includes(a)) {
      const nonce=["bssave","bsnumber","bsreset","bsicon","bsnoicon"].includes(a)?p[1]:["bsanchors","bsanchor"].includes(a)?p[3]:p[2],d=this.buttonDraft(uid,nonce),b=e.button(d.id,scope);
      if(a==="bsicon"){
        e.session(uid,"layout_button_emoji",d);e.panel(uid,`أرسل إيموجي بريميوم واحدًا من لوحة تليجرام، أو حوّل رسالة تحتويه. نحفظ معرّفه الأصلي دون تحويله لإيموجي عادي.\n\nتليجرام يعرض أيقونة واحدة قبل اسم الزر. ظهورها يتطلب اشتراك مالك البوت في BotFather ببريميوم أو صلاحية الإيموجي الأخرى التي يدعمها تليجرام.\nالاختيار مسودة حتى تحفظه.`,[BACK],edit);return;
      }
      if(a==="bscat"){this.buttonStylePanel(uid,edit,p[1]);return;}
      if(a==="bsanchors"){this.buttonAnchors(uid,d,p[1],n(p[2]),edit);return;}
      if(a==="bsnumber"){
        e.session(uid,"layout_button_position",d);e.panel(uid,`أرسل رقم موضع «${b.label}» من 1 إلى ${d.ids.length}، مثل 3 أو ٣.\nالموضع يحدد ترتيبه في قائمة هذه المجموعة، ثم تعرض المعاينة قبل الحفظ.`,[BACK],edit);return;
      }
      if(a==="bssave") {
        const publish=p[2]==="pub";this.canPublish(uid,publish);
        const style=d.style==="inherit"?undefined:validateMenuStyle(d.style),placement=validateButtonPlacement(d.placement),previous=e.sorted(false,scope).map(v=>v.id);
        if(d.ids.length!==previous.length||new Set(d.ids).size!==previous.length||d.ids.some(id=>!e.button(id,scope)))throw Error("تغيرت الأزرار. افتح تصميم الزر مجددًا.");
        if(d.ids.some((id,i)=>id!==previous[i])) {
          e.s.collections[scope].previousOrder=previous;
          d.ids.forEach((id,i)=>{const other=e.button(id,scope);if(other.position!==i){other.position=i;if(other.id!==b.id)other.revision++;}});
        }
        if(style===undefined)delete b.menuStyle;else b.menuStyle=style;if(placement)b.menuPlacement=placement;else delete b.menuPlacement;
        const icon=validateMenuIcon(d.icon);if(icon)b.menuIcon=icon;else delete b.menuIcon;
        b.revision++;e.change(uid,"button_design",b.id);this.saved(uid,scope,publish,"تم حفظ تصميم هذا الزر",edit);return;
      }
      if(a==="bschoose"){if(p[1]!=="inherit")validateMenuStyle(p[1]);d.style=p[1];}
      if(a==="bssize"){if(p[1]==="inherit")delete d.placement.rowSize;else d.placement.rowSize=n(p[1]);}
      if(a==="bsbreak"){if(!["before","after"].includes(p[1]))throw Error("حد الصف غير صالح.");const field=p[1]==="before"?"breakBefore":"breakAfter";d.placement[field]=!d.placement[field];}
      if(a==="bsmove") {
        if(!["first","last","up","down"].includes(p[1]))throw Error("موضع غير صالح.");
        const index=d.ids.indexOf(d.id),position=p[1]==="first"?0:p[1]==="last"?d.ids.length-1:Math.max(0,Math.min(d.ids.length-1,index+(p[1]==="up"?-1:1)));
        d.ids=moveMenuButton(d.ids.map(id=>e.button(id,scope)),d.id,position).map(b=>b.id);
      }
      if(a==="bsanchor") {
        if(!["before","after"].includes(p[1]))throw Error("موضع غير صالح.");const id=n(p[2]),others=d.ids.filter(id=>id!==d.id),index=others.indexOf(id);if(index<0)throw Error("اختر زرًا آخر من هذه المجموعة.");
        d.ids=moveMenuButton(d.ids.map(id=>e.button(id,scope)),d.id,index+(p[1]==="after"?1:0)).map(b=>b.id);
      }
      if(a==="bsreset"){d.style="inherit";d.placement={};}
      if(a==="bsnoicon")delete d.icon;
      d.placement=validateButtonPlacement(d.placement)??{};this.saveDraft(uid,"layout_button",d);this.buttonStylePanel(uid,edit,a==="bschoose"?"color":a==="bssize"?"size":a==="bsbreak"?"breaks":["bsmove","bsanchor"].includes(a)?"place":"main");return;
    }
    throw Error("خيار تنسيق غير صالح.");
  }
  input(m,session) {
    if(!["order_input","layout_rows","layout_text","link_rows","layout_button_position","layout_button_emoji"].includes(session.step))return false;
    const e=this.e,uid=m.from.id,d=structuredClone(session.data),scope=e.requireScope(uid);
    if(session.step==="layout_button_emoji") {
      const data=this.buttonDraft(uid,d.nonce,["layout_button_emoji"]);data.icon=iconFromMessage(m);
      this.saveDraft(uid,"layout_button",data);this.buttonStylePanel(uid);return true;
    }
    if(typeof m.text!=="string")throw Error("أرسل الإعداد كنص.");
    if(session.step==="layout_button_position") {
      const data=this.buttonDraft(uid,d.nonce,["layout_button_position"]),digits=m.text.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
      if(!/^\d+$/.test(digits))throw Error("أرسل رقم الموضع فقط، مثل 3 أو ٣.");
      data.ids=moveMenuButton(data.ids.map(id=>e.button(id,scope)),data.id,n(digits)-1).map(b=>b.id);this.saveDraft(uid,"layout_button",data);this.buttonStylePanel(uid);return true;
    }
    if(session.step==="order_input") {
      this.scopeRevision(uid,d);const all=e.sorted(false,scope),lines=m.text.trim().split(/\r?\n/).map(x=>x.trim()).filter(Boolean),ids=[];
      if(!lines.length)throw Error("أرسل اسم زر واحد على الأقل.");
      for(const line of lines){const name=line.replace(/^\d+[.)]\s+/,""),exact=all.find(b=>b.key===hadaba_menu_editor_norm(line))??all.find(b=>b.key===hadaba_menu_editor_norm(name));let b=exact;
        if(!b&&/^[0-9٠-٩۰-۹]+$/.test(line)){const digits=line.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));b=all[Number(digits)-1];}
        if(!b)throw Error("الاسم أو الموضع غير موجود في هذه القائمة: "+line.slice(0,80));if(ids.includes(b.id))throw Error("اختر كل زر مرة واحدة فقط.");ids.push(b.id);
      }
      this.reviewOrder(uid,ids,d.revision,"manual");return true;
    }
    if(session.step==="layout_rows")d.layout.pattern=parsePattern(m.text);
    if(session.step==="layout_text"){d.layout[d.field]=m.text.trim()==="-"?(d.field==="heading"?"":"اختر من أزرار هضبة"):m.text.trim();d.layout=validateMenuLayout(d.layout);}
    if(session.step==="link_rows"){d.keyboard=shapeLinks(d.keyboard,parsePattern(m.text,8));this.saveDraft(uid,"link_format",d);this.linkPanel(uid);return true;}
    this.saveDraft(uid,"layout_edit",d);this.layoutPanel(uid);return true;
  }
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-backup-compat.mjs
// Read and preserve backup metadata from the withdrawn section-index feature.
const hadaba_backup_compat_norm=s=>String(s).normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
const nextId=sections=>{const used=new Set(sections.map(s=>s.id));let id=1;while(used.has(id))id++;return id;};
function validateSectionTitle(title) {
  if(typeof title!=="string"||!title.trim()||title.trim().length>100||/[\r\n\p{Cc}\p{Cs}]/u.test(title))throw Error("عنوان القسم من حرف إلى 100 حرف، في سطر واحد.");return title.trim();
}
function validateSections(value) {
  if(value===undefined)return [];
  if(!Array.isArray(value)||value.length>40)throw Error("الحد 40 عنوانًا في المجموعة.");
  const ids=new Set(),titles=new Set();
  return value.map(s=>{
    if(!s||typeof s!=="object"||Array.isArray(s)||Object.keys(s).some(k=>!["id","title"].includes(k))||!Number.isSafeInteger(s.id)||s.id<1)throw Error("صيغة عنوان القسم غير صالحة.");
    const title=validateSectionTitle(s.title),key=hadaba_backup_compat_norm(title);if(ids.has(s.id)||titles.has(key))throw Error("عناوين الأقسام أو معرّفاتها مكررة.");ids.add(s.id);titles.add(key);return {id:s.id,title};
  });
}
function validateSectionId(value,sections) {
  if(value===undefined)return undefined;if(!Number.isSafeInteger(value)||!sections.some(s=>s.id===value))throw Error("قسم الزر غير موجود في هذه القائمة.");return value;
}
function mergeSections(buttons,source,target) {
  const sections=validateSections(target),original=validateSections(source),mapping=new Map(),needed=new Set(buttons.map(b=>b.sectionId).filter(id=>id!==undefined));
  for(const id of needed){const section=original.find(s=>s.id===id);if(!section)throw Error("قسم المصدر لم يعد موجودًا.");let next=sections.find(s=>hadaba_backup_compat_norm(s.title)===hadaba_backup_compat_norm(section.title));
    if(!next){if(sections.length>=40)throw Error("النسخ يتجاوز 40 عنوانًا في الوجهة. احذف عنوانًا فارغًا أو انسخ إلى قائمة أخرى.");next={id:nextId(sections),title:section.title};sections.push(next);}mapping.set(id,next.id);
  }
  return {sections,buttons:buttons.map(b=>({...b,...(b.sectionId!==undefined?{sectionId:mapping.get(b.sectionId)}:{})}))};
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-core.mjs










const NEXT = "⬅️ الصفحة التالية";
const PREV = "➡️ الصفحة السابقة";
const hadaba_core_BACK = [["↩️ لوحة الإدارة", "home"]];
const MEDIA = {sendPhoto:"photo",sendDocument:"document",sendVideo:"video",sendAnimation:"animation",sendAudio:"audio",sendVoice:"voice",sendSticker:"sticker"};
const normalize = (s) => String(s).normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
const inline = (rows) => ({inline_keyboard:rows.map(row=>row.map(([text,callback_data])=>({text,callback_data})))});
const numeric = (v) => {const n=Number(v);if(!Number.isSafeInteger(n))throw Error("زر غير صالح.");return n;};
const helperName=user=>[user?.first_name,user?.last_name].filter(v=>typeof v==="string"&&v.trim()).join(" ").replace(/\p{Cc}/gu," ").replace(/\s+/g," ").trim().slice(0,128)||"مساعد";
const GROUP_ACTIONS = new Set(["add","list","button","label","body","links","clearlinks","show","toggle","move","askdelete","delete","preview","stats","refresh","backup","restore","restorepick","restoreapply","copy","copyfrom","copyapply",...MENU_ACTIONS]);
const OWNER_ACTIONS = new Set(["admins","addadmin","helper","helpergroups","allow","deny","removeadmin","unadmin","backup","backupall","restore","restorepick","restoreapply","alerts","alertset","added"]);

function initialState(owner=0) {
  return {schemaVersion:3,owner,buttons:[],nextId:1,admins:{},adminScopes:{},adminVersions:{},nextAdminVersion:1,groups:{},collections:{[PRIVATE_SCOPE]:{title:PRIVATE_TITLE,columns:2,revision:1}},selections:{},sessions:{},pages:{},cooldowns:{},counts:{},columns:2,audit:[]};
}
function validateLabel(label) {
  if(typeof label!=="string")throw Error("أرسل اسم الزر كنص.");
  label=label.trim();
  if(!label || label.length>60 || /[\r\n\p{Cc}\p{Cs}]/u.test(label))throw Error("اسم الزر يكون في سطر واحد، من حرف إلى 60 حرفًا.");
  if(label.startsWith("/") || [NEXT,PREV].map(normalize).includes(normalize(label)))throw Error("هذا الاسم محجوز. اختر اسمًا آخر.");
  return label;
}
function validatePayload(method,payload) {
  if(typeof method!=="string")throw Error("نوع الرد غير مدعوم.");
  if(!payload || typeof payload!=="object" || Array.isArray(payload))throw Error("صيغة الرد غير صحيحة.");
  let allowed;
  if(method==="sendMessage") {
    if(typeof payload.text!=="string" || !payload.text.length || payload.text.length>4096)throw Error("الرد النصي يكون من حرف إلى 4096 حرفًا.");
    allowed=["text","entities"];
  } else if(Object.hasOwn(MEDIA,method)) {
    if(typeof payload[MEDIA[method]]!=="string" || !payload[MEDIA[method]] || payload[MEDIA[method]].length>2048)throw Error("مرجع الملف غير صحيح.");
    if(payload.caption!==undefined && (typeof payload.caption!=="string" || payload.caption.length>1024))throw Error("وصف الملف طويل أو غير صالح.");
    allowed=method==="sendSticker"?["sticker"]:[MEDIA[method],"caption","caption_entities"];
  } else throw Error("نوع الرد غير مدعوم.");
  if(Object.keys(payload).some(k=>!allowed.includes(k)))throw Error("الرد يحتوي على حقول غير مسموحة.");
  for(const field of ["entities","caption_entities"])if(payload[field]!==undefined) {
    const text=payload[field==="entities"?"text":"caption"]??"";
    if(!Array.isArray(payload[field]) || payload[field].length>200 || payload[field].some(e=>typeof e?.type!=="string" || !Number.isInteger(e.offset) || !Number.isInteger(e.length) || e.offset<0 || e.length<=0 || e.offset+e.length>text.length))throw Error("تنسيق النص غير صالح.");
  }
  return structuredClone(payload);
}
function responseFromMessage(m) {
  if(m.media_group_id)throw Error("أرسل صورة أو ملفًا واحدًا، وليس ألبومًا.");
  if(m.text!==undefined) {
    const parsed=parseRichText(m.text,m.entities),p={text:parsed.text||(parsed.inlineKeyboard?"اختر من الروابط التالية 👇":"")};
    if(m.entities&&parsed.entities.length)p.entities=parsed.entities;
    return {method:"sendMessage",payload:validatePayload("sendMessage",p),...(parsed.inlineKeyboard?{inlineKeyboard:parsed.inlineKeyboard}:{})};
  }
  for(const method of ["sendAnimation","sendPhoto","sendVideo","sendAudio","sendVoice","sendSticker","sendDocument"]) {
    const field=MEDIA[method];if(!m[field])continue;
    const file=field==="photo"?m[field].at(-1):m[field];const p={[field]:file.file_id};
    let inlineKeyboard;
    if(method!=="sendSticker" && m.caption) {
      const parsed=parseRichText(m.caption,m.caption_entities);inlineKeyboard=parsed.inlineKeyboard;
      if(parsed.text)p.caption=parsed.text;
      if(parsed.entities.length)p.caption_entities=parsed.entities;
    }
    return {method,payload:validatePayload(method,p),...(inlineKeyboard?{inlineKeyboard}:{})};
  }
  throw Error("أرسل نصًا أو صورة أو ملفًا أو فيديو أو صوتًا أو ملصقًا.");
}
function validateBackup(raw) {
  if(new TextEncoder().encode(raw).length>1500000)throw Error("النسخة كبيرة جدًا؛ الحد 1.5 ميغابايت.");
  let value;try{value=JSON.parse(raw.replace(/^\uFEFF/,""));}catch{throw Error("أرسل ملف JSON صحيحًا صادرًا من هضبة.");}
  const collection=c=>{
    if(!c||!Array.isArray(c.buttons)||c.buttons.length>1000||![1,2,3,4,5,6].includes(c.columns??2))throw Error("هذه النسخة ليست بصيغة هضبة المدعومة.");
    const sections=validateSections(c.sections),seen=new Set();
    const buttons=c.buttons.map(b=>{
      if(!b||typeof b!=="object")throw Error("صيغة الزر غير صحيحة.");
      const label=validateLabel(b.label),key=normalize(label);if(seen.has(key))throw Error("توجد أسماء أزرار مكررة في قائمة واحدة.");seen.add(key);
      if(b.enabled!==undefined && ![true,false,0,1].includes(b.enabled))throw Error("حالة الزر غير صالحة.");
      const inlineKeyboard=validateInlineKeyboard(b.inlineKeyboard);
      const menuFields=buttonMenuFields(b);
      const sectionId=validateSectionId(b.sectionId,sections);
      return {label,method:b.method,payload:validatePayload(b.method,b.payload),enabled:b.enabled===undefined?true:Boolean(b.enabled),...(inlineKeyboard?.length?{inlineKeyboard}:{}),...menuFields,...(sectionId!==undefined?{sectionId}:{})};
    });
    return {columns:c.columns??2,buttons,...(c.menuLayout!==undefined?{menuLayout:validateMenuLayout(c.menuLayout,c.columns??2)}:{}),...(sections.length?{sections}:{})};
  };
  if(value?.schema_version===1)return {schema_version:1,...collection(value)};
  if(value?.schema_version!==2||!Array.isArray(value.collections)||!value.collections.length||value.collections.length>51)throw Error("هذه النسخة ليست بصيغة هضبة المدعومة.");
  const seen=new Set();let total=0;
  const collections=value.collections.map(c=>{
    if(!validScope(c?.scope)||seen.has(c.scope)||typeof c.title!=="string"||c.title.length>200)throw Error("بيانات المجموعة في النسخة غير صالحة.");
    seen.add(c.scope);const clean=collection(c);total+=clean.buttons.length;
    return {scope:c.scope,title:c.title,...clean};
  });
  if(total>1000)throw Error("الحد 1000 زر في النسخة.");
  return {schema_version:2,collections};
}

class Engine {
  constructor(state,config={},now=Date.now()) {
    const upgraded=upgradeGroups(state);
    this.s=upgraded.state;this.config=config;this.now=now;this.actions=[];this.snapshot=upgraded.migrated;
  }
  q(method,payload) {this.actions.push({method,payload:structuredClone(payload)});}
  notifyAdd(uid,user,buttons,scope) {
    if(!buttons.length||uid===this.s.owner||!this.s.owner||this.s.notifyHelperAdds===false||!this.canManage(uid,scope))return;
    const text=`🔔 ${buttons.length===1?"أضاف المساعد ردًا جديدًا":"أضاف المساعد "+buttons.length+" ردود جديدة"}\n👤 المساعد: ${helperName(user)}\n📍 المجموعة: ${this.title(scope)}\n`+buttons.slice(0,10).map(b=>`➕ ${b.label}`).join("\n")+(buttons.length>10?`\n… و${buttons.length-10} ردود أخرى.`:"");
    this.q("sendMessage",{chat_id:this.s.owner,text,reply_markup:inline([...buttons.slice(0,6).map(b=>[[`👁 ${b.label.slice(0,45)}`,`added:${b.id}`]]),[["📍 فتح لوحة المجموعة",`select:${scope}`]]])});
  }
  alerts(uid,edit) {
    if(uid!==this.s.owner)throw Error("إشعارات المساعدين متاحة للمالك فقط.");
    const enabled=this.s.notifyHelperAdds!==false;
    this.panel(uid,`🔔 إشعارات إضافات المساعدين: ${enabled?"مفعلة":"متوقفة"}\nتصلك في الخاص عند حفظ رد جديد أو نسخ ردود جديدة بواسطة مساعد، مع اسمه الظاهر في تيليجرام والمجموعة والأزرار المضافة. التعديلات على الردود الموجودة لا ترسل إشعار إضافة.`,[[[enabled?"🔕 إيقاف الإشعارات":"🔔 تفعيل الإشعارات",`alertset:${enabled?"off":"on"}`]],hadaba_core_BACK],edit);
  }
  admin(uid) {return uid===this.s.owner || Object.hasOwn(this.s.admins,String(uid));}
  canManage(uid,scope) {
    return validScope(scope)&&Object.hasOwn(this.s.collections,scope)&&(uid===this.s.owner||(this.admin(uid)&&Array.isArray(this.s.adminScopes[uid])&&this.s.adminScopes[uid].includes(scope)));
  }
  context(uid) {const c=this.s.selections[uid];return c&&this.canManage(uid,c.scope)?c:null;}
  requireScope(uid) {const c=this.context(uid);if(!c)throw Error("اختر المجموعة أولًا من «اختيار المجموعة»، ثم أضف ردودها أو عدّلها.");return c.scope;}
  title(scope) {return this.s.collections[scope]?.title??"مجموعة غير متاحة";}
  sorted(active=false,scope=PRIVATE_SCOPE) {return this.s.buttons.filter(b=>b.scope===scope&&(!active||b.enabled)).sort((a,b)=>a.position-b.position||a.id-b.id);}
  button(id,scope=PRIVATE_SCOPE) {return this.s.buttons.find(b=>b.id===Number(id)&&b.scope===scope);}
  clear(uid) {delete this.s.sessions[uid];}
  session(uid,step,data={}) {
    if(/^(new_|edit_|restore_|copy_|layout_|order_|link_|section_|date_)/.test(step)) {
      const context=this.context(uid);if(!context)throw Error("اختر المجموعة أولًا.");
      data={...data,scope:context.scope,token:context.token};
    }
    this.s.sessions[uid]={step,data,expires:this.now+900000};
  }
  audit(uid,action,detail="") {this.s.audit.push({uid,action,detail,time:this.now});this.s.audit=this.s.audit.slice(-200);this.snapshot=true;}
  change(uid,action,detail="",scope=this.requireScope(uid)) {
    this.s.collections[scope].revision++;
    for(const [key,value] of Object.entries(this.s.pages))if(key.startsWith(scope+":")||value.scope===scope)delete this.s.pages[key];
    this.audit(uid,action,{scope,detail});
  }
  clean() {
    for(const [uid,s]of Object.entries(this.s.sessions))if(s.step?.startsWith("section_")||["new_label","new_body"].includes(s.step)&&s.data?.sectionId!==undefined)delete this.s.sessions[uid];
    for(const table of [this.s.sessions,this.s.pages])for(const [k,v]of Object.entries(table))if(v.expires<this.now)delete table[k];
    for(const [k,until]of Object.entries(this.s.cooldowns))if(until<this.now)delete this.s.cooldowns[k];
  }
  respond(m,text,markup) {
    const p={chat_id:m.chat.id,text,reply_parameters:{message_id:m.message_id,allow_sending_without_reply:true}};
    if(m.is_topic_message&&m.message_thread_id)p.message_thread_id=m.message_thread_id;
    if(markup)p.reply_markup=markup;this.q("sendMessage",p);
  }
  scopedRows(uid,rows) {
    const c=this.context(uid);
    if(!Array.isArray(rows)||rows.some(row=>!Array.isArray(row)||!row.length||row.some(button=>!Array.isArray(button)||button.length!==2||typeof button[0]!=="string"||typeof button[1]!=="string"||!button[1]||new TextEncoder().encode(button[1]).length>64)))throw Error("تعذر عرض هذه اللوحة. افتح /admin مجددًا.");
    const result=rows.map(row=>row.map(([text,data])=>[text,c&&GROUP_ACTIONS.has(data.split(":")[0])?`c:${c.token}:${data}`:data]));
    if(result.some(row=>row.some(([,data])=>new TextEncoder().encode(data).length>64)))throw Error("تعذر عرض هذه اللوحة. افتح /admin مجددًا.");return result;
  }
  panel(uid,text,rows,edit) {const p={chat_id:uid,text,reply_markup:inline(this.scopedRows(uid,rows))};if(edit)p.message_id=edit;this.q(edit?"editMessageText":"sendMessage",p);}
  home(uid,edit) {
    this.clear(uid);const c=this.context(uid),rows=[[["🗂 اختيار المجموعة","groups:0"]]];
    if(c) {
      rows.push([["➕ إضافة زر","add"],["⏱ إضافة موعد","dateadd"]],[["📝 الأزرار والردود","list:0"],["📊 الإحصاءات","stats"]],[["🎨 تنسيق الأزرار","layout"],["🔢 ترتيب الأزرار","order"]],[["👁 تجربة الأزرار","preview"],["📋 نسخ ردود من قائمة","copy:0"]]);
      if(c.scope!==PRIVATE_SCOPE&&this.s.groups[c.scope])rows.push([["🔄 تحديث الردود والأزرار","refresh"]]);
      if(uid===this.s.owner)rows.push([["💾 نسخة هذه القائمة","backup"],["♻️ استعادة لهذه القائمة","restore"]]);
    }
    rows.push([["📚 الشروحات المصورة","guides:home:0"]]);
    if(uid===this.s.owner)rows.push([["👥 المساعدون","admins"],["💾 نسخة جميع القوائم","backupall"]],[["🔔 إشعارات المساعدين","alerts"]]);
    const unselected=uid!==this.s.owner&&!this.collectionEntries(uid).length?"لا توجد مجموعات مسموح لك بإدارتها حاليًا. اطلب من مالك هضبة تحديد مجموعاتك من لوحة المساعدين.":"اختر المجموعة المسموح لك بإدارة ردودها أولًا.";
    this.panel(uid,`هضبة 🌄\nلوحة الإدارة • ${uid===this.s.owner?"المالك":"مساعد"}\n`+(c?`📍 القائمة الحالية: ${this.title(c.scope)}\nأزرار هذه القائمة: ${this.sorted(false,c.scope).length}\nكل إضافة أو تعديل هنا يخص هذه القائمة وحدها.`:unselected)+"\n/cancel لإلغاء الإدخال.",rows,edit);
  }
  collectionEntries(uid) {
    return Object.keys(this.s.collections).filter(scope=>this.canManage(uid,scope)).sort((a,b)=>(a===PRIVATE_SCOPE?1:0)-(b===PRIVATE_SCOPE?1:0)||this.title(a).localeCompare(this.title(b),"ar"));
  }
  groups(uid,page=0,edit,copy=false) {
    const current=this.context(uid)?.scope,all=this.collectionEntries(uid).filter(scope=>!copy||scope!==current),pages=Math.max(1,Math.ceil(all.length/8));
    if(!all.length){this.panel(uid,copy?"لا توجد قائمة أخرى مسموح لك بالنسخ منها.":"لا توجد مجموعات مسموح لك بإدارتها حاليًا. اطلب من المالك تحديد مجموعاتك من لوحة المساعدين.",[hadaba_core_BACK],edit);return;}
    page=Math.max(0,Math.min(page,pages-1));
    const rows=all.slice(page*8,(page+1)*8).map(scope=>[[`${scope===current?"📍 ":scope===PRIVATE_SCOPE?"📁 ":this.s.groups[scope]?"👥 ":"⏸ "}${this.title(scope).slice(0,35)} (${this.sorted(false,scope).length})`,`${copy?"copyfrom":"select"}:${scope}`]]);
    const nav=[];if(page)nav.push(["السابق",`${copy?"copy":"groups"}:${page-1}`]);if(page+1<pages)nav.push(["التالي",`${copy?"copy":"groups"}:${page+1}`]);if(nav.length)rows.push(nav);
    const text=copy?`📋 نسخ ردود إلى: ${this.title(current)}\nاختر القائمة المصدر. النسخ مستقل؛ الأسماء الموجودة في الوجهة تُتخطى، والتعديلات اللاحقة لا تنتقل بين القوائم.`:"🗂 اختر المجموعة التي تريد إدارة ردودها.\nكل مجموعة لها أزرارها وردودها وترتيبها وإحصاءاتها.\n\nلربط مجموعة جديدة: أضف هضبة ثم أرسل فيها /connect من حساب المالك. تبدأ بقائمة فارغة، ويمكنك نسخ ردود إليها.\n⏸ تعني مجموعة موقوفة؛ ردودها محفوظة ويمكن إعادة ربطها بـ /connect.\n📁 قائمة الخاص مستقلة، وتحفظ نسخة الردود القديمة.";
    this.panel(uid,text+(uid!==this.s.owner?"\n\nتظهر هنا المجموعات التي سمح لك المالك بإدارتها فقط.":""),[...rows,hadaba_core_BACK],edit);
  }
  select(uid,scope,edit) {
    if(!this.canManage(uid,scope))throw Error("ليس لديك صلاحية لإدارة هذه المجموعة. اختر إحدى مجموعاتك المسموح بها.");
    this.clear(uid);this.s.selections[uid]={scope,token:selectionToken()};
    for(const key of Object.keys(this.s.pages))if(key===`${uid}:${uid}`)delete this.s.pages[key];
    delete this.s.cooldowns[`${uid}:${uid}`];this.home(uid,edit);
  }
  guide(uid,page=0,edit) {
    if(!Number.isInteger(page)||page<0||page>=GUIDE_PAGES.length)page=0;
    const section=GUIDE_PAGES[page],rows=[],nav=[];
    if(page)nav.push(["السابق",`guide:${page-1}`]);if(page+1<GUIDE_PAGES.length)nav.push(["التالي",`guide:${page+1}`]);if(nav.length)rows.push(nav);
    rows.push(...GUIDE_PAGES.map((p,i)=>[[`${i===page?"• ":""}${i+1}. ${p.title}`,`guide:${i}`]]));
    if(this.admin(uid))rows.push([[this.context(uid)?"➕ إضافة رد":"🗂 اختيار المجموعة",this.context(uid)?"add":"groups:0"],["↩️ لوحة الإدارة","home"]]);
    rows.push([["📚 كل الشروحات المصورة","guides:home:0"]]);
    const topics=[["create"],["links","inline-rows","premium"],["colors"],["text","media"],["edit","lifecycle"],["groups","copy"],["helpers"],["templates","custom","decoration","options"],["alphabetical","manual","link-format","refresh"],["individual","premium"],["alerts"]][page]??[];
    const markup=inline(this.scopedRows(uid,rows));
    markup.inline_keyboard.unshift(...topics.map(id=>GUIDE_ARTICLES.find(a=>a.id===id)).filter(a=>a?.url).map(a=>[{text:`📸 ${a.title}`,url:a.url}]));
    const p={chat_id:uid,text:section.html+`\n\n${page+1} / ${GUIDE_PAGES.length}`,parse_mode:"HTML",link_preview_options:{is_disabled:true},reply_markup:markup};
    if(edit)p.message_id=edit;this.q(edit?"editMessageText":"sendMessage",p);
  }
  guides(uid,category="home",page=0,edit) {
    if(!Object.hasOwn(GUIDE_CATEGORIES,category)&&category!=="all")category="home";
    const rows=[],urls=[];let text;
    if(category==="home") {
      text=`📚 شروحات ردود هَضَبَة\n\n${GUIDE_ARTICLES.length} شرحًا مستقلًا مع خطوات مكتوبة و${GUIDE_ILLUSTRATION_COUNT} صورة توضيحية. كل شرح يبين أين تبدأ، وما تضغطه، وماذا سيحدث.\n\nاختر القسم، ثم اضغط اسم الميزة لفتح شرحها على Telegraph. يمكنك أيضًا فتح الفهرس الكامل بزر واحد.\n\nالصور أمثلة تعليمية؛ لا تعرض بيانات مجموعاتك أو مساعديك.`;
      if(GUIDE_HUB)urls.push([{text:"📖 افتح الدليل الكامل على Telegraph ↗",url:GUIDE_HUB}]);
      rows.push(...Object.entries(GUIDE_CATEGORIES).map(([id,title])=>[[title,`guides:${id}:0`]]),[[`📑 كل الشروحات (${GUIDE_ARTICLES.length})`,"guides:all:0"]]);
    }else{
      const all=GUIDE_ARTICLES.filter(a=>category==="all"||a.category===category),pages=Math.max(1,Math.ceil(all.length/6));
      if(!Number.isInteger(page))page=0;page=Math.max(0,Math.min(page,pages-1));
      text=`📚 ${category==="all"?"كل الشروحات":GUIDE_CATEGORIES[category]}\n\nاضغط اسم الميزة لفتح شرحها المكتوب والمصور على Telegraph.\nالصفحة ${page+1} من ${pages}.`;
      urls.push(...all.slice(page*6,page*6+6).filter(a=>a.url).map(a=>[{text:`📖 ${a.title} ↗`,url:a.url}]));
      const nav=[];if(page)nav.push(["السابق",`guides:${category}:${page-1}`]);if(page+1<pages)nav.push(["التالي",`guides:${category}:${page+1}`]);if(nav.length)rows.push(nav);
      rows.push([["↩️ أقسام الشروحات","guides:home:0"]]);
    }
    rows.push([["💬 شرح سريع داخل البوت","guide:0"]]);
    if(this.admin(uid))rows.push([["↩️ لوحة الإدارة","home"]]);
    const markup=inline(this.scopedRows(uid,rows));markup.inline_keyboard.unshift(...urls);
    const payload={chat_id:uid,text,parse_mode:"HTML",link_preview_options:{is_disabled:true},reply_markup:markup};
    if(edit)payload.message_id=edit;this.q(edit?"editMessageText":"sendMessage",payload);
  }
  show(uid,b) {if(!b||!this.canManage(uid,b.scope))return;const p=applyDynamicDatesToPayload({...b.payload,chat_id:uid},this.now);if(b.inlineKeyboard?.length)p.reply_markup={inline_keyboard:b.inlineKeyboard};this.q(b.method,p);}
  scopeForMessage(m) {return m.chat.type==="private"?(this.admin(m.from?.id)?this.context(m.from.id)?.scope??(m.from.id===this.s.owner?PRIVATE_SCOPE:null):PRIVATE_SCOPE):String(m.chat.id);}
  keyboard(m,page=0,everyone=false) {
    const scope=this.scopeForMessage(m),buttons=this.sorted(true,scope),config=currentMenu(this.s.collections[scope]),grid=menuGrid(buttons,config,page),pages=grid.pages;
    if(everyone)for(const k of Object.keys(this.s.pages))if(k.startsWith(m.chat.id+":"))delete this.s.pages[k];
    if(!pages)return {markup:{remove_keyboard:true,selective:!everyone&&m.chat.type!=="private"},page:0,pages:0};
    page=grid.page;const rows=grid.rows;
    const nav=[];if(page)nav.push({text:PREV});if(page+1<pages)nav.push({text:NEXT});if(nav.length)rows.push(nav);
    if(m.from?.id)this.s.pages[`${m.chat.id}:${m.from.id}`]={scope,page,expires:this.now+86400000};
    return {markup:{keyboard:rows,resize_keyboard:config.resize,is_persistent:config.persistent,one_time_keyboard:config.oneTime,selective:!everyone&&m.chat.type!=="private",input_field_placeholder:config.placeholder},page,pages};
  }
  menu(m,page=0,everyone=false) {
    if(m.chat.type==="private"&&this.admin(m.from?.id)&&m.from.id!==this.s.owner&&!this.context(m.from.id)){this.groups(m.from.id);return;}
    const k=this.keyboard(m,page,everyone),scope=this.scopeForMessage(m);
    this.respond(m,k.pages?(currentMenu(this.s.collections[scope]).heading||"هضبة 🌄\nاختر زرًا، وسيظهر رده هنا.")+(m.chat.type==="private"&&this.admin(m.from?.id)?`\nمعاينة قائمة: ${this.title(scope)}`:"")+(k.pages>1?`\nالصفحة ${k.page+1} من ${k.pages}.`:""):"هضبة 🌄\nلا توجد ردود في هذه القائمة بعد. افتح /admin إذا كنت من فريق الإدارة.",k.markup);
  }
  deliver(m,b,showMenu=true) {
    if(b.scope!==this.scopeForMessage(m))return;
    const p=applyDynamicDatesToPayload(b.payload,this.now);p.chat_id=m.chat.id;p.reply_parameters={message_id:m.message_id,allow_sending_without_reply:true};
    if(m.is_topic_message&&m.message_thread_id)p.message_thread_id=m.message_thread_id;
    if(b.inlineKeyboard?.length)p.reply_markup={inline_keyboard:b.inlineKeyboard};else if(showMenu)p.reply_markup=this.keyboard(m,Math.floor(this.sorted(true,b.scope).findIndex(v=>v.id===b.id)/currentMenu(this.s.collections[b.scope]).pageSize)).markup;
    this.q(b.method,p);this.s.counts[b.id]=(this.s.counts[b.id]??0)+1;
  }
  run(update) {this.clean();if(update.callback_query)this.callback(update.callback_query);else if(update.message)this.message(update.message);return this.plan();}
  plan() {return {state:this.s,actions:this.actions,snapshot:this.snapshot};}
  publish(uid,scope) {
    if(!this.canManage(uid,scope)||scope===PRIVATE_SCOPE||!this.s.groups[scope])throw Error("لا توجد صلاحية لتحديث هذه المجموعة أو لم تعد مرتبطة.");
    const fake={chat:{id:Number(scope),type:"supergroup"},from:{id:uid}},config=currentMenu(this.s.collections[scope]);
    this.q("sendMessage",{chat_id:Number(scope),text:(config.heading||"هضبة 🌄")+"\nتم تحديث الردود وقائمة الأزرار المحفوظة. اختر الزر المطلوب.",reply_markup:this.keyboard(fake,0,true).markup});
  }
  message(m) {
    const {chat}=m;if(!["private","group","supergroup"].includes(chat?.type))return;
    if(m.migrate_to_chat_id){this.migrate(chat.id,m.migrate_to_chat_id);return;}
    if(m.migrate_from_chat_id){this.migrate(m.migrate_from_chat_id,chat.id);return;}
    const uid=m.from?.id;if(!uid||m.from.is_bot)return;
    const privateChat=chat.type==="private",text=(m.text??"").trim();
    if(privateChat&&this.config.claimCode&&text===this.config.claimCode) {
      if(this.s.owner&&this.s.owner!==uid)return;
      if(!this.s.owner){this.s.owner=uid;this.audit(uid,"claim_owner");}
      this.respond(m,"تم ربط حسابك مالكًا لهضبة ✅");this.home(uid);return;
    }
    const admin=this.admin(uid);
    if(privateChat&&admin&&uid!==this.s.owner)this.s.admins[uid]=helperName(m.from);
    const first=text.split(/\s+/)[0],parts=first.split("@");let command=first.startsWith("/")?parts[0].toLowerCase():"";
    if(command&&parts[1]&&parts[1].toLowerCase()!==String(this.config.username).toLowerCase())return;
    if(command==="/id"){this.respond(m,`رقم حسابك: ${uid}`+(!privateChat?`\nرقم المجموعة: ${chat.id}`:""));return;}
    if(command==="/guide"||(command==="/start"&&text.split(/\s+/)[1]==="guide")) {
      if(privateChat)this.guides(uid);else this.respond(m,"📚 الشروحات المكتوبة والمصورة موجودة في خاص هضبة.",{inline_keyboard:[[{text:"افتح شروحات هضبة",url:`https://t.me/${this.config.username}?start=guide`}]]});return;
    }
    if(!privateChat) {
      if(["/connect","/disconnect"].includes(command)) {
        if(uid!==this.s.owner){this.respond(m,"ربط المجموعات متاح لمالك هضبة فقط.");return;}
        const scope=String(chat.id);
        if(command==="/connect") {
          if(!this.s.collections[scope]&&Object.keys(this.s.collections).length>=51){this.respond(m,"الحد 50 مجموعة محفوظة بالإضافة إلى قائمة الخاص.");return;}
          this.s.groups[scope]=chat.title??"مجموعة";
          this.s.collections[scope]??={title:this.s.groups[scope],columns:2,revision:1};this.s.collections[scope].title=this.s.groups[scope];
          this.s.selections[uid]={scope,token:selectionToken()};this.clear(uid);this.audit(uid,"connect",scope);
          this.respond(m,"تم ربط هضبة ✅ لهذه المجموعة قائمة مستقلة.\nمن خاص البوت افتح /admin ← اختيار المجموعة لإضافة ردودها أو نسخ ردود من قائمة أخرى.");this.menu(m,0,true);
        } else {delete this.s.groups[scope];this.audit(uid,"disconnect",scope);this.respond(m,"تم إيقاف هضبة في هذه المجموعة. ردودها محفوظة؛ /connect يعيد ربطها.",{remove_keyboard:true});}
        return;
      }
      if(!Object.hasOwn(this.s.groups,String(chat.id)))return;
      if(chat.title&&this.s.groups[chat.id]!==chat.title){this.s.groups[chat.id]=chat.title;this.s.collections[chat.id].title=chat.title;}
    }
    if(command==="/refresh") {
      if(!privateChat){if(!this.canManage(uid,String(chat.id))){this.respond(m,"تحديث القائمة متاح للمالك أو مساعد مسموح له بإدارة هذه المجموعة.");return;}this.menu(m,0,true);}
      else if(admin){try{this.dispatch("refresh",[],uid);}catch(e){this.respond(m,e.message);}}
      else this.respond(m,"تحديث القوائم متاح لفريق الإدارة فقط.");return;
    }
    if(["/admin","/cancel"].includes(command)) {
      if(privateChat&&admin)this.home(uid);else this.respond(m,privateChat?"لوحة الإدارة متاحة للمالك والمساعدين فقط.":"افتح خاص هضبة وأرسل /admin.");return;
    }
    if(command==="/groups") {
      if(privateChat&&admin){this.clear(uid);this.groups(uid);}else this.respond(m,privateChat?"اختيار مجموعات الإدارة متاح لفريق الإدارة فقط.":"افتح خاص هضبة وأرسل /groups لاختيار المجموعة التي تدير ردودها.");return;
    }
    if(["/sections","/index"].includes(command)) {
      if(privateChat&&admin)this.clear(uid);this.respond(m,"أُلغي فهرس العناوين السابق. /menu يعرض أزرار القائمة، و/admin في الخاص لتعديل الردود.");return;
    }
    if(["/add","/replies","/date"].includes(command)) {
      if(privateChat&&admin&&command==="/date"){this.clear(uid);if(!this.context(uid))this.groups(uid);else this.dispatch("dateadd",[],uid);return;}
      if(privateChat&&admin){this.clear(uid);if(!this.context(uid))this.groups(uid);else if(command==="/add")this.dispatch("add",[],uid);else this.list(uid);}
      else this.respond(m,privateChat?"إنشاء الردود وتعديلها متاح للمالك والمساعدين فقط.":"لإضافة ردود هذه المجموعة أو تعديلها، افتح خاص هضبة وأرسل /groups ثم /admin.");return;
    }
    if(["/start","/menu"].includes(command)) {
      if(privateChat&&admin&&command==="/start")this.home(uid);else {if(admin)this.clear(uid);this.menu(m);}return;
    }
    if(command==="/help"){this.respond(m,"هضبة 🌄\n/menu أزرار هذه المجموعة فقط. اضغط اسم الرد ليظهر هنا.\n/groups في الخاص لاختيار مجموعة الإدارة؛ بعدها /add للإضافة و/replies للتعديل.\n/guide دليل المجموعات والردود والصور والروابط.\n/admin للإدارة و/id لرقم حسابك.");return;}
    if(privateChat&&admin&&this.s.sessions[uid]){this.input(m,this.s.sessions[uid]);return;}
    const scope=this.scopeForMessage(m);
    if([NEXT,PREV].map(normalize).includes(normalize(text))) {
      const saved=this.s.pages[`${chat.id}:${uid}`];this.menu(m,(saved?.scope===scope?saved.page:0)+(normalize(text)===normalize(NEXT)?1:-1));return;
    }
    const b=menuMatch(text,this.sorted(true,scope),currentMenu(this.s.collections[scope]));if(!b)return;
    const c=`${chat.id}:${uid}`;if((this.s.cooldowns[c]??0)>this.now)return;this.s.cooldowns[c]=this.now+3000;this.deliver(m,b);
  }
  list(uid,page=0,edit) {
    const scope=this.requireScope(uid),all=this.sorted(false,scope),n=Math.max(1,Math.ceil(all.length/8));page=Math.max(0,Math.min(page,n-1));
    const rows=all.slice(page*8,(page+1)*8).map(b=>[[(b.enabled?"✅ ":"⏸ ")+b.label.slice(0,40),`button:${b.id}`]]),nav=[];
    if(page)nav.push(["السابق",`list:${page-1}`]);if(page+1<n)nav.push(["التالي",`list:${page+1}`]);if(nav.length)rows.push(nav);
    this.panel(uid,`📍 ${this.title(scope)}\n`+(all.length?`الأزرار والردود • ${page+1}/${n}\nاختر زرًا لتعديله.`:"لا توجد أزرار بعد. اختر إضافة زر من لوحة الإدارة."),[...rows,hadaba_core_BACK],edit);
  }
  detail(uid,id,edit) {
    const scope=this.requireScope(uid),b=this.button(id,scope);if(!b){this.panel(uid,"هذا الزر غير موجود في القائمة المختارة.",[hadaba_core_BACK],edit);return;}
    const r=b.revision;
    this.panel(uid,`📍 ${this.title(scope)}\nالزر: ${b.label}\nالحالة: ${b.enabled?"ظاهر":"مخفي"}\nأزرار الروابط: ${b.inlineKeyboard?.flat().length??0}\n\nالرد:\n${formatDynamicDatesInText(b.payload.text??b.payload.caption??"رد يحتوي على ملف أو وسائط.",[],this.now).text.slice(0,1700)}`,
      [[["✏️ اسم الزر",`label:${id}:${r}`],["📝 تغيير الرد",`body:${id}:${r}`]],[["🔗 أزرار الروابط",`links:${id}:${r}`],["👁 معاينة الرد",`show:${id}`]],[["🎨 تنسيق روابط الرد",`lfmt:${id}:${r}`],["🛠 تصميم هذا الزر",`bst:${id}:${r}`]],[[b.enabled?"⏸ إخفاء":"▶️ إظهار",`toggle:${id}:${r}`]],[["⬆️ تقديم",`move:${id}:-1:${r}`],["⬇️ تأخير",`move:${id}:1:${r}`]],[["🔢 ترتيب القائمة","order"]],[["🗑 حذف الزر",`askdelete:${id}:${r}`]],[["↩️ الأزرار","list:0"]],hadaba_core_BACK],edit);
  }
  helperId(id) {
    id=numeric(id);
    if(id<=0||id===this.s.owner||!Object.hasOwn(this.s.admins,String(id)))throw Error("هذا المساعد لم يعد موجودًا. افتح قائمة المساعدين مجددًا.");
    return id;
  }
  nextHelperVersion(current=0) {
    const version=Math.max(this.s.nextAdminVersion??1,current+1);
    this.s.nextAdminVersion=version+1;return version;
  }
  helper(uid,id,edit) {
    if(uid!==this.s.owner)throw Error("إدارة صلاحيات المساعدين متاحة للمالك فقط.");
    id=this.helperId(id);
    const scopes=this.collectionEntries(uid).filter(scope=>this.canManage(id,scope));
    const summary=scopes.slice(0,12).map(scope=>"• "+this.title(scope).slice(0,60)).join("\n");
    this.panel(uid,`👤 المساعد: ${this.s.admins[id]}\nرقم الحساب: ${id}\nالمجموعات المسموح بها: ${scopes.length}\n`+(scopes.length?summary+(scopes.length>12?`\nو${scopes.length-12} قوائم أخرى.`:""):"لا يستطيع إدارة أي مجموعة حتى تحدد مجموعاته.")+"\n\nيضيف الردود ويعدلها ويحذفها في القوائم المسموح بها فقط. لا يدير المساعدين أو الربط أو النسخ الاحتياطية.",[[["🗂 تحديد مجموعات المساعد",`helpergroups:${id}:0`]],[["➖ إلغاء صلاحية المساعد",`removeadmin:${id}`]],[["↩️ المساعدون","admins"]],hadaba_core_BACK],edit);
  }
  helperGroups(uid,id,page=0,edit) {
    if(uid!==this.s.owner)throw Error("إدارة صلاحيات المساعدين متاحة للمالك فقط.");
    id=this.helperId(id);
    const all=this.collectionEntries(uid),pages=Math.max(1,Math.ceil(all.length/8)),revision=this.s.adminVersions[id]??1;
    page=Math.max(0,Math.min(page,pages-1));
    const rows=all.slice(page*8,(page+1)*8).map(scope=>{
      const allowed=this.canManage(id,scope);
      return [[`${allowed?"✅":"⬜"} ${this.title(scope).slice(0,35)}${scope===PRIVATE_SCOPE?"":` [${scope}]`}`,`${allowed?"deny":"allow"}:${id}:${scope}:${revision}:${page}`]];
    });
    const nav=[];if(page)nav.push(["السابق",`helpergroups:${id}:${page-1}`]);if(page+1<pages)nav.push(["التالي",`helpergroups:${id}:${page+1}`]);if(nav.length)rows.push(nav);
    this.panel(uid,`🗂 مجموعات المساعد: ${this.s.admins[id]}\n✅ مسموح • ⬜ غير مسموح\nاضغط اسم المجموعة لإعطاء الصلاحية أو سحبها؛ يُحفظ الاختيار فورًا. يمكنك اختيار أكثر من مجموعة.\nلا يرى في لوحة الإدارة إلا مجموعاته المسموح بها. سحب الصلاحية يوقف إدخاله الجاري ويرفض أزراره القديمة.\n\nالصفحة ${page+1} من ${pages}.`,[...rows,[["↩️ تفاصيل المساعد",`helper:${id}`]],hadaba_core_BACK],edit);
  }
  setHelperScope(uid,id,scope,allowed,revision,page,edit) {
    if(uid!==this.s.owner)throw Error("إدارة صلاحيات المساعدين متاحة للمالك فقط.");
    id=this.helperId(id);
    if(!validScope(scope)||!Object.hasOwn(this.s.collections,scope))throw Error("المجموعة لم تعد موجودة. افتح مجموعات المساعد مجددًا.");
    if((this.s.adminVersions[id]??1)!==revision){this.helperGroups(uid,id,page,edit);return;}
    const scopes=new Set(this.s.adminScopes[id]??[]);
    if(allowed)scopes.add(scope);else scopes.delete(scope);
    this.s.adminScopes[id]=[...scopes];this.s.adminVersions[id]=this.nextHelperVersion(revision);
    this.clear(id);delete this.s.pages[`${id}:${id}`];
    const selected=this.s.selections[id];
    if(selected&&this.canManage(id,selected.scope))this.s.selections[id]={...selected,token:selectionToken()};
    else delete this.s.selections[id];
    this.audit(uid,allowed?"allow_helper_group":"deny_helper_group",{helper:id,scope});
    this.helperGroups(uid,id,page,edit);
  }
  callback(q) {
    const uid=q.from?.id,m=q.message;
    if(uid&&m?.chat?.type==="private"&&m.chat.id===uid&&/^guides:[a-z-]+:\d+$/.test(String(q.data??""))) {
      const [,category,page]=q.data.split(":");
      this.q("answerCallbackQuery",{callback_query_id:q.id});this.guides(uid,category,Number(page),m.message_id);return;
    }
    if(uid&&m?.chat?.type==="private"&&m.chat.id===uid&&/^guide:\d+$/.test(String(q.data??""))) {
      this.q("answerCallbackQuery",{callback_query_id:q.id});this.guide(uid,Number(q.data.split(":")[1]),m.message_id);return;
    }
    if(!uid||m?.chat?.type!=="private"||m.chat.id!==uid||!this.admin(uid)){this.q("answerCallbackQuery",{callback_query_id:q.id,text:"ليس لديك صلاحية لهذه العملية.",show_alert:true});return;}
    if(uid!==this.s.owner&&q.from.first_name)this.s.admins[uid]=helperName(q.from);
    this.q("answerCallbackQuery",{callback_query_id:q.id});let raw=String(q.data??""),bound=false;
    if(raw.startsWith("c:")) {
      const [,token,...parts]=raw.split(":"),c=this.context(uid);raw=parts.join(":");
      if(!c||token!==c.token){this.panel(uid,"هذه اللوحة تخص اختيارًا سابقًا. افتح لوحة المجموعة الحالية قبل التعديل.",[hadaba_core_BACK],m.message_id);return;}bound=true;
    }
    const p=raw.split(":"),a=p[0],edit=m.message_id;
    if(OWNER_ACTIONS.has(a)&&uid!==this.s.owner){this.panel(uid,"هذه العملية متاحة لمالك هضبة فقط.",[hadaba_core_BACK],edit);return;}
    if(GROUP_ACTIONS.has(a)&&!bound){this.panel(uid,"هذه اللوحة قديمة أو لم تحدد مجموعة. اختر المجموعة من لوحة الإدارة أولًا.",[[["🗂 اختيار المجموعة","groups:0"]],hadaba_core_BACK],edit);return;}
    try{this.dispatch(a,p,uid,edit,{...m,from:q.from});}catch(e){this.panel(uid,e.message||"هذا الزر قديم أو غير صالح.",[hadaba_core_BACK],edit);}
  }
  dispatch(a,p,uid,edit,m) {
    if(!this.admin(uid))throw Error("ليس لديك صلاحية لهذه العملية.");
    if(OWNER_ACTIONS.has(a)&&uid!==this.s.owner)throw Error("هذه العملية متاحة لمالك هضبة فقط.");
    const scope=GROUP_ACTIONS.has(a)?this.requireScope(uid):this.context(uid)?.scope;
    if(MENU_ACTIONS.has(a)){new MenuEditor(this).dispatch(a,p,uid,edit,m);return;}
    if(a==="alerts"){this.alerts(uid,edit);return;}
    if(a==="alertset"){if(!["on","off"].includes(p[1]))throw Error("خيار إشعار غير صالح.");this.s.notifyHelperAdds=p[1]==="on";this.audit(uid,"helper_notifications",this.s.notifyHelperAdds);this.alerts(uid,edit);return;}
    if(a==="added") {const b=this.s.buttons.find(b=>b.id===numeric(p[1]));if(!b)throw Error("حُذف هذا الرد؛ افتح قائمة المجموعة لمراجعة الردود الحالية.");this.show(uid,b);this.panel(uid,`👁 ${b.label}\n📍 ${this.title(b.scope)}\nهذه أحدث نسخة محفوظة من الرد.`,[[["📍 فتح لوحة المجموعة",`select:${b.scope}`]],hadaba_core_BACK],edit);return;}
    if(a==="home")this.home(uid,edit);
    else if(a==="groups"){this.clear(uid);this.groups(uid,p[1]===undefined?0:numeric(p[1]),edit);}
    else if(a==="select")this.select(uid,p[1],edit);
    else if(a==="dateadd"){this.session(uid,"date_label");this.panel(uid,`📍 ${this.title(scope)}\n⏱ <b>مساعد إضافة موعد أو عد تنازلي ذكي</b>\n\nأرسل أولاً اسم الزر كما سيظهر للطلاب في القائمة.\nمثال: موعد المياجر، إيداع المكافأة، بداية الإجازة`,[hadaba_core_BACK],edit);}
    else if(a==="datecal"){
      const session=this.s.sessions[uid];if(session?.step!=="date_cal"||session.expires<this.now||session.data.scope!==scope||session.data.token!==this.context(uid).token)throw Error("هذا الاختيار قديم. ابدأ إضافة الموعد مجددًا.");
      const cal=p[1];session.step="date_year";session.data.cal=cal;const isG=cal==="gregorian";
      this.panel(uid,`📍 ${this.title(scope)}\nالزر: «${session.data.label}» (${isG?"📅 تقويم ميلادي":"🌙 تقويم هجري"})\n\nأرسل رقم السنة، أو أرسل * للتكرار سنويًا كل عام:\nأمثلة:\n• ${isG?"2026 أو 2027 أو *":"1448 أو 1449"}`,[hadaba_core_BACK],edit);
    }
    else if(a==="add"){this.session(uid,"new_label");this.panel(uid,`📍 ${this.title(scope)}\nاكتب اسم الزر كما تريد أن يظهر للطلاب.\nمثال: التقويم الجامعي`,[hadaba_core_BACK],edit);}
    else if(a==="list"){this.clear(uid);this.list(uid,numeric(p[1]),edit);}
    else if(a==="button"){this.clear(uid);this.detail(uid,numeric(p[1]),edit);}
    else if(["label","body","links"].includes(a)) {
      const id=numeric(p[1]),revision=numeric(p[2]),b=this.button(id,scope);if(!b||b.revision!==revision){this.detail(uid,id,edit);return;}
      this.session(uid,"edit_"+a,{id,revision});
      if(a==="links") {
        const source=buttonsToSource(b.inlineKeyboard),text=`📍 ${this.title(scope)}\nأرسل أسطر أزرار الروابط الجديدة، ومعها ترتيب الصفوف إن رغبت:\n(عنوان الزر|https://example.com|أخضر)\n[صف:1]\n\nهذا المحرر يغيّر الأزرار فقط ويحفظ نص الرد وصورته.`;
        this.panel(uid,text+(source&&source.length<2200?"\n\nالصيغة الحالية:\n"+source:""),[[["📖 شرح الأزرار","guide:1"]],[["🗑 إزالة أزرار الروابط",`clearlinks:${id}:${revision}`]],[["↩️ تفاصيل الرد",`button:${id}`]],hadaba_core_BACK],edit);
      } else this.panel(uid,`📍 ${this.title(scope)}\n`+(a==="label"?"أرسل الاسم الجديد للزر.":"أرسل الرد الجديد كنص أو صورة مع وصفها. يحفظ تنسيق تليجرام.\nأضف أسطر (عنوان|https://example.com) لتغيير أزرار الروابط أيضًا؛ بدونها تبقى الأزرار الحالية.\n/guide للدليل."),[hadaba_core_BACK],edit);
    } else if(a==="clearlinks") {
      const b=this.button(numeric(p[1]),scope);if(b?.revision===numeric(p[2])){delete b.inlineKeyboard;b.revision++;this.change(uid,"clear_links",b.id);}
      this.clear(uid);this.detail(uid,p[1],edit);
    } else if(a==="show")this.show(uid,this.button(numeric(p[1]),scope));
    else if(a==="toggle") {const b=this.button(numeric(p[1]),scope);if(b?.revision===numeric(p[2])){b.enabled=!b.enabled;b.revision++;this.change(uid,"toggle",b.id);}this.detail(uid,p[1],edit);}
    else if(a==="move") {
      const id=numeric(p[1]),direction=numeric(p[2]),revision=numeric(p[3]),all=this.sorted(false,scope),i=all.findIndex(b=>b.id===id&&b.revision===revision);
      if([-1,1].includes(direction)&&i>=0&&all[i+direction]){const b=all[i],other=all[i+direction];[b.position,other.position]=[other.position,b.position];b.revision++;other.revision++;this.change(uid,"move",id);}this.detail(uid,id,edit);
    } else if(a==="askdelete") {
      const b=this.button(numeric(p[1]),scope);if(!b||b.revision!==numeric(p[2])){this.detail(uid,p[1],edit);return;}
      this.panel(uid,`حذف «${b.label}» وردّه من ${this.title(scope)}؟`,[[["🗑 نعم، احذف",`delete:${b.id}:${b.revision}`]],[["إلغاء",`button:${b.id}`]]],edit);
    } else if(a==="delete") {
      const b=this.button(numeric(p[1]),scope);if(!b||b.revision!==numeric(p[2])){this.panel(uid,"تغير الزر منذ فتح التأكيد. راجعه قبل الحذف.",[[["عرض الزر",`button:${p[1]}`]],hadaba_core_BACK],edit);return;}
      this.s.buttons=this.s.buttons.filter(v=>v.id!==b.id);delete this.s.counts[b.id];this.change(uid,"delete",b.id);this.list(uid,0,edit);
    } else if(a==="preview"){this.clear(uid);this.menu({...m,from:{id:uid}});}
    else if(a==="stats") {
      const all=this.sorted(false,scope),rows=[...all].sort((a,b)=>(this.s.counts[b.id]??0)-(this.s.counts[a.id]??0)).slice(0,10),total=all.reduce((n,b)=>n+(this.s.counts[b.id]??0),0);
      this.panel(uid,`📍 ${this.title(scope)}\n📊 الطلبات التي جُهز ردّها: ${total}\n`+rows.map(b=>`${b.label}: ${this.s.counts[b.id]??0}`).join("\n"),[hadaba_core_BACK],edit);
    } else if(a==="admins") {
      this.clear(uid);const rows=Object.entries(this.s.admins).map(([id,name])=>[[`👤 ${name.slice(0,25)} • ${this.collectionEntries(Number(id)).length} قوائم`,`helper:${id}`]]);
      this.panel(uid,"👥 المساعدون\nالمساعد يدير المجموعات التي تحددها له فقط. المساعد الجديد يبدأ دون مجموعات مسموح بها.\nاختر اسم مساعد لتحديد مجموعاته أو سحب صلاحياته.",[[["➕ إضافة مساعد","addadmin"]],...rows,hadaba_core_BACK],edit);
    } else if(a==="helper")this.helper(uid,numeric(p[1]),edit);
    else if(a==="helpergroups")this.helperGroups(uid,numeric(p[1]),numeric(p[2]),edit);
    else if(["allow","deny"].includes(a))this.setHelperScope(uid,numeric(p[1]),p[2],a==="allow",numeric(p[3]),numeric(p[4]),edit);
    else if(a==="addadmin"){this.session(uid,"admin_id");this.panel(uid,"اطلب من المساعد فتح هضبة وإرسال /id، ثم أرسل رقمه هنا.\nاستخدم رقم الحساب، وليس @اسم المستخدم. بعد إضافته تحدد المجموعات المسموح له بإدارتها.",[hadaba_core_BACK],edit);}
    else if(a==="removeadmin")this.panel(uid,`إلغاء صلاحية المساعد ${numeric(p[1])}؟`,[[["نعم، ألغِ الصلاحية",`unadmin:${p[1]}`]],[["إلغاء","admins"]]],edit);
    else if(a==="unadmin") {
      const id=numeric(p[1]);if(id===this.s.owner)throw Error("لا يمكن إلغاء صلاحيات المالك.");delete this.s.admins[id];delete this.s.adminScopes[id];delete this.s.adminVersions[id];this.clear(id);delete this.s.selections[id];delete this.s.pages[`${id}:${id}`];this.audit(uid,"remove_admin",id);
      this.panel(uid,"تم إلغاء صلاحية المساعد.",[[["المساعدون","admins"]],hadaba_core_BACK],edit);
    } else if(a==="refresh") {
      this.publish(uid,scope);this.panel(uid,`تم تجهيز الردود وقائمة أزرار ${this.title(scope)} المحدثة لإرسالها إلى المجموعة.`,[hadaba_core_BACK],edit);
    } else if(a==="copy"){this.clear(uid);this.groups(uid,p[1]===undefined?0:numeric(p[1]),edit,true);}
    else if(a==="copyfrom") {
      const source=p[1];if(!this.canManage(uid,source)||source===scope)throw Error("اختر قائمة مصدر أخرى مسموحًا لك بإدارتها.");
      const keys=new Set(this.sorted(false,scope).map(b=>b.key)),all=this.sorted(false,source),add=all.filter(b=>!keys.has(b.key));
      if(!add.length)throw Error("لا توجد أسماء جديدة لنسخها؛ كل الأزرار موجودة في الوجهة أو المصدر فارغ.");
      if(this.s.buttons.length+add.length>1000)throw Error("النسخ يتجاوز الحد الإجمالي: 1000 زر.");
      const nonce=selectionToken();this.session(uid,"copy_review",{source,sourceRevision:this.s.collections[source].revision,revision:this.s.collections[scope].revision,nonce});
      this.panel(uid,`📋 من: ${this.title(source)}\nإلى: ${this.title(scope)}\nسيُضاف ${add.length} رد مستقل. ستُتخطى ${all.length-add.length} أسماء موجودة دون استبدالها.\nالنسخ يحفظ الصور والتنسيق وأزرار الروابط وألوانها.`,[[["📋 تأكيد النسخ",`copyapply:${nonce}`]],hadaba_core_BACK],edit);
    } else if(a==="copyapply") {
      const session=this.s.sessions[uid],data=session?.data;
      if(session?.step!=="copy_review"||session.expires<this.now||data.nonce!==p[1]||data.scope!==scope||data.token!==this.context(uid).token)throw Error("هذا التأكيد قديم. ابدأ النسخ مجددًا.");
      if(!this.canManage(uid,data.source))throw Error("لم تعد لديك صلاحية للنسخ من القائمة المصدر.");
      if(this.s.collections[scope].revision!==data.revision||this.s.collections[data.source]?.revision!==data.sourceRevision)throw Error("تغيرت إحدى القائمتين منذ المعاينة. افتح النسخ مجددًا لمراجعة العدد.");
      const keys=new Set(this.sorted(false,scope).map(b=>b.key)),add=this.sorted(false,data.source).filter(b=>!keys.has(b.key));
      if(this.s.buttons.length+add.length>1000)throw Error("النسخ يتجاوز الحد الإجمالي: 1000 زر.");
      const merged=mergeSections(add,this.s.collections[data.source].sections,this.s.collections[scope].sections);if(merged.sections.length)this.s.collections[scope].sections=merged.sections;
      const created=merged.buttons.map(b=>this.insert(b.label,{method:b.method,payload:b.payload,...(b.inlineKeyboard?{inlineKeyboard:b.inlineKeyboard}:{}),...buttonMenuFields(b),...(b.sectionId!==undefined?{sectionId:b.sectionId}:{})},b.enabled,scope));
      this.clear(uid);this.change(uid,"copy",{source:data.source,count:add.length});this.panel(uid,`تم نسخ ${add.length} رد إلى ${this.title(scope)} ✅\nكل نسخة مستقلة؛ يمكنك تعديلها هنا ثم إرسال /menu في هذه المجموعة.`,[hadaba_core_BACK],edit);
      this.notifyAdd(uid,m?.from,created,scope);
    } else if(a==="backup")this.export(uid,"hadaba-backup.json",[scope]);
    else if(a==="backupall")this.export(uid,"hadaba-all-groups.json",this.collectionEntries(uid));
    else if(a==="restore") {
      this.session(uid,"restore_file");this.panel(uid,`📍 الاستعادة إلى: ${this.title(scope)}\nأرسل ملف JSON صادرًا من هضبة. إذا احتوى عدة قوائم، ستختار واحدة منها.\nستُستبدل ردود هذه القائمة وحدها بعد مراجعة العدد والتأكيد. القوائم الأخرى والمساعدون والربط لا تتغير.`,[hadaba_core_BACK],edit);
    } else if(a==="restorepick") {
      const session=this.s.sessions[uid];if(session?.step!=="restore_choose"||session.expires<this.now||session.data.nonce!==p[2]||session.data.scope!==scope||session.data.token!==this.context(uid).token)throw Error("هذا الاختيار قديم. ابدأ الاستعادة مجددًا.");
      const index=numeric(p[1]),collection=session.data.collections[index];if(!collection)throw Error("القائمة غير موجودة في النسخة.");
      this.reviewRestore(uid,collection,session.data.revision,edit);
    } else if(a==="restoreapply") {
      const session=this.s.sessions[uid],data=session?.data;
      if(session?.step!=="restore_review"||session.expires<this.now||data.nonce!==p[1]||data.scope!==scope||data.token!==this.context(uid).token)throw Error("هذا التأكيد قديم. ابدأ الاستعادة مجددًا.");
      if(this.s.collections[scope].revision!==data.revision)throw Error("تغيرت ردود هذه القائمة منذ مراجعة النسخة. ابدأ الاستعادة مجددًا حتى تحفظ تعديلات الفريق.");
      const existing=this.sorted(false,scope);if(this.s.buttons.length-existing.length+data.buttons.length>1000)throw Error("الاستعادة تتجاوز الحد الإجمالي: 1000 زر.");
      this.export(uid,"hadaba-before-restore.json",[scope]);const ids=new Set(existing.map(b=>b.id));this.s.buttons=this.s.buttons.filter(b=>b.scope!==scope);for(const id of ids)delete this.s.counts[id];
      for(const b of data.buttons)this.insert(b.label,{method:b.method,payload:b.payload,...(b.inlineKeyboard?{inlineKeyboard:b.inlineKeyboard}:{}),...buttonMenuFields(b),...(b.sectionId!==undefined?{sectionId:b.sectionId}:{})},b.enabled,scope);
      if(data.sections?.length)this.s.collections[scope].sections=validateSections(data.sections);else delete this.s.collections[scope].sections;
      this.s.collections[scope].columns=data.columns;if(data.menuLayout)this.s.collections[scope].menuLayout=validateMenuLayout(data.menuLayout);else delete this.s.collections[scope].menuLayout;delete this.s.collections[scope].previousOrder;delete this.s.collections[scope].previousMenuLayout;if(scope===PRIVATE_SCOPE)this.s.columns=data.columns;this.clear(uid);this.change(uid,"restore",data.buttons.length);
      this.panel(uid,`تمت استعادة ${data.buttons.length} رد إلى ${this.title(scope)} ✅\nأرسلت نسخة المحتوى السابق. أرسل /menu في هذه المجموعة لتحديث أزرارها.`,[hadaba_core_BACK],edit);
    } else throw Error("هذا الزر قديم أو غير صالح.");
  }
  insert(label,response,enabled=true,scope=PRIVATE_SCOPE) {
    const b={id:this.s.nextId++,scope,label,key:normalize(label),...structuredClone(response),enabled,position:Math.max(-1,...this.sorted(false,scope).map(b=>b.position))+1,revision:1};this.s.buttons.push(b);return b;
  }
  input(m,session) {
    const uid=m.from.id,{step,data}=session;
    if((step==="admin_id"||step.startsWith("restore_"))&&uid!==this.s.owner){this.clear(uid);return;}
    if(/^(new_|edit_|copy_|restore_|layout_|order_|link_|section_|date_)/.test(step)&&(!this.canManage(uid,data.scope)||data.scope!==this.context(uid)?.scope||data.token!==this.context(uid)?.token)){this.clear(uid);this.respond(m,"تغير اختيار المجموعة أو صلاحياتك. ابدأ من لوحة إحدى مجموعاتك المسموح بها.");return;}
    const scope=data.scope;
    try {
      if(new MenuEditor(this).input(m,session))return;
      if(step==="date_label"){
        if(typeof m.text!=="string")throw Error("أرسل اسم الزر كنص.");
        const named=takeCustomIcon(m.text,m.entities),label=validateLabel(named.text);
        if(this.sorted(false,scope).some(b=>b.key===normalize(label)))throw Error("يوجد زر بهذا الاسم في هذه القائمة. اختر اسمًا مختلفًا.");
        if(this.s.buttons.length>=1000)throw Error("الحد الإجمالي 1000 زر.");
        this.session(uid,"date_cal",{label,...(named.icon?{menuIcon:named.icon}:{})});
        this.panel(uid,`📍 ${this.title(scope)}\nالزر: «${label}»\n\nاختر نوع التقويم المعتمد للموعد:`,[[["📅 تقويم ميلادي","datecal:gregorian"],["🌙 تقويم هجري","datecal:hijri"]],hadaba_core_BACK]);
      } else if(step==="date_year"){
        if(typeof m.text!=="string")throw Error("أرسل السنة كنص أو أرسل *.");
        let yearStr=digits(m.text.trim());
        if(yearStr!=="*"&&(!/^\d{4}$/.test(yearStr)||Number(yearStr)<1400||Number(yearStr)>2100))throw Error(data.cal==="hijri"?"أرسل سنة هجرية صحيحة (مثلاً 1448).":"أرسل سنة ميلادية صحيحة من 4 أرقام (مثلاً 2026) أو أرسل * للتكرار السنوي.");
        if(data.cal==="hijri"&&yearStr==="*")throw Error("التكرار بالنجوم (*) متاح للتقويم الميلادي فقط.");
        this.session(uid,"date_month",{...data,year:yearStr});
        this.respond(m,`📍 ${this.title(scope)}\nالسنة: ${yearStr}\n\nأرسل رقم الشهر (من 1 إلى 12، أو * للتكرار شهريًا كل شهر):\nمثال: 10 أو 5 أو *`);
      } else if(step==="date_month"){
        if(typeof m.text!=="string")throw Error("أرسل رقم الشهر أو *.");
        let monthStr=digits(m.text.trim());
        if(monthStr!=="*"&&(!/^\d{1,2}$/.test(monthStr)||Number(monthStr)<1||Number(monthStr)>12))throw Error("أرسل رقم شهر بين 1 و 12، أو * للتكرار الشهري.");
        if(data.cal==="hijri"&&monthStr==="*")throw Error("التكرار بالنجوم (*) متاح للتقويم الميلادي فقط.");
        this.session(uid,"date_day",{...data,month:monthStr});
        this.respond(m,`📍 ${this.title(scope)}\nالسنة: ${data.year} • الشهر: ${monthStr}\n\nأرسل رقم اليوم (من 1 إلى 31، أو * للتكرار يوميًا كل يوم):\nمثال: 27 أو 15 أو *`);
      } else if(step==="date_day"){
        if(typeof m.text!=="string")throw Error("أرسل رقم اليوم أو *.");
        let dayStr=digits(m.text.trim());
        if(dayStr!=="*"&&(!/^\d{1,2}$/.test(dayStr)||Number(dayStr)<1||Number(dayStr)>31))throw Error("أرسل رقم يوم بين 1 و 31، أو * للتكرار اليومي.");
        if(data.cal==="hijri"&&dayStr==="*")throw Error("التكرار بالنجوم (*) متاح للتقويم الميلادي فقط.");
        this.session(uid,"date_time",{...data,day:dayStr});
        this.respond(m,`📍 ${this.title(scope)}\nالتاريخ: ${data.year}-${data.month}-${dayStr}\n\nأرسل وقت الموعد (الساعة والدقيقة):\n• بنظام 24 ساعة: مثلاً 16:00 أو 00:00\n• بنظام 12 ساعة: مثلاً 4:00 م أو 10:30 ص\n• أو أرسل «تخطي» ليكون الموعد بدون ساعة (بداية اليوم 00:00).`);
      } else if(step==="date_time"){
        if(typeof m.text!=="string")throw Error("أرسل الوقت كنص أو أرسل تخطي.");
        const inputTime=m.text.trim();let timePart="";
        if(!["تخطي","تم","0","لا","-","skip"].includes(inputTime)){
          const normTime=digits(inputTime),match=normTime.match(/^(\d{1,2})(?::(\d{1,2}))?(?:\s*(ص|م|AM|PM|am|pm))?$/u);
          if(!match)throw Error("صيغة الوقت غير صحيحة. أمثلة: 16:00 أو 4:00 م أو أرسل «تخطي».\n/cancel للإلغاء.");
          const h=match[1],min=match[2]?match[2].padStart(2,"0"):"00",period=match[3]?" "+match[3]:"";
          timePart=` ${h}:${min}${period}`;
        }
        const isHijri=data.cal==="hijri";
        const tag=isHijri?`<${data.year}-${data.month}-${data.day}${timePart}>`:`{${data.year}-${data.month}-${data.day}${timePart}}`;
        this.session(uid,"date_text",{...data,tag});
        this.respond(m,`📍 ${this.title(scope)}\nصيغة الموعد الجاهزة:\n<code>${tag}</code>\n\nأرسل نص الجواب الذي سيظهر مع الموعد، أو أرسل «تخطي» ليظهر الموعد فقط:\nمثال: إيداع المكافأة الجامعية للطلاب يكون يوم:`);
      } else if(step==="date_text"){
        let bodyText;
        if(typeof m.text==="string"&&!["تخطي","تم","skip"].includes(m.text.trim())){
          bodyText=`${m.text.trim()}\n${data.tag}`;
        }else{
          bodyText=data.tag;
        }
        if(this.sorted(false,scope).some(b=>b.key===normalize(data.label)))throw Error("أضاف مساعد آخر زرًا بهذا الاسم في هذه القائمة. اختر اسمًا مختلفًا.");
        const id=this.insert(data.label,{method:"sendMessage",payload:{text:bodyText},...(data.menuIcon?{menuIcon:data.menuIcon}:{})},true,scope).id;
        this.change(uid,"create",id);this.clear(uid);
        this.respond(m,`تم حفظ موعد العد التنازلي في ${this.title(scope)} ✅ وهذا رده المباشر مع الحساب التلقائي:`);
        this.show(uid,this.button(id,scope));this.detail(uid,id);
        this.notifyAdd(uid,m.from,[this.button(id,scope)],scope);
      } else if(["new_label","edit_label"].includes(step)) {
        if(typeof m.text!=="string")throw Error("أرسل اسم الزر كنص.");
        const named=takeCustomIcon(m.text,m.entities),label=validateLabel(named.text);if(this.sorted(false,scope).some(b=>b.key===normalize(label)&&(step==="new_label"||b.id!==data.id)))throw Error("يوجد زر بهذا الاسم في هذه القائمة. اختر اسمًا مختلفًا.");
        if(step==="new_label") {
          if(this.s.buttons.length>=1000)throw Error("الحد الإجمالي 1000 زر.");this.session(uid,"new_body",{label,...(named.icon?{menuIcon:named.icon}:{})});
          this.respond(m,`📍 ${this.title(scope)}\nأرسل الآن الجواب الذي يظهر عند طلب «${label}»: نصًا منسقًا أو صورة مع وصفها أو ملفًا.\nلإضافة أزرار روابط، اكتبها في الرسالة أو وصف الصورة:\n(التواصل|https://t.me/YourContact|أخضر)\n(القناة|https://t.me/YourChannel)\n[صف:1-1]\n\n⏱ للعد التنازلي والمواعيد التلقائية اكتب في النص: {2026-10-27 16:00} أو <1448-04-15> أو متجدد {2026-*-27 00:00}.\n\nاحذف حقل اللون للأزرار العادية. /guide للدليل، و/cancel للإلغاء.`);
        } else {
          const b=this.button(data.id,scope);if(b?.revision===data.revision){b.label=label;b.key=normalize(label);if(named.icon)b.menuIcon=named.icon;b.revision++;this.change(uid,"edit",b.id);}else this.panel(uid,"عدّل مساعد آخر هذا الزر. افتحه مجددًا لتجنب استبدال تعديله.",[hadaba_core_BACK]);this.clear(uid);this.detail(uid,data.id);
        }
      } else if(["new_body","edit_body"].includes(step)) {
        const response=responseFromMessage(m);let id;
        if(step==="new_body") {
          if(this.s.buttons.length>=1000)throw Error("الحد الإجمالي 1000 زر.");if(this.sorted(false,scope).some(b=>b.key===normalize(data.label)))throw Error("أضاف مساعد آخر زرًا بهذا الاسم في هذه القائمة. اختر اسمًا مختلفًا.");
          id=this.insert(data.label,{...response,...(data.menuIcon?{menuIcon:data.menuIcon}:{})},true,scope).id;this.change(uid,"create",id);
        } else {
          const b=this.button(data.id,scope);id=data.id;if(b?.revision===data.revision){b.method=response.method;b.payload=response.payload;if(response.inlineKeyboard)b.inlineKeyboard=response.inlineKeyboard;b.revision++;this.change(uid,"edit",id);}else {this.panel(uid,"عدّل مساعد آخر هذا الزر. افتحه مجددًا لتجنب استبدال تعديله.",[hadaba_core_BACK]);this.clear(uid);this.detail(uid,id);return;}
        }
        this.clear(uid);this.respond(m,`تم حفظ الرد في ${this.title(scope)} ✅ وهذه معاينته:`);this.show(uid,this.button(id,scope));this.detail(uid,id);
        if(step==="new_body")this.notifyAdd(uid,m.from,[this.button(id,scope)],scope);
      } else if(step==="edit_links") {
        const b=this.button(data.id,scope);
        if(b?.revision!==data.revision){this.clear(uid);this.respond(m,"تغير الرد منذ فتح المحرر. افتحه مجددًا لتجنب استبدال تعديل آخر.");this.detail(uid,data.id);return;}
        if(typeof m.text!=="string")throw Error("أرسل أزرار الروابط كنص. النص والصورة يُعدّلان من «تغيير الرد».");
        b.inlineKeyboard=parseButtonEditor(m.text,m.entities);b.revision++;this.change(uid,"edit_links",b.id);this.clear(uid);this.respond(m,"تم تحديث أزرار الروابط ✅ وهذه معاينة الرد:");this.show(uid,b);this.detail(uid,b.id);
      } else if(step==="admin_id") {
        const text=(m.text??"").trim();if(!/^\d+$/.test(text))throw Error("أرسل رقم حساب المساعد كما يظهر في /id.");const id=numeric(text);if(id<=0||id===this.s.owner)throw Error("أرسل رقمًا موجبًا مختلفًا عن رقم المالك.");
        if(!this.s.admins[id]&&Object.keys(this.s.admins).length>=50)throw Error("الحد 50 مساعدًا.");this.s.admins[id]??=`مساعد ${id}`;this.s.adminScopes[id]??=[];this.s.adminVersions[id]??=this.nextHelperVersion();this.audit(uid,"add_admin",id);this.clear(uid);this.respond(m,`المساعد ${id} مسجل ✅\nحدد الآن المجموعات المسموح له بإدارتها من الأزرار التالية. يبدأ المساعد الجديد دون صلاحيات لأي مجموعة.`);this.helperGroups(uid,id);
      } else if(step==="restore_file") {
        if(!m.document||m.document.file_size>1500000)throw Error("أرسل ملف JSON لا يتجاوز 1.5 ميغابايت.");
        const jobKey=crypto.randomUUID();this.session(uid,"restore_reading",{jobKey,revision:this.s.collections[scope].revision});this.respond(m,"أفحص النسخة قبل عرض تأكيد الاستعادة.");this.q("__import",{user_id:uid,file_id:m.document.file_id,jobKey});
      } else this.respond(m,"انتظر نتيجة الفحص أو اختر التأكيد، أو أرسل /cancel للإلغاء.");
    } catch(e){this.respond(m,e.message);}
  }
  export(uid,filename="hadaba-backup.json",scopes=[this.requireScope(uid)]) {
    if(uid!==this.s.owner)throw Error("النسخ الاحتياطية متاحة للمالك فقط.");
    const collections=scopes.map(scope=>({scope,title:this.title(scope),columns:this.s.collections[scope].columns,...(this.s.collections[scope].menuLayout?{menuLayout:this.s.collections[scope].menuLayout}:{}),...(this.s.collections[scope].sections?.length?{sections:this.s.collections[scope].sections}:{}),buttons:this.sorted(false,scope).map(b=>({label:b.label,method:b.method,payload:b.payload,enabled:b.enabled,...(b.inlineKeyboard?.length?{inlineKeyboard:b.inlineKeyboard}:{}),...buttonMenuFields(b),...(b.sectionId!==undefined?{sectionId:b.sectionId}:{})}))}));
    this.q("sendDocument",{chat_id:uid,__document:JSON.stringify({schema_version:2,collections},null,2),__filename:filename,caption:collections.length===1?`نسخة مستقلة: ${this.title(scopes[0])}. تشمل الردود والصور وأزرار الروابط وألوانها.`:"نسخة جميع القوائم، منفصلة بأسماء المجموعات. عند الاستعادة تختار قائمة مصدر ووجهة؛ مراجع الوسائط تعمل مع البوت نفسه."});
  }
  reviewRestore(uid,collection,revision,edit) {
    const scope=this.requireScope(uid),nonce=crypto.randomUUID().replaceAll("-","");
    this.session(uid,"restore_review",{...collection,revision,nonce});
    this.panel(uid,`📍 الوجهة: ${this.title(scope)}\nالمصدر: ${collection.title??"نسخة هضبة القديمة"}\nعدد الردود في النسخة: ${collection.buttons.length}\nتأكيد الاستعادة يستبدل ردود الوجهة وحدها ويحفظ نسخة محتواها السابق.`,[[["♻️ تأكيد الاستعادة",`restoreapply:${nonce}`]],hadaba_core_BACK],edit);
  }
  prepareRestore(uid,jobKey,raw,error) {
    const session=this.s.sessions[uid],context=this.context(uid);
    if(uid!==this.s.owner||session?.step!=="restore_reading"||session.expires<this.now||session.data.jobKey!==jobKey||session.data.scope!==context?.scope||session.data.token!==context?.token)return this.plan();
    try {
      if(error)throw Error(error);const backup=validateBackup(raw),collections=backup.collections??[{...backup,title:"نسخة هضبة القديمة"}];
      if(collections.length===1)this.reviewRestore(uid,collections[0],session.data.revision);
      else {
        const nonce=selectionToken();this.session(uid,"restore_choose",{collections,revision:session.data.revision,nonce});
        this.panel(uid,`📍 الوجهة: ${this.title(context.scope)}\nاختر قائمة واحدة من النسخة لاستعادتها هنا. القوائم الأخرى لن تُستبدل.`,[...collections.map((c,i)=>[[`${c.title.slice(0,35)} (${c.buttons.length})`,`restorepick:${i}:${nonce}`]]),hadaba_core_BACK]);
      }
    } catch(e){this.session(uid,"restore_file");this.panel(uid,e.message,[hadaba_core_BACK]);}
    return this.plan();
  }
  migrate(oldId,newId) {
    const old=String(oldId),next=String(newId);if(old===next||!this.s.collections[old])return;
    const source=this.s.collections[old],keys=new Set(this.sorted(false,next).map(b=>b.key));
    for(const b of this.sorted(false,old)) {
      if(keys.has(b.key)){let i=2,label;do{label=b.label.slice(0,43)+` (منقول ${i++})`;}while(keys.has(normalize(label)));b.label=label;b.key=normalize(label);}
      keys.add(b.key);b.scope=next;b.revision++;
    }
    this.s.collections[next]={...source,revision:Math.max(source.revision,this.s.collections[next]?.revision??0)+1};delete this.s.collections[old];
    if(this.s.groups[old]){this.s.groups[next]=this.s.groups[old];delete this.s.groups[old];}
    for(const [uid,scopes] of Object.entries(this.s.adminScopes))if(Array.isArray(scopes)&&scopes.includes(old)) {
      this.s.adminScopes[uid]=[...new Set(scopes.map(scope=>scope===old?next:scope))];
      this.s.adminVersions[uid]=this.nextHelperVersion(this.s.adminVersions[uid]??1);this.clear(uid);
    }
    for(const [uid,c] of Object.entries(this.s.selections))if(c.scope===old){this.s.selections[uid]={scope:next,token:selectionToken()};this.clear(uid);}
    for(const [key,value] of Object.entries(this.s.pages))if(key.startsWith(old+":")||value.scope===old)delete this.s.pages[key];
    this.audit(this.s.owner,"migrate_group",{old,next});
  }
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-repository.mjs


class Repository {
  constructor(db,owner=0) {this.db=db;this.owner=owner;}
  async ensure() {await this.db.prepare("INSERT OR IGNORE INTO bot_state(id,version,data,commit_key) VALUES(1,0,?,'')").bind(JSON.stringify(initialState(this.owner))).run();}
  async read() {await this.ensure();const row=await this.db.prepare("SELECT version,data FROM bot_state WHERE id=1").first();return {version:row.version,state:JSON.parse(row.data)};}
  async process(eventKey,reducer) {
    await this.ensure();
    for(let attempt=0;attempt<8;attempt++) {
      if(await this.db.prepare("SELECT 1 AS done FROM processed_events WHERE event_key=?").bind(eventKey).first())return {duplicate:true};
      const row=await this.db.prepare("SELECT version,data FROM bot_state WHERE id=1").first();
      const before=JSON.parse(row.data);let plan=reducer(before),serialized=JSON.stringify(plan.state);
      if(new TextEncoder().encode(serialized).length>1450000) {
        plan={state:before,snapshot:false,actions:before.owner?[{method:"sendMessage",payload:{chat_id:before.owner,text:"تعذر حفظ التعديل لأن حجم المحتوى وصل إلى حد التخزين. اختصر بعض الردود الطويلة أو احذف أزرارًا غير مستخدمة ثم أعد المحاولة."}}]:[]};serialized=JSON.stringify(before);
      }
      const commitKey=crypto.randomUUID(),now=Date.now(),version=row.version+1;
      const guard="EXISTS(SELECT 1 FROM bot_state WHERE id=1 AND version=? AND commit_key=?)";
      const statements=[
        this.db.prepare("UPDATE bot_state SET data=?,version=version+1,commit_key=? WHERE id=1 AND version=? AND NOT EXISTS(SELECT 1 FROM processed_events WHERE event_key=?)").bind(serialized,commitKey,row.version,eventKey),
        this.db.prepare(`INSERT INTO processed_events(event_key,created_at) SELECT ?,? WHERE ${guard}`).bind(eventKey,now,version,commitKey),
      ];
      plan.actions.forEach((a,i)=>statements.push(this.db.prepare(`INSERT INTO outgoing(id,event_key,sequence,method,payload,status,attempts,next_attempt,lease_until,created_at) SELECT ?,?,?,?,?,'pending',0,0,0,? WHERE ${guard}`).bind(eventKey+":"+i,eventKey,i,a.method,JSON.stringify(a.payload),now,version,commitKey)));
      if(plan.snapshot) {
        statements.push(this.db.prepare(`INSERT INTO snapshots(id,data,created_at) SELECT ?,?,? WHERE ${guard}`).bind(commitKey,row.data,now,version,commitKey));
        statements.push(this.db.prepare(`DELETE FROM snapshots WHERE id NOT IN(SELECT id FROM snapshots ORDER BY created_at DESC,id DESC LIMIT 14) AND ${guard}`).bind(version,commitKey));
      }
      const result=await this.db.batch(statements);
      if(result[0].meta.changes===1)return {duplicate:false,actions:plan.actions.length};
    }
    throw Error("Concurrent update contention; retry request");
  }
  async pending() {const result=await this.db.prepare("SELECT * FROM outgoing WHERE status='pending' ORDER BY created_at,event_key,sequence LIMIT 25").all();return result.results;}
  async claim(id) {
    const key=crypto.randomUUID(),now=Date.now();
    const result=await this.db.prepare("UPDATE outgoing SET lease_key=?,lease_until=? WHERE id=? AND status='pending' AND lease_until<? AND next_attempt<=?").bind(key,now+25000,id,now,now).run();
    return result.meta.changes===1?key:null;
  }
  async finish(id,key,status="delivered") {await this.db.prepare("UPDATE outgoing SET status=?,lease_key=NULL,lease_until=0 WHERE id=? AND lease_key=?").bind(status,id,key).run();}
  async retry(id,key,delay) {await this.db.prepare("UPDATE outgoing SET attempts=attempts+1,next_attempt=?,lease_key=NULL,lease_until=0 WHERE id=? AND lease_key=?").bind(Date.now()+delay,id,key).run();}
  async eventPending(eventKey) {return Boolean(await this.db.prepare("SELECT 1 AS pending FROM outgoing WHERE event_key=? AND status='pending' LIMIT 1").bind(eventKey).first());}
  async cleanup() {
    const cutoff=Date.now()-7*86400000;
    await this.db.batch([
      this.db.prepare("DELETE FROM outgoing WHERE status<>'pending' AND created_at<?").bind(cutoff),
      this.db.prepare("DELETE FROM processed_events WHERE created_at<? AND event_key NOT IN(SELECT event_key FROM outgoing WHERE status='pending')").bind(cutoff),
    ]);
  }
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-api.mjs
class TelegramError extends Error {
  constructor(code,description="Telegram API error",parameters={}) {super(String(description).replace(/\d+:[A-Za-z0-9_-]{20,}/g,"[REDACTED]"));this.code=code;this.parameters=parameters;}
}
class Telegram {
  constructor(token,fetcher=fetch) {this.token=token;this.fetcher=fetcher;}
  async call(method,payload={}) {
    if(!/^[a-zA-Z]+$/.test(method))throw Error("Invalid method");
    let body,headers;
    if(payload.__document!==undefined) {
      const {__document,__filename="hadaba-backup.json",...fields}=payload;
      if(!/^[a-zA-Z0-9_.-]+$/.test(__filename))throw Error("Invalid filename");
      body=new FormData();for(const [k,v]of Object.entries(fields))body.append(k,typeof v==="object"?JSON.stringify(v):String(v));
      body.append("document",new Blob([__document],{type:"application/json"}),__filename);headers={};
    } else {body=JSON.stringify(payload);headers={"Content-Type":"application/json"};}
    let response;
    try{response=await this.fetcher(`https://api.telegram.org/bot${this.token}/${method}`,{method:"POST",headers,body,signal:AbortSignal.timeout(12000)});}catch{throw new TelegramError(0,"تعذر الاتصال بتليجرام.");}
    let result;try{result=await response.json();}catch{throw new TelegramError(response.status>=400?response.status:502);}
    if(!result?.ok)throw new TelegramError(result?.error_code??response.status??502,result?.description,result?.parameters);
    return result.result;
  }
  async download(fileId) {
    const file=await this.call("getFile",{file_id:fileId});
    if(!/^[A-Za-z0-9_./-]+$/.test(file.file_path??"")||file.file_path.includes("..")||file.file_size>1500000)throw new TelegramError(400,"ملف النسخة غير صالح أو كبير جدًا.");
    let response;try{response=await this.fetcher(`https://api.telegram.org/file/bot${this.token}/${file.file_path}`,{signal:AbortSignal.timeout(12000)});}catch{throw new TelegramError(0,"تعذر تحميل النسخة.");}
    if(!response.ok)throw new TelegramError(response.status,"تعذر تحميل النسخة.");
    const reader=response.body.getReader(),chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1500000){await reader.cancel();throw new TelegramError(400,"النسخة كبيرة جدًا.");}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  }
}
function secretMatches(a,b) {
  if(typeof a!=="string"||typeof b!=="string"||!b||a.length!==b.length||a.length>512)return false;
  let diff=0;for(let i=0;i<b.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}

;// CONCATENATED MODULE: ./handover_pkg/Hadaba_Project_Handover_2026-10-14/source/lib/hadaba-service.mjs



class Service {
  constructor(repository,telegram,config) {this.repo=repository;this.api=telegram;this.config=config;}
  async ingest(update) {
    if(!Number.isSafeInteger(update?.update_id)||update.update_id<0)throw Error("Invalid update");
    const key=String(update.update_id);
    await this.repo.process(key,state=>new Engine(state,this.config).run(update));
    if(update.update_id%100===0)await this.repo.cleanup();
    return this.flush(key);
  }
  async flush(eventKey) {
    for(let turn=0;turn<12;turn++) {
      const pending=await this.repo.pending();if(!pending.length)return {complete:true};
      const action=pending[0];
      if(action.next_attempt>Date.now()||action.lease_until>Date.now())return {complete:!await this.repo.eventPending(eventKey),retryMs:Math.max(1000,action.next_attempt-Date.now(),action.lease_until-Date.now())};
      const lease=await this.repo.claim(action.id);if(!lease)return {complete:false,retryMs:1000};
      const data=JSON.parse(action.payload);
      try {
        if(action.method==="__import") {
          const raw=await this.api.download(data.file_id);
          await this.repo.process("import:"+data.jobKey,s=>new Engine(s,this.config).prepareRestore(data.user_id,data.jobKey,raw));
        } else await this.api.call(action.method,data);
        await this.repo.finish(action.id,lease);
      } catch(e) {
        if(e instanceof TelegramError&&e.code===429) {const delay=Math.max(1000,Number(e.parameters.retry_after??5)*1000)+200;await this.repo.retry(action.id,lease,delay);return {complete:false,retryMs:delay};}
        if(e instanceof TelegramError&&e.parameters.migrate_to_chat_id&&data.chat_id) {
          const next=e.parameters.migrate_to_chat_id;
          await this.repo.process("migrate:"+action.id,s=>{const engine=new Engine(s,this.config);engine.migrate(data.chat_id,next);return engine.plan();});
          data.chat_id=next;
          await this.repo.db.prepare("UPDATE outgoing SET payload=? WHERE id=? AND lease_key=?").bind(JSON.stringify(data),action.id,lease).run();
          await this.repo.retry(action.id,lease,1000);return {complete:false,retryMs:1000};
        }
        if(e instanceof TelegramError&&[400,403,404].includes(e.code)) {
          if(action.method==="__import")await this.repo.process("import:"+data.jobKey,s=>new Engine(s,this.config).prepareRestore(data.user_id,data.jobKey,null,"تعذر قراءة النسخة. أرسل ملف JSON صالحًا صادرًا من هضبة."));
          // A permanently rejected message is recorded, avoiding endless webhook retries.
          await this.repo.finish(action.id,lease,e.code===400&&e.message.includes("message is not modified")?"delivered":"rejected");
        } else {
          const delay=Math.min(60000,1000*2**Math.min(action.attempts,6));
          await this.repo.retry(action.id,lease,delay);return {complete:false,retryMs:delay};
        }
      }
    }
    return {complete:!await this.repo.eventPending(eventKey),retryMs:1000};
  }
}

;// CONCATENATED MODULE: ./worker_main.mjs





const SEED_DATA_JSON = '{"owner":7783223515,"buttons":[{"id":2,"label":"التعريف بالمسار الاساسي ( المبكر)","key":"التعريف بالمسار الاساسي ( المبكر)","method":"sendPhoto","payload":{"photo":"AgACAgQAAxkBAAMkas4LcCP7Yb1reNvLFKf6s5ZEXgsAAvAOaxv30WlRcNqvhuptZRQBAAMCAAN5AAM9BA"},"inlineKeyboard":[[{"text":"المعلومات 📰","url":"https://t.me/KFUPM27z/32","style":"primary"},{"text":"الموزونات🛍","url":"https://t.me/KFUPMzJabal/835","style":"primary"}],[{"text":"تجارب التحصيلي المبكر 💎","url":"https://t.me/KFUPMzJabal/1278","style":"primary"}],[{"text":"مجموعات المسار الأساسي 😍","url":"https://t.me/KFUPMzJabal/1326","style":"primary"}]],"enabled":false,"position":0,"revision":2,"scope":"private"},{"id":4,"label":"التعريف بالمسار الاساسي ( المبكر)","key":"التعريف بالمسار الاساسي ( المبكر)","method":"sendPhoto","payload":{"photo":"AgACAgQAAxkBAAMkas4LcCP7Yb1reNvLFKf6s5ZEXgsAAvAOaxv30WlRcNqvhuptZRQBAAMCAAN5AAM9BA"},"inlineKeyboard":[[{"text":"المعلومات 📰","url":"https://t.me/KFUPM27z/32","style":"primary"},{"text":"الموزونات🛍","url":"https://t.me/KFUPMzJabal/835","style":"primary"}],[{"text":"تجارب التحصيلي المبكر 💎","url":"https://t.me/KFUPMzJabal/1278","style":"primary"}],[{"text":"مجموعات المسار الأساسي 😍","url":"https://t.me/KFUPMzJabal/1326","style":"primary"}]],"enabled":true,"position":0,"revision":4,"scope":"-1004475356304","menuPlacement":{"rowSize":1}},{"id":5,"scope":"-1004475356304","label":"معلومات عن الترقية","key":"معلومات عن الترقية","method":"sendMessage","payload":{"text":"اختر من الروابط التالية 👇"},"inlineKeyboard":[[{"text":"الترقية 💎","url":"https://t.me/KFUPMzQabool/81?single","style":"primary"}]],"enabled":true,"position":1,"revision":3},{"id":6,"scope":"-1004475356304","label":"موزونة","key":"موزونة","method":"sendMessage","payload":{"text":"• طريقة حساب الموزونة  🧮\\n\\n\\nحساب موزونة المسار الأساسي ( المبكر ):\\n\\n50% قدرات\\n50% تحصيلي مبكر\\n\\nحساب موزونة المسار الإلحاقي ( الشواغر ):\\n\\n50% قدرات\\n40% تحصيلي إعتيادي\\n10% المعدل التراكمي للثانوية\\n\\nملاحظة❗:  كلاهما يشترط اجتياز اختبار اللغة ( ستيب +65، دولينجو +80، آيلتس +4.5، توفل +3 )","entities":[{"offset":0,"length":25,"type":"bold"},{"offset":28,"length":38,"type":"bold"},{"offset":68,"length":9,"type":"bold"},{"offset":78,"length":15,"type":"bold"},{"offset":95,"length":40,"type":"bold"},{"offset":137,"length":9,"type":"bold"},{"offset":147,"length":18,"type":"bold"},{"offset":166,"length":28,"type":"bold"},{"offset":196,"length":89,"type":"bold"}]},"inlineKeyboard":[[{"text":"الحاسبة 🧮","url":"https://kfupm.online/","style":"primary"}]],"enabled":true,"position":2,"revision":3},{"id":7,"scope":"-1004475356304","label":"مسار السات","key":"مسار السات","method":"sendPhoto","payload":{"photo":"AgACAgQAAxkBAAPxas6NcKo8WDPEmsLwuuSXlOD0_YgAAiAQaxtcbUhRJVJ-A6HjfOABAAMCAAN5AAM9BA","caption":"SAT Track｜مسار السات","caption_entities":[{"offset":0,"length":20,"type":"bold"}]},"inlineKeyboard":[[{"text":"المعلومات 😍","url":"https://t.me/KFUPMzJabal/806","style":"primary"},{"text":"المجموعة 😍","url":"https://t.me/ice_SAT","style":"primary"}]],"enabled":true,"position":3,"revision":1}],"nextId":8,"admins":{"828711328":"كوثر","6084494785":"."},"groups":{"-1004475356304":"تجربة"},"sessions":{},"pages":{},"cooldowns":{},"counts":{"2":16,"4":11,"5":9,"6":9},"columns":1,"collections":{"private":{"title":"الخاص / الردود المحفوظة","columns":1,"revision":2},"-1004475356304":{"title":"تجربة","columns":3,"revision":9,"sections":[]}},"schemaVersion":3,"adminScopes":{"828711328":["-1004475356304"],"6084494785":["-1004475356304"]},"adminVersions":{"828711328":2,"6084494785":4},"nextAdminVersion":5}';


async function initDatabase(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS bot_state (id integer PRIMARY KEY NOT NULL, version integer DEFAULT 0 NOT NULL, data text NOT NULL, commit_key text DEFAULT '' NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS outgoing (id text PRIMARY KEY NOT NULL, event_key text NOT NULL, sequence integer NOT NULL, method text NOT NULL, payload text NOT NULL, status text DEFAULT 'pending' NOT NULL, attempts integer DEFAULT 0 NOT NULL, next_attempt integer DEFAULT 0 NOT NULL, lease_until integer DEFAULT 0 NOT NULL, lease_key text, created_at integer NOT NULL)"),
    db.prepare("CREATE INDEX IF NOT EXISTS outgoing_event ON outgoing (event_key, status, sequence)"),
    db.prepare("CREATE TABLE IF NOT EXISTS processed_events (event_key text PRIMARY KEY NOT NULL, created_at integer NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS snapshots (id text PRIMARY KEY NOT NULL, data text NOT NULL, created_at integer NOT NULL)")
  ]);
  
  // Ensure the live seed data is present (restore buttons and owner 7783223515)
  const row = await db.prepare("SELECT data FROM bot_state WHERE id=1").first();
  let needSeed = true;
  if (row && row.data) {
    try {
      const parsed = JSON.parse(row.data);
      if (parsed.owner === 7783223515 && Array.isArray(parsed.buttons) && parsed.buttons.length > 0) {
        needSeed = false;
      }
    } catch {}
  }
  if (needSeed) {
    await db.prepare("INSERT OR REPLACE INTO bot_state(id,version,data,commit_key) VALUES(1,0,?,'')").bind(SEED_DATA_JSON).run();
  }
}

/* harmony default export */ const worker_main = ({
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Debug & Webhook diagnostic endpoint
    if (url.pathname === "/debug" || url.pathname === "/status") {
      if (!env.BOT_TOKEN) return new Response(JSON.stringify({ error: "Missing BOT_TOKEN" }), { status: 500, headers: { "Content-Type": "application/json" } });
      if (!env.DB) return new Response(JSON.stringify({ error: "Missing DB binding" }), { status: 500, headers: { "Content-Type": "application/json" } });
      
      await initDatabase(env.DB);
      const stateRow = await env.DB.prepare("SELECT version, data FROM bot_state WHERE id=1").first();
      let state = {};
      try { state = JSON.parse(stateRow?.data || "{}"); } catch {}
      
      const outgoingPending = await env.DB.prepare("SELECT count(*) as cnt FROM outgoing WHERE status='pending'").first();
      const processedCount = await env.DB.prepare("SELECT count(*) as cnt FROM processed_events").first();
      
      const tgRes = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/getWebhookInfo");
      const tgInfo = await tgRes.json();
      
      return new Response(JSON.stringify({
        status: "OK",
        bot_owner: state.owner,
        buttons_count: state.buttons?.length || 0,
        admins: Object.keys(state.admins || {}),
        groups: state.groups,
        outgoing_pending: outgoingPending?.cnt || 0,
        processed_events: processedCount?.cnt || 0,
        telegram_webhook: tgInfo
      }, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }
    
    if (request.method === "GET") {
      if (url.pathname === "/setup-webhook") {
        if (!env.BOT_TOKEN) return new Response("Missing BOT_TOKEN", { status: 400 });
        const webhookUrl = url.origin + "/api/telegram/webhook";
        const tgRes = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/setWebhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl, drop_pending_updates: false })
        });
        const tgJson = await tgRes.json();
        return new Response(JSON.stringify({ webhookUrl, telegram_response: tgJson }, null, 2), {
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
      
      return new Response(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>بوت هضبة</title></head><body style="font-family:system-ui;text-align:center;padding:40px;line-height:1.8;background:#f8fafc;"><h1>🌄 خادم بوت «ردود هَضَبَة» يعمل بنجاح!</h1><p>الخادم السحابي نشط على Cloudflare ومتصل بقاعدة بيانات D1 ومستودع GitHub.</p><div style="margin:30px 0;"><a href="/setup-webhook" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">⚡️ تفعيل وربط الويب هوك مع تليجرام</a></div><p style="color:#64748b;font-size:14px;"><a href="/debug">🔍 فحص تشخيصي لحالة البوت وقاعدة البيانات</a></p></body></html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    
    if (request.method === "POST") {
      if (!env.BOT_TOKEN || !env.DB) return new Response("Not configured", { status: 500 });
      
      try {
        await initDatabase(env.DB);
      } catch (dbErr) {
        console.error("InitDatabase error:", dbErr);
      }
      
      const raw = await request.text();
      let update;
      try { update = JSON.parse(raw); } catch { return new Response("Invalid JSON", { status: 400 }); }
      if (!update || typeof update.update_id !== "number") return new Response("Invalid update", { status: 400 });
      
      const repo = new Repository(env.DB, 7783223515);
      const api = new Telegram(env.BOT_TOKEN);
      const config = { username: "KFUMP26_BOT", claimCode: "" };
      const service = new Service(repo, api, config);
      
      try {
        const result = await service.ingest(update);
        return new Response(result.complete ? "OK" : "Retry", { status: result.complete ? 200 : 503 });
      } catch (err) {
        console.error("Ingest error:", err);
        return new Response("OK", { status: 200 });
      }
    }
    
    return new Response("Method Not Allowed", { status: 405 });
  }
});

var __webpack_exports__default = __webpack_exports__.Z;
export { __webpack_exports__default as default };
