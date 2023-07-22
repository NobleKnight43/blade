const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`setautorole`)
    .setDescription(`This sets a auto role.`)
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('This is the role you want as your autorole')
        .setRequired(true)
    ),
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

    const role = interaction.options.getRole('role');

    await db.set(`autorole_${interaction.guild.id}`, role.id);

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: Your autorole has been set to ${role}`
      );

    await interaction.reply({ embeds: [embed] });
  },
};
