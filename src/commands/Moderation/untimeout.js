const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Untimes out a server member.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user you want to untime out.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for untiming out the user.')
    ),
  async execute(interaction) {
    const timeUser = interaction.options.getUser('user');
    const timeMember = await interaction.guild.members.fetch(timeUser.id);

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    )
      return await interaction.reply({
        content: 'You do not have the permissions to execute this command.',
        ephemeral: true,
      });

    if (!timeMember)
      return await interaction.reply({
        content: 'The user mentioned is no longer in the server',
        ephemeral: true,
      });
    if (!timeMember.kickable)
      return await interaction.reply({
        content: 'I cannot untimeout this user.',
        ephemeral: true,
      });
    if (interaction.member.id === timeMember.id)
      return await interaction.reply({
        content: 'You cannot untimeout yourself',
        ephemeral: true,
      });
    if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator))
      return await interaction.reply({
        content: 'You cannot untimeout an admin.',
        ephemeral: true,
      });

    let reason =
      interaction.options.getString('reason') || 'No reason specified';

    await timeMember.timeout(null, reason);

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: ${timeUser.tag} has been **untimed out** | ${reason}`
      );

    const dmEmbed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: You have been untimed out in ${interaction.guild.name} | ${reason}`
      )
      .setImage(
        'https://wegotthiscovered.com/wp-content/uploads/2022/05/Spy-x-Family-anya.png?w=1200'
      );

    await timeMember.send({ embeds: [dmEmbed] }).catch((err) => {
      return;
    });

    await interaction.reply({ embeds: [embed] });
  },
};
