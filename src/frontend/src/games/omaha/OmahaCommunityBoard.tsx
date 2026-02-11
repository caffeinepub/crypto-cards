import { Card, Street } from './types';
import { cardToString, getSuitColor } from './types';

interface OmahaCommunityBoardProps {
  communityCards: Card[];
  street: Street;
}

export default function OmahaCommunityBoard({ communityCards, street }: OmahaCommunityBoardProps) {
  // Determine how many cards to reveal based on street
  const revealCount = street === 'preflop' ? 0 : street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
  
  // Check if we have enough cards to display
  const hasEnoughCards = communityCards.length >= revealCount;
  
  // Always render 5 slots
  const slots = Array.from({ length: 5 }, (_, i) => {
    if (i < revealCount && hasEnoughCards && communityCards[i]) {
      return { revealed: true, card: communityCards[i] };
    }
    return { revealed: false, card: null };
  });

  // Determine label
  let label = 'Community Cards';
  if (street === 'flop') label = 'Flop';
  else if (street === 'turn') label = 'Turn';
  else if (street === 'river') label = 'River';
  else if (street === 'showdown') label = 'Showdown';

  // Show fallback message if cards should be revealed but aren't available
  const shouldShowFallback = revealCount > 0 && !hasEnoughCards;

  return (
    <div className="omaha-board-container">
      <h3 className="text-sm font-semibold mb-3 text-center">{label}</h3>
      {shouldShowFallback ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Community cards are not available</p>
        </div>
      ) : (
        <div className="flex justify-center gap-2">
          {slots.map((slot, idx) => (
            <div key={idx}>
              {slot.revealed && slot.card ? (
                <div
                  className={`playing-card card-revealed w-16 h-20 text-sm ${
                    getSuitColor(slot.card.suit) === 'red' ? 'card-red' : 'card-black'
                  }`}
                >
                  {cardToString(slot.card)}
                </div>
              ) : (
                <div className="card-back w-16 h-20">
                  <div className="card-back-pattern" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
