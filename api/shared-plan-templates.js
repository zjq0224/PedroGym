// Plans bundled with the server itself. Unlike user-published snapshots these do not live in
// db.json, so every existing and future profile sees the same curated template immediately after
// an upgrade. The ids are stable because links to a template may be bookmarked.

const ex = (id, sets, reps, config = {}) => ({
  id, sets, reps, weight: 0, ...config, mediaPack: 'tanchengyi',
});

export const BUILTIN_SHARED_PLANS = [{
  id: 'template-tanchengyi-three-split-2026',
  title: '谭成义三分化＋腹部',
  summary: '谭成义的推、拉、腿与腹部训练，共 4 个训练日、18 个动作；添加后可自由调整组数、重量和排期。',
  owner: { id: 'opengym', name: 'openGym · 谭成义' },
  template: true,
  builtin: true,
  created: '2026-11-06T00:00:00.000Z',
  updated: '2026-11-06T00:00:00.000Z',
  bundle: {
    opengym_plan: 1,
    exported: '2026-11-06',
    name: '谭成义三分化＋腹部',
    unit: 'kg',
    week: {
      1: ['tcy-push'],
      2: ['tcy-pull'],
      3: ['tcy-legs'],
      5: ['tcy-abs'],
    },
    routines: [
      {
        id: 'tcy-push', name: '谭成义 · 推日', emoji: 'barbell',
        ex: [
          ex('0025', 4, 15, { pyramid: [15, 12, 10, 8], warmupSets: 3, note: 'RPE 8，保留约 2 次余力；按周期逐步压低次数并提高重量。' }),
          ex('0314', 4, 12, { dbLoad: 'each', prog: 'off', note: '上斜凳约 30°，先保持肩胛稳定，再逐步提高末组强度。' }),
          ex('0251', 4, 12, { prog: 'off', lastToFailure: true, note: '身体略前倾，动作变形前停止；不足 12 次时记录实际次数。' }),
          ex('0061', 4, 15, { prog: 'off', note: '保持肩屈位与肘部稳定，重点训练肱三头肌长头。' }),
          ex('5818', 3, 20, { prog: 'off', lastToFailure: true, note: '沿肩胛面举成 Y 字；10 次后短休约 5 秒，再做 10 次或至技术力竭。' }),
        ],
      },
      {
        id: 'tcy-pull', name: '谭成义 · 拉日', emoji: 'pullup',
        ex: [
          ex('1204', 4, 24, { side: true, prog: 'off', lastToFailure: true, note: '每侧 12 次，保持躯干稳定，末组可在技术稳定时短休追加。' }),
          ex('7583', 4, 10, { repsMin: 8, prog: 'double', inc: 2.5, note: 'RPE 8；完成 4×12 后增加重量并回到 8 次。' }),
          ex('1235', 4, 20, { side: true, prog: 'off', lastToFailure: true, note: '每侧 10 次，胸部保持支撑，避免躯干旋转。' }),
          ex('0218', 4, 12, { prog: 'off', note: '开肘拉向下胸，主动完成肩胛后缩。' }),
          ex('1636', 3, 12, { prog: 'off', note: '保持上臂抬高和固定，专注肱二头肌收缩。' }),
        ],
      },
      {
        id: 'tcy-legs', name: '谭成义 · 腿日', emoji: 'legs',
        ex: [
          ex('1757', 4, 20, { side: true, dbLoad: 'each', prog: 'off', note: '每侧 10 次，先建立单腿稳定与髋铰链控制。' }),
          ex('2290', 4, 20, { side: true, dbLoad: 'each', prog: 'off', note: '每侧 10 次，后脚只作支撑，前腿主动发力。' }),
          ex('0042', 4, 10, { prog: 'linear', inc: 2.5, warmupSets: 3, note: 'RPE 8，不力竭；保持躯干直立和核心稳定。' }),
          ex('0085', 4, 10, { prog: 'linear', inc: 2.5, warmupSets: 3, note: 'RPE 8；杠铃贴身，以髋铰链完成动作。' }),
          ex('0489', 4, 15, { prog: 'off', note: '全程控制，不借惯性甩动；身体回到直线即可。' }),
        ],
      },
      {
        id: 'tcy-abs', name: '谭成义 · 腹部训练', emoji: 'figureStrength',
        ex: [
          ex('3329', 4, 12, { prog: 'off', note: '骨盆和下背贴稳斜垫，先后仰拉长腹肌，再让胸廓向骨盆卷起。' }),
          ex('0472', 4, 12, { prog: 'off', note: '避免摆动，抬腿末端继续轻微卷起骨盆。' }),
          ex('0175', 4, 12, { prog: 'off', note: '髋部保持稳定，让胸廓向骨盆卷曲，不要只做髋部后坐。' }),
        ],
      },
    ],
    customEx: [],
  },
}];
