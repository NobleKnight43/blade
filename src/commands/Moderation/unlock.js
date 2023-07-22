const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the mentioned channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel you want to unlock.')
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
      return interaction.reply('Please mention a valid channel to unlock.');
    }

    try {
      await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
        SendMessages: null,
      });

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setDescription(`The channel ${channel} has been unlocked.`)
        .setImage('https://cdn.wallpapersafari.com/0/24/JCWzEA.jpg');

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply('There was an error while unlocking the channel.');
    }
  },
};
