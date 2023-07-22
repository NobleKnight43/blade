const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`setwelch`)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription(
          `This is the channel you want the welcome messages to be sent to.`
        )
        .setRequired(true)
    )
    .setDescription('This sets a welcome channel.'),
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

    const channel = interaction.options.getChannel('channel');

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: Your welcome channel has been set to ${channel}`
      );

    await db.set(`welchannel_${interaction.guild.id}`, channel.id);

    await interaction.reply({ embeds: [embed] });
  },
};
