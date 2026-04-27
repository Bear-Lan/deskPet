import type { PetState } from '../constants/config';

// 状态对应的动画资源
const STATE_ANIMATIONS: Record<PetState, string> = {
  eating: '/eating.gif',
  happy: '/happy.gif',
  sleeping: '/sleeping.png',
  sad: '/sad.gif',
  fuck: '/fuck.gif',
  crazy: '/crazy.gif',
  '摔倒': '/摔倒.gif',
};

// 根据状态获取当前动画
export const getAnimation = (state: PetState): string => {
  return STATE_ANIMATIONS[state];
};