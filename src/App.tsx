import { usePetState } from './hooks/usePetState';
import { FoodMenu, MessageBubble, PetImage } from './components/PetDisplay';

export default function App() {
  const {
    petState,
    message,
    isDragging,
    showMenu,
    setShowMenu,
    handleClick,
    handleMouseDown,
    handleContextMenu,
    handleFeed,
  } = usePetState();

  const handleCloseMenu = () => setShowMenu(false);

  return (
    <div
      className="pet-container"
      onMouseDown={handleMouseDown}
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
      <PetImage state={petState} />

      {message && <MessageBubble message={message} />}

      {showMenu && (
        <FoodMenu onFeed={handleFeed} onClose={handleCloseMenu} />
      )}
    </div>
  );
}