const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
const voiceSchema = require('../../Schemas.js/jointocreate');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('join-to-create')
    .setDescription('Set up and disable your join-to-create voice channel.')
    .addSubcommand((command) =>
      command
        .setName('setup')
        .setDescription('Set up your join-to-create voice channel.')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription(
              'The channel you want to be your join-to-create VC.'
            )
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice)
        )
        .addChannelOption((option) =>
          option
            .setName('category')
            .setDescription('The category for the VCs to be created in.')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addIntegerOption((option) =>
          option
            .setName('voice-limit')
            .setDescription('Set the default limit for voice channels.')
            .setMinValue(2)
            .setMaxValue(10)
        )
    )
    .addSubcommand((command) =>
      command
        .setName('disable')
        .setDescription('Disables your join-to-create voice channel.')
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

    const Data = await voiceSchema.findOne({ Guild: interaction.guild.id });

    const { options } = interaction;
    const sub = interaction.options.getSubcommand();

    switch (sub) {
      case 'setup':
        if (Data)
          return await interaction.reply({
            content: 'You already set up a join-to-create system!',
            ephemeral: true,
          });
        else {
          const channel = interaction.options.getChannel('channel');
          const category = interaction.options.getChannel('category');
          const limit = interaction.options.getChannel('voice-limit') || 3;

          await voiceSchema.create({
            Guild: interaction.guild.id,
            Channel: channel.id,
            Limit: limit,
            Category: category.id,
          });

          const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setDescription(
              `:loud_sound: The join to create system has been set up in ${channel}, all new VCs will be created in ${category}`
            );

          await interaction.reply({ embeds: [embed] });
        }

        break;
      case 'disable':
        if (!Data)
          return await interaction.reply({
            content: 'You do not have a join-to-create system set up.',
            ephemeral: true,
          });
        else {
          const embed2 = new EmbedBuilder()
            .setColor('DarkRed')
            .setDescription(
              `:loud_sound: The join to create system has been disabled.`
            );

          await voiceSchema.deleteMany({ Guild: interaction.guild.id });

          await interaction.reply({ embeds: [embed2] });
        }
    }
  },
};
