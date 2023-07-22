const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a specified user.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member you want to unban.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the unban.')
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const userID = interaction.options.getUser('user');

    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)
    )
      return await interaction.reply({
        content: 'You do not have the permissions to execute this command.',
        ephemeral: true,
      });
    if (interaction.member.id === userID)
      return await interaction.reply({
        content: 'You cannot unban yourself.',
        ephemeral: true,
      });

    let reason = interaction.options.getString('reason');
    if (!reason) reason = 'No reason specified.';

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setDescription(
        `:white_check_mark: ${userID} has been unbanned. | ${reason}`
      );

    await interaction.guild.bans.fetch().then(async (bans) => {
      if (bans.size == 0)
        return await interaction.reply({
          content: 'There is no one banned from this server',
          ephemeral: true,
        });
      let bannedID = bans.find((ban) => ban.user.id == userID);
      if (!bannedID)
        return await interaction.reply({
          content: 'The user is not banned from this server.',
          ephemeral: true,
        });
      await interaction.guild.bans.remove(userID, reason).catch((err) => {
        return interaction.reply({
          content: 'I cannot unban this user.',
          ephemeral: true,
        });
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
