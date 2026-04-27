// 宠物状态类型
export type PetState = 'eating' | 'happy' | 'sleeping' | 'sad' | 'fuck' | 'crazy' | '摔倒';

// 食物配置
export const FOODS = [
  { id: 'apple', emoji: '🍎', name: '苹果' },
  { id: 'dora', emoji: '🧇', name: '铜锣烧' },
  { id: 'candy', emoji: '🍬', name: '糖果' },
  { id: 'fish', emoji: '🐟', name: '小鱼干' },
] as const;

// 开心消息
export const HAPPY_MESSAGES = [
  '谢谢你！',
  '好开心！',
  '最喜欢你了！',
  '嘿嘿～',
  '太棒了！',
];

// 进食消息
export const EATING_MESSAGES = [
  '真好吃！',
  '好好味！',
  '谢谢招待！',
  '好吃！',
];

// 随机状态的消息
export const STATE_MESSAGES: Record<string, string[]> = {
  sleeping: ['困了...', 'zzZ', '好累...'],
  sad: ['好无聊...', '没人理我', '呜呜...'],
  fuck: ['舒服一下！', '爽！', '芜湖！'],
  crazy: ['哈哈哈哈！', '发疯了！', '耶！'],
  '摔倒': ['哎呀！', '摔倒了...', '好痛...'],
};

// 随机状态的动画时长
export const STATE_DURATIONS: Record<string, number> = {
  sleeping: 8000,
  sad: 3000,
  fuck: 2000,
  crazy: 2000,
  '摔倒': 3000,
};

// 空闲时随机触发的状态（按概率权重）
export const RANDOM_STATES = [
  { state: 'sleeping', weight: 40 },
  { state: 'sad', weight: 20 },
  { state: 'fuck', weight: 10 },
  { state: 'crazy', weight: 10 },
  { state: '摔倒', weight: 20 },
];

// 随机选择状态
export const selectRandomState = (): string => {
  const total = RANDOM_STATES.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * total;
  for (const item of RANDOM_STATES) {
    random -= item.weight;
    if (random <= 0) return item.state;
  }
  return 'sleeping';
};