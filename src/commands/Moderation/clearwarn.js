const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const warningSchema = require('../../Schemas.js/warnSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarn')
    .setDescription("This clears a member's warnings.")
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(`The user you want to clear the warnings of.`)
        .setRequired(true)
    ),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)
    )
      return await interaction.reply({
        content: "You don't have the permission to execute this action.",
        ephemeral: true,
      });

    const { options, guildId, user } = interaction;

    const target = options.getUser('user');

    const embed = new EmbedBuilder();

    try {
      let data = await warningSchema.findOneAndDelete({
        GuildID: guildId,
        UserID: target.id,
        UserTag: target.tag,
      });

      if (data) {
        embed
          .setColor('DarkRed')
          .setDescription(
            `:white_check_mark: ${target.tag}'s warnings have been cleared.`
          );

        interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply({
          content: `${target.tag} has no warnings to be cleared.`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: 'An error occurred while clearing the warnings.',
        ephemeral: true,
      });
    }
  },
};
