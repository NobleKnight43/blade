const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Times out a server member.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user you want to time out.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('The duration of the timeout.')
        .setRequired(true)
        .addChoices(
          { name: '60 seconds', value: '60' },
          { name: '2 minutes', value: '120' },
          { name: '5 minutes', value: '300' },
          { name: '10 minutes', value: '600' },
          { name: '15 minutes', value: '900' },
          { name: '20 minutes', value: '1200' },
          { name: '30 minutes', value: '1800' },
          { name: '45 minutes', value: '2700' },
          { name: '1 hour', value: '3600' },
          { name: '2 hours', value: '7200' },
          { name: '3 hours', value: '10800' },
          { name: '5 hours', value: '18000' },
          { name: '10 hours', value: '36000' },
          { name: '1 day', value: '86400' },
          { name: '2 days', value: '172800' },
          { name: '3 days', value: '259200' },
          { name: '5 days', value: '432000' },
          { name: 'One week', value: '604800' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for timing out the user.')
    ),
  async execute(interaction) {
    const timeUser = interaction.options.getUser('user');
    const timeMember = await interaction.guild.members.fetch(timeUser.id);
    const duration = interaction.options.getString('duration');

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
        content: 'I cannot timeout this user.',
        ephemeral: true,
      });
    if (interaction.member.id === timeMember.id)
      return await interaction.reply({
        content: 'You cannot timeout yourself',
        ephemeral: true,
      });
    if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator))
      return await interaction.reply({
        content: 'You cannot timeout an admin.',
        ephemeral: true,
      });

    let reason =
      interaction.options.getString('reason') || 'No reason specified';

    await timeMember.timeout(duration * 1000, reason);

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: ${timeUser.tag} has been **timed out** for ${
          duration / 60
        } minute(s) | ${reason}`
      );

    const dmEmbed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: You have been timed out in ${
          interaction.guild.name
        } for ${duration / 60} minute(s) | ${reason}`
      )
      .setImage(
        'https://i0.wp.com/1screenmagazine.com/wp-content/uploads/2022/12/HIwSP3B5ZKDKQADv3qQkJ23p9ExU4VvX5kVniQFz.jpg?resize=1000%2C562&ssl=1'
      );

    await timeMember.send({ embeds: [dmEmbed] }).catch((err) => {
      return;
    });

    await interaction.reply({ embeds: [embed] });
  },
};
