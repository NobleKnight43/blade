const { SlashCommandBuilder } = require('@discordjs/builders');
const { QuickDB } = require('quick.db');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`removewelch`)
    .setDescription('This disables a welcome message.'),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return await interaction.reply({
        content: "You don't have the permission to execute this command.",
        ephemeral: true,
      });

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: Your welcome channel has been removed`
      );

    await db.delete(`welchannel_${interaction.guild.id}`, channel.id);

    await interaction.reply({ embeds: [embed] });
  },
};
