import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';
import type { Window } from '@tauri-apps/api/window';

type PetState = 'idle' | 'eating' | 'happy' | 'sleeping' | 'dragging';

interface Position {
  x: number;
  y: number;
}

const FOODS = [
  { id: 'apple', emoji: '🍎', name: '苹果' },
  { id: 'dora', emoji: '🧇', name: '铜锣烧' },
  { id: 'candy', emoji: '🍬', name: '糖果' },
  { id: 'fish', emoji: '🐟', name: '鱼' },
] as const;

// 检查是否在Tauri环境中运行
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export default function App() {
  const [petState, setPetState] = useState<PetState>('idle');
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const windowRef = useRef<Window | null>(null);

  // 初始化窗口
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

  // 进入睡眠状态
  useEffect(() => {
    if (petState === 'idle') {
      const timer = setTimeout(() => {
        setPetState('sleeping');
      }, 30000); // 30秒无操作进入睡眠
      setIdleTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [petState]);

  const resetToIdle = useCallback(() => {
    setPetState('idle');
    setShowMenu(false);
  }, []);

  // 播放动画后回到idle
  const playAnimation = useCallback((newState: PetState, duration: number = 2000) => {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    setPetState(newState);
    setTimeout(resetToIdle, duration);
  }, [idleTimer, resetToIdle]);

  // 处理拖拽开始
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只响应左键

    e.preventDefault();

    if (windowRef.current) {
      setIsDragging(true);
      setPetState('dragging');

      const pos = await windowRef.current.outerPosition();
      dragOffset.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      };

      await windowRef.current.startDragging();
    }
  }, []);

  // 处理拖拽结束
  const handleMouseUp = useCallback(async () => {
    if (!isDragging) return;

    setIsDragging(false);

    if (windowRef.current) {
      const pos = await windowRef.current.outerPosition();
      if (isTauri()) {
        invoke('save_position', { x: pos.x, y: pos.y }).catch(console.error);
      }
    }

    if (petState === 'dragging') {
      playAnimation('happy', 500);
    }
  }, [isDragging, petState, playAnimation]);

  // 处理点击
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !isDragging) {
      playAnimation('happy', 1500);
    }
  }, [isDragging, playAnimation]);

  // 处理右键
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
  }, [showMenu]);

  // 投喂
  const handleFeed = useCallback((_foodId: string) => {
    setShowMenu(false);
    playAnimation('eating', 3000);
  }, [playAnimation]);

  // 获取当前动画
  const getCurrentGif = () => {
    switch (petState) {
      case 'eating': return '/eating.gif';
      case 'happy': return '/happy.gif';
      case 'sleeping': return '/sleeping.gif';
      case 'dragging': return '/happy.gif';
      default: return '/idle.gif';
    }
  };

  return (
    <div
      className="pet-container"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        width: '256px',
        height: '256px',
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <img
        src={getCurrentGif()}
        alt="pet"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" font-size="50">🤖</text></svg>';
        }}
      />

      {showMenu && (
        <div
          className="food-menu"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {FOODS.map((food) => (
            <button
              key={food.id}
              onClick={() => handleFeed(food.id)}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{food.emoji}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>{food.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}