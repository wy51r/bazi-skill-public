const { Solar, LunarUtil } = require('lunar-javascript');

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ELEMENT_KEYS = { 木: 'wood', 火: 'fire', 土: 'earth', 金: 'metal', 水: 'water' };
const ELEMENT_CN = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
const TEN_GODS = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];

const KNOWN_LONGITUDES = {
  北京: 116.4074,
  上海: 121.4737,
  广州: 113.2644,
  深圳: 114.0579,
  杭州: 120.1551,
  南京: 118.7969,
  苏州: 120.5853,
  合肥: 117.2272,
  天津: 117.2000,
  重庆: 106.5516,
  成都: 104.0668,
  西安: 108.9398,
  武汉: 114.3055,
  长沙: 112.9388,
  郑州: 113.6254,
  济南: 117.1201,
  青岛: 120.3826,
  福州: 119.2965,
  厦门: 118.0894,
  昆明: 102.8329,
  南宁: 108.3669,
  贵阳: 106.6302,
  南昌: 115.8582,
  太原: 112.5492,
  石家庄: 114.5149,
  沈阳: 123.4315,
  大连: 121.6147,
  长春: 125.3235,
  哈尔滨: 126.5349,
  呼和浩特: 111.7492,
  兰州: 103.8343,
  银川: 106.2309,
  西宁: 101.7782,
  乌鲁木齐: 87.6168,
  拉萨: 91.1322,
  海口: 110.1983,
  香港: 114.1694,
  澳门: 113.5439,
  台北: 121.5654,
  Hefei: 117.2272,
  Beijing: 116.4074,
  Shanghai: 121.4737,
  Guangzhou: 113.2644,
  Shenzhen: 114.0579,
  Hangzhou: 120.1551,
  Nanjing: 118.7969,
  Suzhou: 120.5853,
  Chengdu: 104.0668,
  Chongqing: 106.5516,
  Wuhan: 114.3055,
  Xian: 108.9398,
};

const STEM_YINYANG = {
  甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳',
  己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴',
};

const SEASON_BY_JIE = {
  立春: ['春', '孟春'], 惊蛰: ['春', '仲春'], 清明: ['春', '季春'],
  立夏: ['夏', '孟夏'], 芒种: ['夏', '仲夏'], 小暑: ['夏', '季夏'],
  立秋: ['秋', '孟秋'], 白露: ['秋', '仲秋'], 寒露: ['秋', '季秋'],
  立冬: ['冬', '孟冬'], 大雪: ['冬', '仲冬'], 小寒: ['冬', '季冬'],
};

const MONTH_COMMAND_BRANCH_BY_JIE = {
  立春: '寅', 惊蛰: '卯', 清明: '辰',
  立夏: '巳', 芒种: '午', 小暑: '未',
  立秋: '申', 白露: '酉', 寒露: '戌',
  立冬: '亥', 大雪: '子', 小寒: '丑',
};

const STEM_COMBINATIONS = {
  甲己: ['甲己合', '土'], 己甲: ['甲己合', '土'],
  乙庚: ['乙庚合', '金'], 庚乙: ['乙庚合', '金'],
  丙辛: ['丙辛合', '水'], 辛丙: ['丙辛合', '水'],
  丁壬: ['丁壬合', '木'], 壬丁: ['丁壬合', '木'],
  戊癸: ['戊癸合', '火'], 癸戊: ['戊癸合', '火'],
};

const BRANCH_COMBINATIONS = {
  子丑: ['子丑合', '土'], 丑子: ['子丑合', '土'],
  寅亥: ['寅亥合', '木'], 亥寅: ['寅亥合', '木'],
  卯戌: ['卯戌合', '火'], 戌卯: ['卯戌合', '火'],
  辰酉: ['辰酉合', '金'], 酉辰: ['辰酉合', '金'],
  巳申: ['巳申合', '水'], 申巳: ['巳申合', '水'],
  午未: ['午未合', '土'], 未午: ['午未合', '土'],
};

const BRANCH_CLASHES = {
  子午: '子午冲', 午子: '子午冲',
  丑未: '丑未冲', 未丑: '丑未冲',
  寅申: '寅申冲', 申寅: '寅申冲',
  卯酉: '卯酉冲', 酉卯: '卯酉冲',
  辰戌: '辰戌冲', 戌辰: '辰戌冲',
  巳亥: '巳亥冲', 亥巳: '巳亥冲',
};

