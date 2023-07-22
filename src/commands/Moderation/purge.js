const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  EmbedBuilder,
  PermissionsBitField,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Deletes a specific number of message from a channel.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('The amount of messages to delete.')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    )
      return await interaction.reply({
        content: "You don't have the permissions to execute this command.",
        ephemeral: true,
      });

    let number = interaction.options.getInteger('amount');

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(`:white_check_mark: Deleted ${number} messages.`);

    await interaction.channel.bulkDelete(number);

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('purge')
        .setEmoji(`🗑️`)
        .setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [button],
    });

    const collector = message.createMessageComponentCollector();

    collector.on('collect', async (i) => {
      if (i.customId === 'purge') {
        if (!i.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
          return;

        interaction.deleteReply();
      }
    });
  },
};
