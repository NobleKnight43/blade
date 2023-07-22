const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const warningSchema = require('../../Schemas.js/warnSchema');
const { execute } = require('./setWelcomeChannel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('This warns a server member.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(`The user you want to warn.`)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('This is the reason you want to warn.')
        .setRequired(false)
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
    const reason = options.getString('reason') || 'No reason given.';

    const userTag = `${target.username}#${target.discriminator}`;

    let data = await warningSchema.findOne({
      GuildID: guildId,
      UserID: target.id,
      UserTag: userTag,
    });

    if (!data) {
      data = new warningSchema({
        GuildID: guildId,
        UserID: target.id,
        UserTag: userTag,
        Content: [
          {
            ExecuterId: user.id,
            ExecuterTag: user.tag,
            Reason: reason,
          },
        ],
      });
    } else {
      const warnContent = {
        ExecuterId: user.id,
        ExecuterTag: user.tag,
        Reason: reason,
      };
      data.Content.push(warnContent);
    }

    await data.save();

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `You have been **warned** in ${interaction.guild.name} | ${reason}`
      )
      .setImage(
        'https://i.pinimg.com/originals/ee/f7/49/eef749c7d35c5b72203db15399241476.gif'
      );

    const embed2 = new EmbedBuilder()
      .setColor('DarkRed')
      .setDescription(
        `:white_check_mark: ${target.tag} has been **warned** | ${reason}`
      );

    target.send({ embeds: [embed] }).catch((err) => {
      return;
    });

    interaction.reply({ embeds: [embed2] });
  },
};
