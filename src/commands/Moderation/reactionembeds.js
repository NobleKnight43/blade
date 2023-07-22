const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionembed')
    .setDescription('Displays the reaction embed'),
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

    //  const embed = new EmbedBuilder().setImage(
    //    'https://i.imgur.com/eVtSclj.jpg'
    //  );

    const embed = new EmbedBuilder()
      .setColor('Blurple')
      .setAuthor({ name: 'React to the emojis below' })
      .setDescription(
        `<@&1130474652351877222> : <:hamzonia_bounty:1132200213512200283>`
      )
      .setFooter({
        text: `Reaction Roles | ${interaction.guild.name}`,
        iconURL: 'https://i.imgur.com/mdtmwJk.jpg',
      });

    await interaction.channel.send({ embeds: [embed] });
  },
};
