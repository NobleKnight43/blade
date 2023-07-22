const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
const inviteSchema = require('../../Schemas.js/inviteSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite-logger')
    .setDescription('Setup the invite logger system.')
    .addSubcommand((command) =>
      command
        .setName('setup')
        .setDescription('Setup the invite logger system')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription(
              'The channel you want to send the invites logging in.'
            )
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command
        .setName('disable')
        .setDescription('Disable the invite logger system')
    ),
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

    const { options } = interaction;
    const sub = options.getSubcommand();

    const Data = await inviteSchema.findOne({ Guild: interaction.guild.id });

    switch (sub) {
      case 'setup':
        const channel = options.getChannel('channel');

        if (Data)
          return await interaction.reply({
            content: 'The invite loggin system is already enabled.',
            ephemeral: true,
          });
        else {
          await inviteSchema.create({
            Guild: interaction.guild.id,
            Channel: channel.id,
          });
          const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setDescription(
              `:white_check_mark: The invite logging system has been enabled in ${channel}`
            );

          await interaction.reply({ embeds: [embed] });
        }
    }

    switch (sub) {
      case 'disable':
        if (!Data)
          return await interaction.reply({
            content: 'There is no invite logging system configured.',
            ephemeral: true,
          });
        else {
          await inviteSchema.deleteMany({ Guild: interaction.guild.id });

          const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setDescription(
              `:white_check_mark: The invite logging system has been disabled.`
            );

          await interaction.reply({ embeds: [embed] });
        }
    }
  },
};
