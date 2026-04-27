import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';
import type { Window } from '@tauri-apps/api/window';

type PetState = 'idle' | 'eating' | 'happy' | 'sleeping' | 'sad' | 'fuck' | 'crazy' | 'dragging';

interface Position {
  x: number;
  y: number;
}

const FOODS = [
  { id: 'apple', emoji: '🍎', name: '苹果' },
  { id: 'dora', emoji: '🧇', name: '铜锣烧' },
  { id: 'candy', emoji: '🍬', name: '糖果' },
  { id: 'fish', emoji: '🐟', name: '小鱼干' },
] as const;

const HAPPY_MESSAGES = [
  '谢谢你！',
  '好开心！',
  '最喜欢你了！',
  '嘿嘿～',
  '太棒了！',
];

const EATING_MESSAGES = [
  '真好吃！',
  '好好味！',
  '谢谢招待！',
  '好吃！',
];

// 检查是否在Tauri环境中运行
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export default function App() {
  const [petState, setPetState] = useState<PetState>('idle');
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [idleTimer, setIdleTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const windowRef = useRef<Window | null>(null);
  const lastClickTime = useRef<number>(0);

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
      }, 10000); // 30秒无操作进入睡眠
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
    if (e.button !== 0) return; // 只响应左键，右键不处理

    // 检测双击 - 手动触发 happy
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      // 双击触发高兴
      if (!showMenu) {
        const msg = HAPPY_MESSAGES[Math.floor(Math.random() * HAPPY_MESSAGES.length)];
        setMessage(msg);
        playAnimation('happy', 2000);
        setTimeout(() => setMessage(null), 2000);
      }
      lastClickTime.current = 0; // 重置
      return;
    }
    lastClickTime.current = now;

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
  }, [showMenu, playAnimation]);

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

  }, [isDragging, petState, playAnimation]);

  // 处理点击 - 双击触发高兴
  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log('点击', e.type, isDragging, showMenu);
    // 如果投喂菜单打开，不触发点击动画
    if (showMenu) return;
    if (e.button === 0 && !isDragging) {
      const now = Date.now();
      console.log('双击检测', now - lastClickTime.current);
      if (now - lastClickTime.current < 400) {
        // 双击
        console.log('触发双击');
        const msg = HAPPY_MESSAGES[Math.floor(Math.random() * HAPPY_MESSAGES.length)];
        setMessage(msg);
        playAnimation('happy', 2000);
        setTimeout(() => setMessage(null), 2000);
      }
      lastClickTime.current = now;
    }
  }, [isDragging, playAnimation, showMenu]);

  // 处理双击 - 使用 onDoubleClick
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    console.log('双击事件', isDragging, showMenu);
    if (showMenu) return;
    if (e.button === 0 && !isDragging) {
      const msg = HAPPY_MESSAGES[Math.floor(Math.random() * HAPPY_MESSAGES.length)];
      setMessage(msg);
      playAnimation('happy', 2000);
      setTimeout(() => setMessage(null), 2000);
    }
  }, [isDragging, playAnimation, showMenu]);

  // 处理右键
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    console.log('右键点击', showMenu);
    e.preventDefault();
    setShowMenu(!showMenu);
  }, [showMenu]);

  // 投喂
  const handleFeed = useCallback((_foodId: string, e: React.MouseEvent) => {
    e.stopPropagation();  // 阻止事件冒泡
    e.preventDefault();   // 阻止默认行为
    setShowMenu(false);
    const msg = EATING_MESSAGES[Math.floor(Math.random() * EATING_MESSAGES.length)];
    setMessage(msg);
    playAnimation('eating', 5000);
    setTimeout(() => setMessage(null), 5000);
  }, [playAnimation]);

  // 获取当前动画
  const getCurrentGif = () => {
    switch (petState) {
      case 'eating': return '/eating.gif';
      case 'happy': return '/happy.gif';
      case 'sleeping': return '/sleeping.png';
      case 'sad': return '/sad.gif';
      case 'fuck': return '/fuck.gif';
      case 'crazy': return '/crazy.gif';
      default: return '/sad.gif'; // idle 状态复用 happy.gif
    }
  };

  return (
    <div
      className="pet-container"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
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

      {message && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: 'white',
            borderRadius: '12px',
            padding: '6px 12px',
            fontSize: '14px',
            color: '#333',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid #eee',
            whiteSpace: 'nowrap',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {message}
        </div>
      )}

      {showMenu && (
        <div
          className="food-menu"
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '12px',
            minWidth: '180px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            border: '2px solid #f0f0f0',
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <div style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#333',
            marginBottom: '8px',
            fontWeight: '500',
          }}>
            你想给我吃什么呀？
          </div>
          {FOODS.map((food) => (
            <button
              key={food.id}
              onClick={(e) => {
                e.stopPropagation();
                handleFeed(food.id, e);
              }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '18px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <span style={{ fontSize: '24px' }}>{food.emoji}</span>
              <span style={{ fontSize: '15px', color: '#333' }}>{food.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}