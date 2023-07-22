const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createrole')
    .setDescription('Create a new role in the server.')
    .addStringOption((option) =>
      option
        .setName('role-name')
        .setDescription('Name of the new role')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('role-color')
        .setDescription('Color of the new role (hex code or color name)')
    )
    .addBooleanOption((option) =>
      option.setName('mentionable').setDescription('Make the role mentionable')
    )
    .addBooleanOption((option) =>
      option
        .setName('hoist')
        .setDescription('Display the role in the member list')
    ),
  async execute(interaction) {
    const { guild, options } = interaction;
    const roleName = options.getString('role-name');
    const roleColor = options.getString('role-color');
    const mentionable = options.getBoolean('mentionable');
    const hoist = options.getBoolean('hoist');

    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return interaction.reply({
        content: 'You do not have the necessary permissions to create roles.',
        ephemeral: true,
      });
    }

    try {
      const newRole = await guild.roles.create({
        name: roleName,
        color: roleColor,
        mentionable: mentionable,
        hoist: hoist,
      });

      return interaction.reply({
        content: `Role "${newRole.name}" has been created with ID ${newRole.id}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating role:', error);
      return interaction.reply({
        content: 'An error occurred while creating the role.',
        ephemeral: true,
      });
    }
  },
};
