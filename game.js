export function createDeck() {
  const colors = ["red", "blue", "green", "yellow"];
  const deck = [];

  for (const color of colors) {
    for (let i = 0; i <= 9; i++) {
      deck.push({ color, value: i });
    }
    deck.push({ color, value: "+2" });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "wild" });
  }

  return shuffle(deck);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function canPlay(card, top) {
  if (card.color === "wild") return true;
  return card.color === top.color || card.value === top.value;
}
