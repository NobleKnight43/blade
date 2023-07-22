const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  AttachmentBuilder,
  PermissionsBitField,
} = require('discord.js');
const levelSchema = require('../../Schemas.js/level');

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`xp-reset`)
    .setDescription("Resets all of the server's XP levels."),
  async execute(interaction) {
    const perm = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(`:x: You don't have permission to execute this command.`);
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      return await interaction.reply({ embeds: [perm], ephemeral: true });

    const { guildId } = interaction;

    await levelSchema.deleteMany({ Guild: guildId });

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(`:white_check_mark: The XP system has been reset.`);

    await interaction.reply({ embeds: [embed] });
  },
};
