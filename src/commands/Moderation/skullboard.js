const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require('discord.js');
const skullboardSchema = require('../../Schemas.js/skullBoardSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skullboard')
    .setDescription('Manage the SkullBoard system.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Set up the SkullBoard system.')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('The channel where the embeds will be sent to.')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove the SkullBoard system.')
    ), // Disable default permission to restrict who can use the command
  async execute(interaction) {
    const { guild, channel } = interaction;
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const existingData = await skullboardSchema.findOne({ Guild: guild.id });

      if (existingData) {
        return interaction.reply(
          'The SkullBoard system is already set up in this server.'
        );
      }

      const targetChannel = interaction.options.getChannel('channel');
      if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
        return interaction.reply(
          'Please provide a valid text channel for the SkullBoard system.'
        );
      }

      await skullboardSchema.create({
        Guild: guild.id,
        Channel: targetChannel.id,
        Threshold: 5, // Set the threshold as desired (2 or more skull reactions)
      });

      return interaction.reply(
        'The SkullBoard system has been set up successfully in this server.'
      );
    } else if (sub === 'remove') {
      const existingData = await skullboardSchema.findOne({ Guild: guild.id });

      if (!existingData) {
        return interaction.reply(
          'The SkullBoard system is not set up in this server.'
        );
      }

      await skullboardSchema.deleteOne({ Guild: guild.id });

      return interaction.reply(
        'The SkullBoard system has been removed from this server.'
      );
    }
  },
};