const BRANCH_HARMS = {
  子未: '子未害', 未子: '子未害',
  丑午: '丑午害', 午丑: '丑午害',
  寅巳: '寅巳害', 巳寅: '寅巳害',
  卯辰: '卯辰害', 辰卯: '卯辰害',
  申亥: '申亥害', 亥申: '申亥害',
  酉戌: '酉戌害', 戌酉: '酉戌害',
};

const BRANCH_BREAKS = {
  子酉: '子酉破', 酉子: '子酉破',
  丑辰: '丑辰破', 辰丑: '丑辰破',
  寅亥: '寅亥破', 亥寅: '寅亥破',
  卯午: '卯午破', 午卯: '卯午破',
  巳申: '巳申破', 申巳: '巳申破',
  未戌: '未戌破', 戌未: '未戌破',
};

const THREE_HARMONIES = [
  { branches: ['申', '子', '辰'], element: '水', type: '申子辰三合水局' },
  { branches: ['亥', '卯', '未'], element: '木', type: '亥卯未三合木局' },
  { branches: ['寅', '午', '戌'], element: '火', type: '寅午戌三合火局' },
  { branches: ['巳', '酉', '丑'], element: '金', type: '巳酉丑三合金局' },
];

const THREE_MEETINGS = [
  { branches: ['寅', '卯', '辰'], element: '木', type: '寅卯辰三会木方' },
  { branches: ['巳', '午', '未'], element: '火', type: '巳午未三会火方' },
  { branches: ['申', '酉', '戌'], element: '金', type: '申酉戌三会金方' },
  { branches: ['亥', '子', '丑'], element: '水', type: '亥子丑三会水方' },
];

function splitGanZhi(ganZhi) {
  if (!ganZhi) return { stem: '', branch: '' };
  return { stem: ganZhi.slice(0, 1), branch: ganZhi.slice(1, 2) };
}

