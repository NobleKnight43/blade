const mongoose = require('mongoose');
const mongoDBURL = process.env.mongodburl;

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log('Ready! 🍢');

    if (!mongoDBURL) return;

    await mongoose.connect(mongoDBURL || '', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (mongoose.connect) {
      console.log(`The DB is running. ✅`);
    }

    async function pickPresence() {
      const option = Math.floor(Math.random() * statusArray.length);

      try {
        await client.user.setPresence({
          activities: [
            {
              name: statusArray[option].content,
              type: statusArray[option].type,
            },
          ],

          status: statusArray[option].status,
        });
      } catch (error) {
        console.error(error);
      }
    }
  },
};
