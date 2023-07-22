const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addemoji')
    .setDescription('Adds an emoji to the server')
    .addAttachmentOption((option) =>
      option
        .setName('emoji')
        .setDescription('The emoji you want to add to the server')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The name of the emoji')
        .setRequired(true)
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

    const upload = interaction.options.getAttachment('emoji');
    const name = interaction.options.getString('name');

    await interaction.reply({ content: `📂 Loading your emoji...` });

    const emoji = await interaction.guild.emojis
      .create({ attachment: `${upload.attachment}`, name: `${name}` })
      .catch((err) => {
        setTimeout(() => {
          console.log(err);
          return interaction.editReply({ content: `${err.rawError.message}` });
        }, 2000);
      });

    setTimeout(() => {
      if (!emoji) return;

      const embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setDescription(`Your emoji has been added ${emoji}`);

      interaction.editReply({ content: ``, embeds: [embed] });
    }, 3000);
  },
};
