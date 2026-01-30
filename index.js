import express from "express";
import { Server } from "socket.io";
import http from "http";
import { createDeck, canPlay } from "./game.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const games = {};

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", socket => {

  socket.on("createGame", name => {
    const code = genCode();

    games[code] = {
      host: socket.id,
      players: [{ id: socket.id, name, hand: [] }],
      deck: [],
      discard: [],
      turn: 0,
      started: false
    };

    socket.join(code);
    socket.emit("gameCreated", code);
  });

  socket.on("joinGame", ({ code, name }) => {
    const game = games[code];
    if (!game || game.started) return;

    game.players.push({ id: socket.id, name, hand: [] });
    socket.join(code);

    io.to(code).emit("lobbyUpdate", game.players);
  });

  socket.on("startGame", code => {
    const game = games[code];
    if (!game || socket.id !== game.host) return;

    game.deck = createDeck();

    game.players.forEach(p => {
      p.hand = game.deck.splice(0, 7);
    });

    game.discard.push(game.deck.pop());
    game.started = true;

    io.to(code).emit("gameStarted", {
      players: game.players.map(p => ({ name: p.name, count: p.hand.length })),
      discard: game.discard.at(-1),
      turn: game.players[0].id
    });
  });

  socket.on("playCard", ({ code, cardIndex }) => {
    const game = games[code];
    if (!game) return;

    const player = game.players[game.turn];
    if (player.id !== socket.id) return;

    const card = player.hand[cardIndex];
    const top = game.discard.at(-1);

    if (!canPlay(card, top)) return;

    player.hand.splice(cardIndex, 1);
    game.discard.push(card);
    game.turn = (game.turn + 1) % game.players.length;

    io.to(code).emit("stateUpdate", {
      discard: card,
      turn: game.players[game.turn].id,
      hands: game.players.map(p => p.hand.length)
    });
  });

  socket.on("disconnect", () => {
    for (const code in games) {
      games[code].players = games[code].players.filter(p => p.id !== socket.id);
      if (games[code].players.length === 0) delete games[code];
    }
  });

});

server.listen(3000, () => {
  console.log("uno server running 🔥");
});
