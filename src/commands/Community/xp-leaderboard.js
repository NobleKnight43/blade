const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const levelSchema = require('../../Schemas.js/level');

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`xp-leaderboard`)
    .setDescription('This gets the XP leaderboard.'),
  async execute(interaction) {
    const { guild, client } = interaction;

    let text = '';

    const Data = await levelSchema
      .find({ Guild: guild.id })
      .sort({
        XP: -1,
        Level: -1,
      })
      .limit(10);

    if (!Data || Data.length === 0) {
      const embed1 = new EmbedBuilder()
        .setColor('DarkRed')
        .setDescription(`No one is on the leaderboard yet...`);

      return await interaction.reply({ embeds: [embed1] });
    }

    for (let counter = 0; counter < Data.length; ++counter) {
      let { User, XP, Level } = Data[counter];

      const value = (await client.users.fetch(User)) || 'Unknown Member';
      const member = value.tag;

      text += `${counter + 1}. ${member} | XP: ${XP} | Level: ${Level} \n`;
    }

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setTitle(`${guild.name}'s XP Leaderboard:`)
      .setDescription(`\`\`\`${text}\`\`\``)
      .setTimestamp()
      .setFooter({ text: 'XP Leaderboard' });

    await interaction.reply({ embeds: [embed] });
  },
};
