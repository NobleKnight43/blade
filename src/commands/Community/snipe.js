const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription(`This is a snipe command.`),
  async execute(interaction, client) {
    const msg = client.snipes.get(interaction.channel.id);
    if (!msg)
      return await interaction.reply({
        content: "I can't find any recently deleted messages.",
        ephemeral: true,
      });

    const ID = msg.author.id;
    const member = interaction.guild.members.cache.get(ID);
    const URL = member.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setTitle(`SNIPED MESSAGE! ${member.user.tag}`);

    if (msg.content) {
      embed.setDescription(msg.content);
    } else {
      // If the message content is empty, set a placeholder description
      embed.setDescription('No content available.');
    }

    if (msg.image) {
      embed.setImage(msg.image);
    }

    embed
      .setTimestamp()
      .setFooter({ text: `Member ID ${ID}`, iconURL: `${URL}` });

    await interaction.reply({ embeds: [embed] });
  },
};
