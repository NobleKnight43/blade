const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ecoSchema = require('../../Schemas.js/economySchema');

var timeout = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription("Rob a person's money.")
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(`Pick the user who you want to rob.`)
        .setRequired(true)
    ),
  async execute(interaction) {
    const { options, user, guild } = interaction;

    if (timeout.includes(interaction.user.id))
      return await interaction.reply({
        content: 'Wait 1min to rob another user again.',
        ephemeral: true,
      });

    const userStealing = options.getUser('user');

    let Data = await ecoSchema.findOne({ Guild: guild.id, User: user.id });
    let DataUser = await ecoSchema.findOne({
      Guild: guild.id,
      User: userStealing.id,
    });

    if (!Data)
      return await interaction.reply({
        content: 'Please create an economy account first',
        ephemeral: true,
      });
    if (userStealing == interaction.user)
      return await interaction.reply({
        content: 'You cannot rob yourself.',
        ephemeral: true,
      });
    if (!DataUser)
      return await interaction.reply({
        content: 'That user does not have an economy account created',
        ephemeral: true,
      });
    if (DataUser.Wallet <= 0)
      return await interaction.reply({
        content: 'That user does not have any money in their wallet',
        ephemeral: true,
      });

    let negative = Math.round(Math.random() * -150 - 10);
    let positive = Math.round(Math.random() * 300 + 10);

    const posN = [negative, positive];

    const amount = Math.round(Math.random() * posN.length);
    const value = posN[amount];

    if (Data.Wallet <= 0)
      return await interaction.repl({
        content:
          'You cannot rob this person because your wallet has 0 ¥0 in it.',
        ephemeral: true,
      });

    if (value > 0) {
      const positiveChoices = ['You kawaiily stole', 'You swiped', 'You took'];

      const posName = Math.floor(Math.random() * positiveChoices.length);

      const robEmbed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Robbery Success')
        .addFields({
          name: 'You robbed and',
          value: `${positiveChoices[[posName]]} ¥${value}`,
        })
        .setImage('https://media.tenor.com/zXu-oABu_1oAAAAd/dora-anime.gif');

      await interaction.reply({ embeds: [robEmbed] });

      Data.Wallet += value;
      await Data.save();

      DataUser.Wallet -= value;
      await Data.save();
    } else if (value > 0) {
      const negativeChoices = [
        'You got caught by the cops and lost',
        'You left your ID and got arrested, you lost',
        'The person knocked you out and took',
      ];

      const wal = Data.Wallet;
      if (isNan(value))
        return await interaction.reply({
          content: `This user called the cops on you, but you ran away. You didn't loose or gain anything`,
          ephemeral: true,
        });

      const negName = Math.floor(Math.random() * negativeChoices.length);

      let nonSymbol;
      if (value - wal < 0) {
        const stringV = `${value}`;

        nonSymbol = await stringV.slice(1);

        const los = new EmbedBuilder()
          .setColor('DarkRed')
          .setTitle('Robbery Failed')
          .addFields({
            name: 'You robbed and',
            value: `${negativeChoices[[negName]]} ¥${nonSymbol}`,
          })
          .setImage('https://i.ytimg.com/vi/rn5H0SJBXJU/maxresdefault.jpg');

        await interaction.reply({ embeds: [los] });
      }

      const lostEmbed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Robbery Failed')
        .addFields({
          name: 'You robbed and',
          value: `${negativeChoices[[negName]]} ¥${nonSymbol}`,
        })
        .setImage('https://i.ytimg.com/vi/FBve-mC2SJI/maxresdefault.jpg');

      Data.Bank += value;
      await Data.save();

      DataUser.Wallet -= value;
      await DataUser.save();

      await interaction.reply({ embeds: [lostEmbed] });

      Data.Wallet += value;
      await Data.save();

      DataUser.Wallet -= value;
      await Data.save();
    }

    timeout.push(interaction.user.id);
    setTimeout(() => {
      timeout.shift();
    }, 30000);
  },
};
