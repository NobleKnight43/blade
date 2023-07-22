const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  AttachmentBuilder,
  PermissionsBitField,
} = require('discord.js');
const levelSchema = require('../../Schemas.js/level');

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`xpuser-reset`)
    .setDescription("Resets a member's XP")
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(`The member you want to clear the XP of.`)
        .setRequired(true)
    ),
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

    const { guild } = interaction;

    const target = interaction.options.getUser('user');

    await levelSchema.deleteMany({ Guild: guild.id, User: target.id });

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(`:white_check_mark: ${target.tag}'s XP has been reset.`);

    await interaction.reply({ embeds: [embed] });
  },
};
