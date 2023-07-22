const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const warningSchema = require('../../Schemas.js/warnSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("This gets a member's warnings.")
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(`The member you want to check the warns of.`)
        .setRequired(true)
    ),
  async execute(interaction) {
    const { options, guildId, user } = interaction;

    const target = options.getUser('user');

    const embed = new EmbedBuilder();
    const noWarns = new EmbedBuilder();

    try {
      let data = await warningSchema.findOne({
        GuildID: guildId,
        UserID: target.id,
        UserTag: target.tag,
      });

      if (data) {
        embed.setColor('DarkRed').setDescription(
          `:white_check_mark: ${target.tag}'s warnings: \n${data.Content.map(
            (w, i) =>
              `
                 **Warnings**: ${i + 1}
                 **Warning Moderator**: ${w.ExecuterTag}
                 **Warn Reason**: ${w.Reason}
              `
          ).join(`-`)}`
        );

        interaction.reply({ embeds: [embed] });
      } else {
        noWarns
          .setColor('DarkRed')
          .setDescription(
            `:white_check_mark: ${target.tag} has **0** warnings.`
          );

        interaction.reply({ embeds: [noWarns] });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: 'An error occurred while fetching the warnings.',
        ephemeral: true,
      });
    }
  },
};
