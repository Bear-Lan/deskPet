import { useState, useCallback, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';
import type { Window } from '@tauri-apps/api/window';
import type { PetState } from '../constants/config';
import {
  selectRandomState,
  STATE_MESSAGES,
  STATE_DURATIONS,
  HAPPY_MESSAGES,
  EATING_MESSAGES,
} from '../constants/config';

const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

const DOUBLE_CLICK_INTERVAL = 300;

export interface UsePetStateReturn {
  petState: PetState;
  message: string | null;
  isDragging: boolean;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  handleClick: () => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  handleFeed: (foodId: string) => void;
}

// 默认显示 sad 状态
const DEFAULT_STATE: PetState = 'sad';

export function usePetState(): UsePetStateReturn {
  const [petState, setPetState] = useState<PetState>(DEFAULT_STATE);
  const [message, setMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false); // 用 ref 来跟踪拖拽状态
  const windowRef = useRef<Window | null>(null);

  // 初始化
  useEffect(() => {
    if (isTauri()) {
      windowRef.current = getCurrentWindow();
    }
  }, []);

  // 恢复位置
  useEffect(() => {
    if (!isTauri()) return;
    invoke<[number, number]>('load_position').then(([x, y]) => {
      if (x && y && windowRef.current) {
        windowRef.current.setPosition(new PhysicalPosition(x, y));
      }
    }).catch(console.error);
  }, []);

  // 定时随机切换状态
  useEffect(() => {
    const timer = setTimeout(() => {
      const selectedState = selectRandomState();
      const messages = STATE_MESSAGES[selectedState];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setMessage(msg);
      setPetState(selectedState as PetState);
      setTimeout(() => setMessage(null), STATE_DURATIONS[selectedState]);
    }, 10000);

    setIdleTimer(timer);
    return () => clearTimeout(timer);
  }, []); // 移除 petState 依赖，只在挂载时执行一次

  // 播放动画后回到默认状态
  const playAnimation = useCallback((newState: PetState, duration: number = 2000) => {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    setPetState(newState);
    setTimeout(() => {
      setPetState(DEFAULT_STATE);
    }, duration);
  }, [idleTimer]);

  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!windowRef.current) return;

    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);

    const pos = await windowRef.current.outerPosition();
    const startX = e.clientX;
    const startY = e.clientY;
    dragOffset.current = {
      x: startX - pos.x,
      y: startY - pos.y,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !windowRef.current) return;

      // 检查移动距离，只有移动超过 5px 才真正拖动
      const movedX = Math.abs(moveEvent.clientX - startX);
      const movedY = Math.abs(moveEvent.clientY - startY);
      if (movedX < 5 && movedY < 5) return;

      const x = moveEvent.clientX - dragOffset.current.x;
      const y = moveEvent.clientY - dragOffset.current.y;
      windowRef.current.setPosition(new PhysicalPosition(x, y));
    };

    const onMouseUp = async () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      if (windowRef.current) {
        const pos = await windowRef.current.outerPosition();
        invoke('save_position', { x: pos.x, y: pos.y }).catch(console.error);
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleClick = useCallback(() => {
    if (showMenu) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // 双击检测
    if (timeSinceLastClick < DOUBLE_CLICK_INTERVAL && timeSinceLastClick > 0) {
      const msg = HAPPY_MESSAGES[Math.floor(Math.random() * HAPPY_MESSAGES.length)];
      setMessage(msg);
      playAnimation('happy', 2000);
      setTimeout(() => setMessage(null), 2000);
      setLastClickTime(0);
      return;
    }

    setLastClickTime(now);

    // 重置空闲计时器
    if (idleTimer) {
      clearTimeout(idleTimer);
      setIdleTimer(null);
    }
  }, [showMenu, idleTimer, lastClickTime, playAnimation]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
  }, [showMenu]);

  const handleFeed = useCallback((_foodId: string) => {
    setShowMenu(false);
    const msg = EATING_MESSAGES[Math.floor(Math.random() * EATING_MESSAGES.length)];
    setMessage(msg);
    playAnimation('eating', 5000);
    setTimeout(() => setMessage(null), 5000);
  }, [playAnimation]);

  return {
    petState,
    message,
    isDragging,
    showMenu,
    setShowMenu,
    handleClick,
    handleMouseDown,
    handleContextMenu,
    handleFeed,
  };
}