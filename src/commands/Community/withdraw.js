const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ecoSchema = require('../../Schemas.js/economySchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw money.')
    .addStringOption((option) =>
      option
        .setName('amount')
        .setDescription(`The amount of money you want to withdraw`)
        .setRequired(true)
    ),
  async execute(interaction) {
    const { options, user, guild } = interaction;

    const amount = options.getString('amount');
    const Data = await ecoSchema.findOne({
      Guild: interaction.guild.id,
      User: user.id,
    });

    if (!Data)
      return await interaction.reply({
        content: 'Please create an economy account first.',
        ephemeral: true,
      });
    if (amount.startsWith('-'))
      return await interaction.reply({
        content: 'You cannot withdraw a negative amount of money.',
        ephemeral: true,
      });

    if (amount.toLowerCase() === 'all') {
      if (Data.Bank === 0)
        return await interaction.reply({
          content: 'You have no money to withdraw',
          ephemeral: true,
        });

      Data.Wallet += Data.Bank;
      Data.Bank = 0;

      await Data.save();

      return await interaction.reply({
        content: `All your money has been withdrawn`,
        ephemeral: true,
      });
    } else {
      const Converted = Number(amount);

      if (isNaN(Converted) === true)
        return await interaction.reply({
          content: 'The amount can only be a number or `all`!',
          ephemeral: true,
        });

      if (Data.Bank < parseInt(Converted) || Converted === Infinity)
        return await interaction.reply({
          content: "You don't have enough money in your bank to withdraw.",
          ephemeral: true,
        });

      Data.Wallet += parseInt(Converted);
      Data.Bank -= parseInt(Converted);
      Data.Bank = Math.abs(Data.Bank);

      await Data.save();

      const embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle(`Withdraw Sucess`)
        .setDescription(
          `Sucessfully ¥${parseInt(Converted)} withdrawed into your wallet.`
        );

      return await interaction.reply({ embeds: [embed] });
    }
  },
};
