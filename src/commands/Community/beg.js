const {
  Client,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const ecoSchema = require('../../Schemas.js/economySchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('beg')
    .setDescription('Beg for money'),
  async execute(interaction) {
    const { user, guild } = interaction;

    let Data = await ecoSchema.findOne({
      Guild: interaction.guild.id,
      User: interaction.user.id,
    });

    let negative = Math.round(Math.random() * -300 - 10);
    let positive = Math.round(Math.random() * 300 + 10);

    const posN = [negative, positive];

    const amount = Math.round(Math.random() * posN.length);
    const value = posN[amount];

    if (!value)
      return await interaction.reply({
        content: `L, you get nothing! Get your money up not your funny up 😹👎`,
        ephemeral: true,
      });

    if (Data) {
      Data.Wallet += value;
      await Data.save();
    }

    if (value > 0) {
      const positiveChoices = [
        'Goku gave you',
        'Naruto gave you',
        'Luffy gave you',
        'Ichigo gave you',
      ];

      const posName = Math.round(Math.random() * positiveChoices.length);

      const embed1 = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Beg Command')
        .addFields({
          name: 'Beg Result',
          value: `${positiveChoices[[posName]]} ¥${value}`,
        });

      await interaction.reply({ embeds: [embed1] });
    } else {
      const negativeChoices = [
        'Ayanakoji manipulated you into giving him',
        'Swiper no Swiping took',
        'Fanum was hungry for money and took',
      ];
      const negName = Math.round(Math.random() * negativeChoices.length);

      const stringV = `${value}`;

      const nonSymbol = await stringV.slice(1);

      const embed2 = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Beg Command')
        .addFields({
          name: 'Beg Result',
          value: `${negative[[negName]]} ¥${nonSymbol}`,
        });

      await interaction.reply({ embeds: [embed2] });
    }
  },
};
