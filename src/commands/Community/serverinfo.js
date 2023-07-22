const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('This command gets server information.'),
  async execute(interaction) {
    const { guild } = interaction;
    const { members } = guild;
    const { name, ownerId, createdTimestamp, memberCount } = guild;
    const icon = guild.iconURL();
    const roles = guild.roles.cache.size;
    const emojis = guild.emojis.cache.size;
    const id = guild.id;

    let baseVerification = guild.verificationLevel;
    switch (baseVerification) {
      case 'NONE':
        baseVerification = 'None';
        break;
      case 'LOW':
        baseVerification = 'Low';
        break;
      case 'MEDIUM':
        baseVerification = 'Medium';
        break;
      case 'HIGH':
        baseVerification = 'High';
        break;
      case 'VERY_HIGH':
        baseVerification = 'Very High';
        break;
    }

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setThumbnail(icon)
      .setAuthor({ name: name, iconURL: icon })
      .setFooter({ text: `Server ID: ${id}` })
      .setTimestamp()
      .addFields({ name: 'Name', value: `${name}`, inline: false })
      .addFields({
        name: 'Date Created',
        value: `<t:${parseInt(
          createdTimestamp / 1000
        )}:R> (hover for complete date)`,
        inline: true,
      })
      .addFields({ name: 'Server Owner', value: `<@${ownerId}>`, inline: true })
      .addFields({
        name: 'Server Members',
        value: `${memberCount}`,
        inline: true,
      })
      .addFields({ name: 'Role Number', value: `${roles}`, inline: true })
      .addFields({ name: 'Emoji Number', value: `${emojis}`, inline: true })
      .addFields({
        name: 'Verification Level',
        value: `${baseVerification}`,
        inline: true,
      })
      .addFields({
        name: 'Server Boosts',
        value: `${guild.premiumSubscriptionCount}`,
        inline: true,
      });

    await interaction.reply({ embeds: [embed] });
  },
};
