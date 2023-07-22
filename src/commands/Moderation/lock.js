const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the mentioned channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel you want to lock.')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)
    )
      return await interaction.reply({
        content: 'You do not have the permissions to execute this command.',
        ephemeral: true,
      });
    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      return interaction.reply('Please mention a valid channel to lock.');
    }

    try {
      await channel.permissionOverwrites.create(channel.guild.roles.everyone, {
        SendMessages: false,
      });

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`The channel ${channel} has been locked.`)
        .setImage(
          'https://qph.cf2.quoracdn.net/main-qimg-7b74056865afbd44a64a0e4ea7b8e5fb'
        );

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply('There was an error while locking the channel.');
    }
  },
};
