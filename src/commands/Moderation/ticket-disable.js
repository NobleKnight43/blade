const {
  PermissionsBitField,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
} = require('discord.js');
const ticketSchema = require('../../Schemas.js/ticketSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-disable')
    .setDescription(`This disables the ticket message and system.`),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return await interaction.reply({
        content: 'You do not have the permissions to execute this command.',
        ephemeral: true,
      });

    try {
      await ticketSchema.deleteMany({ Guild: interaction.guild.id });
      await interaction.reply({
        content: 'Your ticket system has been removed.',
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error disabling ticket:', err);
      await interaction.reply({
        content: 'An error occurred while disabling the ticket system.',
        ephemeral: true,
      });
    }
  },
};
