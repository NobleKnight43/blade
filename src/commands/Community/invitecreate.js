const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-invite')
    .setDescription('Create an invite for Hamzonia.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to create the invite in.')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('max-age')
        .setDescription('The max age for the invite (in seconds)')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('max-uses')
        .setDescription('The max number of people who can use the invite.')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for creating this invite.')
        .setRequired(false)
    ),
  async execute(interaction) {
    const { options } = interaction;
    const channel = options.getChannel('channel') || interaction.channel;
    let maxAge = options.getInteger('max-age') || 0;
    let maxUses = options.getInteger('max-uses') || 0;
    let reason = options.getString('reason') || 'No reason provided';

    const invite = await channel.createInvite({
      maxAge: maxAge,
      maxUses: maxUses,
      reason: reason,
    });

    if (maxAge === 0) maxAge === 'infinite';
    if (maxUses === 0) maxUses === 'infinite';

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setTitle(`📂 I have created your invite link!`)
      .addFields({
        name: '🔗 Invite Link',
        value: `https://discord.gg/${invite.code} OR \`${invite.code}\``,
      })
      .addFields({ name: '📜 Invite Channel', value: `*${channel}*` })
      .addFields({ name: `⛽ Max Uses`, value: `\`${maxUses}\`` })
      .addFields({ name: `🍥 Max Age`, value: `\`${maxAge}\`` })
      .setDescription(`You created this invite for: *${reason}*`)
      .setTimestamp()
      .setFooter({ text: 'Invite Generator' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
