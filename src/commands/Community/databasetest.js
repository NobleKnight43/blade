const { SlashCommandBuilder } = require('@discordjs/builders');
const testSchema = require('../../Schemas.js/test');

module.exports = {
  data: new SlashCommandBuilder().setName('dbtest').setDescription('DB test.'),
  async execute(interaction) {
    try {
      const data = await testSchema.findOne({
        GuildID: interaction.guild.id,
        UserID: interaction.user.id,
      });

      if (!data) {
        await testSchema.create({
          GuildID: interaction.guild.id,
          UserID: interaction.user.id,
        });
      }

      if (data) {
        const user = data.UserID;
        const guild = data.GuildID;

        interaction.reply({ content: `Guild: ${guild}\nUser: ${user}` });
      }
    } catch (err) {
      console.error(err);
    }

    testSchema.deleteMany({
      GuildID: interaction.guild.id,
      UserID: interaction.user.id,
    });
  },
};
