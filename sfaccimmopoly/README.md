# 🎲 Sfaccimmopoly

A custom multiplayer online Monopoly game for friends, with two game modes:
- **Quick Mode** — fast-paced version with shorter rules
- **Betting Mode** — players can place side bets on game events

## ✨ Features
- Up to 8 players simultaneously
- Real-time multiplayer via Firebase
- Password-protected access (private game for friends)
- Italian classic Monopoly board (customizable)
- Special custom cards: Magnanimus, Confusion, Terremoto, Schiavo Portoghese
- Bilingual interface (Italian / English)
- Player elimination & re-entry mechanics

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend / Real-time sync:** Firebase Realtime Database
- **Hosting:** GitHub Pages

## 📁 Project Structure
sfaccimmopoly/
├── index.html              # Password gate
├── game.html               # Main game board
├── css/                    # Stylesheets
├── js/                     # Game logic
├── images/                 # Board, tokens, cards, etc.
└── sounds/                 # Optional sound effects

## 🚀 Setup
1. Clone this repo
2. Create a Firebase Realtime Database project
3. Paste your Firebase config into `js/config.js`
4. Set the access password hash in `js/config.js`
5. Push to GitHub and enable GitHub Pages

## 🎮 How to Play
1. Open the game URL
2. Enter the shared password
3. Choose or create a game room
4. Pick a token and start playing!

## 📜 License
Private project — for personal use among friends.

---
Made with ❤️ for game nights.
