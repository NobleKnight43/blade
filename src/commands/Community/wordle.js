const { Wordle } = require('discord-gamecord');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wordle')
    .setDescription('Play the wordle game.'),
  async execute(interaction) {
    const Game = new Wordle({
      message: interaction,
      isSlashGame: false,
      embed: {
        title: `Wordle`,
        color: '#5865F2',
      },
      customWord: null,
      timeoutTime: 60000,
      winMessage: 'Sugoii, you won! The word was **{word}**',
      loseMessage: 'Sate sate sate... you lost. The word was **{word}**',
      playerOnlyMessage: 'Only {player} can use these buttons',
    });

    Game.startGame();
    Game.on('gameOver', (result) => {
      return;
    });
  },
};
