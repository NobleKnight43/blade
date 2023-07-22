const {
  SlashCommandBuilder,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Send a bug report to the bot devs.'),
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setTitle(`Bug & Command Reporting`)
      .setCustomId('bugreport');

    const command = new TextInputBuilder()
      .setCustomId('command')
      .setRequired(true)
      .setPlaceholder('Please only state the command name')
      .setLabel('What command has a bug')
      .setStyle(TextInputStyle.Short);

    const description = new TextInputBuilder()
      .setCustomId('description')
      .setRequired(true)
      .setPlaceholder('Be sure to be as detailed as possible.')
      .setLabel('Describe the bug')
      .setStyle(TextInputStyle.Paragraph);

    const one = new ActionRowBuilder().addComponents(command);
    const two = new ActionRowBuilder().addComponents(description);

    modal.addComponents(one, two);

    await interaction.showModal(modal);
  },
};