function formatDateTime(parts) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}+08:00`;
}

function dayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86400000) + 1;
}

function equationOfTimeMinutes(year, month, day) {
  const n = dayOfYear(year, month, day);
  const b = (2 * Math.PI * (n - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function resolveLongitude(location, longitude) {
  if (longitude !== undefined && longitude !== null && longitude !== '') {
    const parsed = Number(longitude);
    if (Number.isFinite(parsed)) return parsed;
    throw new Error(`Invalid longitude: ${longitude}.`);
  }
  if (!location) return null;
  for (const [name, value] of Object.entries(KNOWN_LONGITUDES)) {
    if (String(location).includes(name)) return value;
  }
  return null;
}

function applyTrueSolarTime({ year, month, day, hour, minute, second, location, longitude, standardMeridian }) {
  const resolvedLongitude = resolveLongitude(location, longitude);
  if (resolvedLongitude === null) {
    throw new Error('True solar time requires --longitude or a recognized city name in --location.');
  }

  const eot = equationOfTimeMinutes(year, month, day);
  const longitudeCorrection = (resolvedLongitude - standardMeridian) * 4;
  const totalCorrection = longitudeCorrection + eot;
  const originalMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const adjusted = new Date(originalMs + Math.round(totalCorrection * 60 * 1000));

  return {
    corrected: {
      year: adjusted.getUTCFullYear(),
      month: adjusted.getUTCMonth() + 1,
      day: adjusted.getUTCDate(),
      hour: adjusted.getUTCHours(),
      minute: adjusted.getUTCMinutes(),
      second: adjusted.getUTCSeconds(),
    },
    details: {
      enabled: true,
      longitude: resolvedLongitude,
      standard_meridian: standardMeridian,
      longitude_correction_minutes: Number(longitudeCorrection.toFixed(2)),
      equation_of_time_minutes: Number(eot.toFixed(2)),
      total_correction_minutes: Number(totalCorrection.toFixed(2)),
    },
  };
}

function sexToLibraryGender(gender) {
  if (['male', '男', 'm', 'M', 1, '1'].includes(gender)) return 1;
  if (['female', '女', 'f', 'F', 0, '0'].includes(gender)) return 0;
  throw new Error(`Unsupported gender: ${gender}. Use male/female or 男/女.`);
}

function normalizeGender(gender) {
  return sexToLibraryGender(gender) === 1 ? 'male' : 'female';
}

function tenGod(dayStem, otherStem) {
  if (!dayStem || !otherStem) return '';
  return LunarUtil.SHI_SHEN[`${dayStem}${otherStem}`] || '';
}

function hiddenStems(branch) {
  return LunarUtil.ZHI_HIDE_GAN[branch] || [];
}

function elementOfStem(stem) {
  return LunarUtil.WU_XING_GAN[stem] || '';
}

function elementOfBranch(branch) {
  return LunarUtil.WU_XING_ZHI[branch] || '';
}

function buildPillar(ganZhi, tenGodName, naYin) {
  const { stem, branch } = splitGanZhi(ganZhi);
  return {
    stem,
    branch,
    stem_yinyang: STEM_YINYANG[stem] || '',
    stem_element: elementOfStem(stem),
    branch_element: elementOfBranch(branch),
    hidden_stems: hiddenStems(branch),
    ten_god: tenGodName || '',
    nayin: naYin || '',
  };
}

function groupTenGods(dayStem, stems) {
  const grouped = Object.fromEntries(TEN_GODS.map((name) => [name, []]));
  for (const stem of stems.filter(Boolean)) {
    const god = tenGod(dayStem, stem);
    if (god) grouped[god].push(stem);
  }
  return grouped;
}

function dayDiff(fromSolar, toSolar) {
  return Math.round(toSolar.subtract(fromSolar));
}

function buildSolarTerms(lunar, solar) {
  const prevJie = lunar.getPrevJie();
  const nextJie = lunar.getNextJie();
  const monthJie = prevJie.getName();
  const [season = '', monthPhase = ''] = SEASON_BY_JIE[monthJie] || [];
  return {
    month_jieqi: monthJie,
    next_jieqi: nextJie.getName(),
    days_from_previous_jieqi: dayDiff(prevJie.getSolar(), solar),
    days_to_next_jieqi: dayDiff(solar, nextJie.getSolar()),
    season,
    month_phase: monthPhase,
    month_command_branch: MONTH_COMMAND_BRANCH_BY_JIE[monthJie] || lunar.getMonthZhiExact(),
  };
}

function scoreState(score) {
  if (score >= 32) return '极旺';
  if (score >= 24) return '偏旺';
  if (score >= 16) return '有力';
  if (score >= 9) return '偏弱';
  return '弱';
}

function buildFiveElements(pillars, monthCommandBranch) {
  const result = {
    wood: { score: 0, roots: [], visible_stems: [], comments: '' },
    fire: { score: 0, roots: [], visible_stems: [], comments: '' },
    earth: { score: 0, roots: [], visible_stems: [], comments: '' },
    metal: { score: 0, roots: [], visible_stems: [], comments: '' },
    water: { score: 0, roots: [], visible_stems: [], comments: '' },
  };

  for (const [position, pillar] of Object.entries(pillars)) {
    const stemElement = ELEMENT_KEYS[pillar.stem_element];
    const branchElement = ELEMENT_KEYS[pillar.branch_element];
    if (stemElement) {
      result[stemElement].score += 10;
      result[stemElement].visible_stems.push(pillar.stem);
    }
    if (branchElement) {
      result[branchElement].score += 12;
      result[branchElement].roots.push(`${position}:${pillar.branch}`);
    }
    for (const h of pillar.hidden_stems) {
      const hiddenElement = ELEMENT_KEYS[elementOfStem(h)];
      if (hiddenElement) {
        result[hiddenElement].score += 3;
        result[hiddenElement].roots.push(`${pillar.branch}藏${h}`);
      }
    }
  }

  const commandElement = ELEMENT_KEYS[elementOfBranch(monthCommandBranch)];
  if (commandElement) result[commandElement].score += 10;

  for (const key of Object.keys(result)) {
    result[key].score = Math.round(result[key].score);
    result[key].state = scoreState(result[key].score);
    result[key].comments = `${ELEMENT_CN[key]}分数为转换器工程化估算，用于辅助 skill 判读；正式产品可替换为自定义旺衰算法。`;
  }
  return result;
}

function branchLabel(position, branch) {
  const names = { year: '年支', month: '月支', day: '日支', hour: '时支' };
  return `${names[position] || position}${branch}`;
}

function buildRelations(pillars) {
  const stemEntries = Object.entries(pillars).map(([pos, p]) => [pos, p.stem]);
  const branchEntries = Object.entries(pillars).map(([pos, p]) => [pos, p.branch]);

  const stem_combinations = [];
  const branch_combinations = [];
  const branch_clashes = [];
  const branch_harms = [];
  const branch_breaks = [];
  const branch_punishments = [];

  for (let i = 0; i < stemEntries.length; i += 1) {
    for (let j = i + 1; j < stemEntries.length; j += 1) {
      const [aPos, a] = stemEntries[i];
      const [bPos, b] = stemEntries[j];
      const combo = STEM_COMBINATIONS[`${a}${b}`];
      if (combo) {
        stem_combinations.push({
          pair: [`${aPos}:${a}`, `${bPos}:${b}`],
          type: combo[0],
          transform_element: combo[1],
          is_transformed: false,
          reason: '转换器仅标注合象，不自动判定化局成立；交由 skill 按月令和全局裁决。',
        });
      }
    }
  }

  for (let i = 0; i < branchEntries.length; i += 1) {
    for (let j = i + 1; j < branchEntries.length; j += 1) {
      const [aPos, a] = branchEntries[i];
      const [bPos, b] = branchEntries[j];
      const pair = `${a}${b}`;
      const labels = [branchLabel(aPos, a), branchLabel(bPos, b)];
      if (BRANCH_COMBINATIONS[pair]) {
        const [type, element] = BRANCH_COMBINATIONS[pair];
        branch_combinations.push({
          pair: labels,
          type,
          transform_element: element,
          is_transformed: false,
          reason: '转换器仅标注六合，不自动判定化局成立。',
        });
      }
      if (BRANCH_CLASHES[pair]) {
        branch_clashes.push({
          pair: labels,
          type: BRANCH_CLASHES[pair],
          effect: '地支相冲，主对应宫位和藏干所代表事项被引动。',
        });
      }
      if (BRANCH_HARMS[pair]) {
        branch_harms.push({ pair: labels, type: BRANCH_HARMS[pair], effect: '地支相害，主暗耗、牵制或关系不顺。' });
      }
      if (BRANCH_BREAKS[pair]) {
        branch_breaks.push({ pair: labels, type: BRANCH_BREAKS[pair], effect: '地支相破，主结构破损、关系失衡或计划反复。' });
      }
    }
  }

  const counts = branchEntries.reduce((acc, [, branch]) => {
    acc[branch] = (acc[branch] || 0) + 1;
    return acc;
  }, {});
  for (const [branch, count] of Object.entries(counts)) {
    if (count >= 2) branch_punishments.push({ branches: [branch, branch], type: `${branch}${branch}自刑`, effect: '同支重复，自刑取象，主该支所涉事项反复内耗。' });
  }

  const branchSet = new Set(branchEntries.map(([, branch]) => branch));
  const three_harmonies = THREE_HARMONIES
    .filter((item) => item.branches.every((b) => branchSet.has(b)))
    .map((item) => ({ ...item, is_complete: true }));
  const three_meetings = THREE_MEETINGS
    .filter((item) => item.branches.every((b) => branchSet.has(b)))
    .map((item) => ({ ...item, is_complete: true }));

  return {
    stem_combinations,
    branch_combinations,
    branch_clashes,
    branch_punishments,
    branch_harms,
    branch_breaks,
    three_meetings,
    three_harmonies,
  };
}

function buildLuck(eightChar, gender, birthYear, targetStartYear, targetYearCount) {
  const yun = eightChar.getYun(sexToLibraryGender(gender));
  const dayun = yun.getDaYun().map((item) => {
    const { stem, branch } = splitGanZhi(item.getGanZhi());
    return {
      index: item.getIndex(),
      start_year: item.getStartYear(),
      end_year: item.getEndYear(),
      age_range: [item.getStartAge(), item.getEndAge()],
      pillar: item.getGanZhi() || '小运',
      stem,
      branch,
      ten_god_stem: stem ? tenGod(eightChar.getDayGan(), stem) : '',
      hidden_stems: branch ? hiddenStems(branch) : [],
    };
  });

  const targetYears = [];
  for (let y = targetStartYear; y < targetStartYear + targetYearCount; y += 1) {
    const lunar = Solar.fromYmdHms(y, 7, 1, 12, 0, 0).getLunar();
    const gz = lunar.getYearInGanZhiExact();
    targetYears.push({
      year: y,
      age: y - birthYear + 1,
      pillar: gz,
      tai_sui_branch: splitGanZhi(gz).branch,
    });
  }

  const currentYear = targetStartYear;
  const current = dayun.find((item) => item.start_year <= currentYear && item.end_year >= currentYear) || null;

  return {
    start_age: yun.getStartYear() + yun.getStartMonth() / 12 + yun.getStartDay() / 365,
    start_age_note: `lunar-javascript 起运：${yun.getStartYear()}年${yun.getStartMonth()}月${yun.getStartDay()}日${yun.getStartHour()}时。`,
    direction: yun.isForward() ? 'forward' : 'reverse',
    direction_note: '顺逆由 lunar-javascript EightChar.getYun(gender) 计算。',
    dayun,
    current_dayun: current ? {
      start_year: current.start_year,
      end_year: current.end_year,
      age_range: current.age_range,
      pillar: current.pillar,
    } : {},
    target_years: targetYears,
  };
}

function buildBaziJson(input) {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    gender,
    location = 'China, timezone Asia/Shanghai',
    caseId,
    targetStartYear = new Date().getFullYear(),
    targetYearCount = 3,
    calendarType = 'solar',
    useTrueSolarTime = false,
    longitude,
    standardMeridian = 120,
  } = input;

  if (calendarType !== 'solar') throw new Error('This converter currently accepts solar calendar input only.');
  const normalizedGender = normalizeGender(gender);

  const originalDateTime = { year, month, day, hour, minute, second };
  const trueSolar = useTrueSolarTime
    ? applyTrueSolarTime({ ...originalDateTime, location, longitude, standardMeridian })
    : { corrected: originalDateTime, details: { enabled: false } };
  const chartDateTime = trueSolar.corrected;

  const solar = Solar.fromYmdHms(
    chartDateTime.year,
    chartDateTime.month,
    chartDateTime.day,
    chartDateTime.hour,
    chartDateTime.minute,
    chartDateTime.second,
  );
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const dayStem = eightChar.getDayGan();

  const pillars = {
    year: buildPillar(eightChar.getYear(), eightChar.getYearShiShenGan(), eightChar.getYearNaYin()),
    month: buildPillar(eightChar.getMonth(), eightChar.getMonthShiShenGan(), eightChar.getMonthNaYin()),
    day: buildPillar(eightChar.getDay(), '日主', eightChar.getDayNaYin()),
    hour: buildPillar(eightChar.getTime(), eightChar.getTimeShiShenGan(), eightChar.getTimeNaYin()),
  };

  const solarTerms = buildSolarTerms(lunar, solar);
  const visibleStems = Object.values(pillars).map((p) => p.stem);
  const allHiddenStems = Object.values(pillars).flatMap((p) => p.hidden_stems);

  return {
    schema_version: 'bazi.input.v1',
    meta: {
      case_id: caseId || `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}-${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}-${normalizedGender}`,
      calendar_type: 'solar',
      birth_datetime: formatDateTime(originalDateTime),
      chart_datetime: formatDateTime(chartDateTime),
      gender: normalizedGender,
      location,
      true_solar_time: trueSolar.details,
      notes: `四柱、大运、流年由 lunar-javascript 计算；${useTrueSolarTime ? '已按真太阳时校正后的 chart_datetime 排盘；' : '未启用真太阳时校正；'}五行评分与冲合刑害由 bazi-json-builder 工程化转换器生成，建议上线前按自家排盘规则复核。`,
    },
    pillars,
    day_master: {
      stem: dayStem,
      element: elementOfStem(dayStem),
      yinyang: STEM_YINYANG[dayStem] || '',
    },
    solar_terms: solarTerms,
    five_elements: buildFiveElements(pillars, solarTerms.month_command_branch),
    relations: buildRelations(pillars),
    ten_gods: {
      visible: groupTenGods(dayStem, visibleStems),
      hidden: groupTenGods(dayStem, allHiddenStems),
    },
    luck: buildLuck(eightChar, normalizedGender, year, targetStartYear, targetYearCount),
    analysis_options: {
      style: '明确断法',
      style_profile: 'auto',
      include_source_lenses: true,
      include_disagreement_notes: true,
      generate_mingshu: true,
      source_note: '排盘来自 lunar-javascript；强弱评分为转换器估算，供 skill 生成命书时参考。',
    },
  };
}

module.exports = { buildBaziJson };
