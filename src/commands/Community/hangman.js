const { SlashCommandBuilder } = require('discord.js');
const { Hangman } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hangman')
    .setDescription('Play a game of Hangman'),
  async execute(interaction) {
    const Game = new Hangman({
      message: interaction,
      embed: {
        title: 'Hangman',
        color: '#5865F2',
      },
      hangman: {
        hat: '🎩',
        head: '🥺',
        shirt: '🧥',
        pants: '👖',
        boots: '👞👞',
      },
      timeoutTime: 60000,
      timeWords: 'all',
      winMessage: 'Sugoii! The word was **{word}**',
      loseMessage: 'Sate sate sate... you lost. The word was **{word}**',
      playerOnlyMessage: 'Only {player} can use these buttons.',
    });

    Game.startGame();
    Game.on('gameOver', (result) => {
      return;
    });
  },
};
