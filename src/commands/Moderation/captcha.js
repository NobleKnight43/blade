const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');
const capSchema = require('../../Schemas.js/capSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('captcha')
    .setDescription('Setup the captcha system.')
    .addSubcommand((command) =>
      command
        .setName('setup')
        .setDescription('Setup the captcha system.')
        .addRoleOption((option) =>
          option
            .setName('role')
            .setDescription('The role you want to be given on verification.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('captcha')
            .setDescription('The captcha text you want in the image.')
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command.setName('disable').setDescription('Disable the captcha system.')
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

    const Data = await capSchema.findOne({ Guild: interaction.guild.id });

    const { options } = interaction;
    const sub = options.getSubcommand();

    switch (sub) {
      case 'setup':
        if (Data)
          return await interaction.reply({
            content: 'The captcha system has alread been set up.',
            ephemeral: true,
          });
        else {
          const role = options.getRole('role');
          const captcha = options.getString('captcha');

          await capSchema.create({
            Guild: interaction.guild.id,
            Role: role.id,
            Captcha: captcha,
          });

          const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setDescription(`:white_check_mark: The captcha has been set up.`);

          await interaction.reply({ embeds: [embed] });
        }

        break;

      case 'disable':
        if (!Data)
          return await interaction.reply({
            content: 'There is no captcha system set up.',
            ephemeral: true,
          });
        else {
          await capSchema.deleteMany({ Guild: interaction.guild.id });

          const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setDescription(
              `:white_check_mark: The captcha system has been disabled.`
            );

          await interaction.reply({ embeds: [embed] });
        }
    }
  },
};
