const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a specified user.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member you want to ban.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the ban.')
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const users = interaction.options.getUser('user');
    const ID = users.id;
    const banUser = client.users.cache.get(ID);

    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)
    )
      return await interaction.reply({
        content: 'You do not have the permissions to execute this command.',
        ephemeral: true,
      });
    if (interaction.member.id === ID)
      return await interaction.reply({
        content: 'You cannot ban yourself.',
        ephemeral: true,
      });

    let reason = interaction.options.getString('reason');
    if (!reason) reason = 'No reason specified.';

    const dmEmbed = new EmbedBuilder()
      .setColor('Red')
      .setDescription(
        `You have been banned from **${interaction.guild.name}** | ${reason}`
      )
      .setImage(
        'https://i.pinimg.com/originals/8d/50/60/8d50607e59db86b5afcc21304194ba57.gif'
      );

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription(`**${banUser.tag}** has been banned. | ${reason}`);

    const banMember = await interaction.guild.members.fetch(ID);

    // Fetch messages sent by the banned member in the channel
    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const banMemberMessages = messages.filter(
      (msg) => msg.author.id === banMember.id
    );

    // Delete messages sent by the banned member
    if (banMemberMessages.size > 0) {
      try {
        await channel.bulkDelete(banMemberMessages, true);
      } catch (error) {
        console.error('Error while bulk deleting messages:', error);
      }
    }

    // Ban the member
    await banUser.send({ embeds: [dmEmbed] }).catch((err) => {
      return;
    });

    await interaction.guild.bans.create(banUser.id, { reason }).catch((err) => {
      return interaction.reply({
        content: 'I cannot ban this member.',
        ephemeral: true,
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
