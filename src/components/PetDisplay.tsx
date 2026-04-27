import { FOODS } from '../constants/config';
import type { PetState } from '../constants/config';

interface FoodMenuProps {
  onFeed: (foodId: string) => void;
  onClose: () => void;
}

export function FoodMenu({ onFeed, onClose }: FoodMenuProps) {
  return (
    <div
      className="food-menu"
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      onClick={onClose}
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
            onFeed(food.id);
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
  );
}

interface MessageBubbleProps {
  message: string;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
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
  );
}

interface PetImageProps {
  state: PetState;
}

export function PetImage({ state }: PetImageProps) {
  const animations: Record<PetState, string> = {
    eating: '/eating.gif',
    happy: '/happy.gif',
    sleeping: '/sleeping.png',
    sad: '/sad.gif',
    fuck: '/fuck.gif',
    crazy: '/crazy.gif',
    '摔倒': '/摔倒.gif'
  };

  return (
    <img
      src={animations[state]}
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
  );
}