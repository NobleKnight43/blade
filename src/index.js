const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  Permissions,
  MessageManager,
  Embed,
  Collection,
  Events,
  AuditLogEvent,
  Partials,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require(`discord.js`);
const fs = require('fs');
const client = new Client({
  intents: [Object.keys(GatewayIntentBits)],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const { QuickDB } = require('quick.db');
const db = new QuickDB();

client.commands = new Collection();

require('dotenv').config();

const functions = fs
  .readdirSync('./src/functions')
  .filter((file) => file.endsWith('.js'));
const eventFiles = fs
  .readdirSync('./src/events')
  .filter((file) => file.endsWith('.js'));
const commandFolders = fs.readdirSync('./src/commands');

const process = require('node:process');

process.on('unhandledRejection', (reason, promise) => {
  console.log(`Unhandled rejection at:`, promise, 'reason:', reason);
});
(async () => {
  for (file of functions) {
    require(`./functions/${file}`)(client);
  }
  client.handleEvents(eventFiles, './src/events');
  client.handleCommands(commandFolders, './src/commands');
  client.login(process.env.token);
})();

// JOIN-TO-CREATE-SYSTEM

const joinSchema = require('./Schemas.js/jointocreate');
const joinchannelSchema = require('./Schemas.js/jointocreatechannels');

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    if (newState.member.guild === null) return;
  } catch (err) {
    return;
  }

  const joindata = await joinSchema.findOne({ Guild: newState.guild.id });
  const joinchanneldata = await joinchannelSchema.findOne({
    Guild: newState.member.id,
    User: newState.member.id,
  });

  const voicechannel = newState.channel;

  if (!joindata) return;

  if (!voicechannel) return;
  else {
    if (voicechannel.id === joindata.Channel) {
      if (joinchanneldata) {
        try {
          return await newState.member.send({
            content: `You already have a voice channel open right now.`,
            ephemeral: true,
          });
        } catch (err) {
          return;
        }
      } else {
        try {
          const channel = await newState.member.guild.channels.create({
            type: ChannelType.GuildVoice,
            name: `${newState.member.user.username}'s VC`,
            userLimit: joindata.VoiceLimit,
            parent: joindata.Category,
          });

          try {
            await newState.member.voice.setChannel(channel.id);
          } catch (err) {
            return;
          }

          setTimeout(() => {
            joinchannelSchema.create(
              {
                Guild: newState.member.guild.id,
                Channel: channel.id,
                User: newState.member.id,
              },
              500
            );
          });
        } catch (err) {
          try {
            await newState.member.send({
              content: `I could not create your channel, I may be missing permissions`,
            });
          } catch (err) {
            return;
          }

          return;
        }

        try {
          const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setTimestamp()
            .setAuthor({ name: `🔊 Join to Create System` })
            .setFooter({ text: `🔊 Channel Created` })
            .setTitle('> Channel Created')
            .addFields({
              name: 'Channel Created',
              value: `> Your voice channel has been\n> created in **${newState.member.guild.name}**`,
            });

          await newState.member.send({ embeds: [embed] });
        } catch (err) {
          return;
        }
      }
    }
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    if (oldState.member.guild === null) return;
  } catch (err) {
    return;
  }

  const leavechanneldata = await joinchannelSchema.findOne({
    Guild: oldState.member.guild.id,
    User: oldState.member.id,
  });
  if (!leavechanneldata) return;
  else {
    const voiceChannel = await oldState.member.guild.channels.cache.get(
      leavechanneldata.Channel
    );

    try {
      await voiceChannel.delete();
    } catch (err) {
      return;
    }

    await joinchannelSchema.deleteMany({
      Guild: oldState.guild.id,
      User: oldState.member.id,
    });
    try {
      const embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTimestamp()
        .setAuthor({ name: `🔊 Join to Delete System` })
        .setFooter({ text: `🔊 Channel Delete` })
        .setTitle('> Channel Deleted')
        .addFields({
          name: 'Channel Delete',
          value: `> Your voice channel has been\n> deleted in **${newState.member.guild.name}**`,
        });

      await newState.member.send({ embeds: [embed] });
    } catch (err) {
      return;
    }
  }
});

//AFK SYSTEM

const afkSchema = require('./Schemas.js/afkSchema');
client.on(Events.MessageCreate, async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const check = await afkSchema.findOne({
    Guild: message.guild.id,
    User: message.author.id,
  });
  if (check) {
    const nick = check.Nickname;
    await afkSchema.deleteMany({
      Guild: message.guild.id,
      User: message.author.id,
    });

    await message.member.setNickname(`${nick}`).catch((err) => {
      return;
    });

    const m1 = await message.reply({
      content: `Welcome back, ${message.author}-senpaii~! I have removed your afk.`,
      ephemeral: true,
    });
    setTimeout(() => {
      m1.delete();
    }, 4000);
  } else {
    const members = message.mentions.users.first();
    if (!members) return;
    const Data = await afkSchema.findOne({
      Guild: message.guild.id,
      User: members.id,
    });
    if (!Data) return;

    const member = message.guild.members.cache.get(members.id);
    const msg = Data.Message || 'No Reason Given';

    if (message.content.includes(members)) {
      const m = await message.reply({
        content: `${member.user.tag} is currently AFK - Reason: ${msg}`,
      });
      setTimeout(() => {
        m.delete();
        message.delete();
      }, 4000);
    }
  }
});

//CAPTCHA SYSTEM

const { CaptchaGenerator, Captcha } = require('captcha-canvas');
const capSchema = require('./Schemas.js/capSchema');
let guild;

client.on(Events.GuildMemberAdd, async (member) => {
  const Data = await capSchema.findOne({ Guild: member.guild.id });
  if (!Data) return;
  else {
    const cap = Data.Captcha;

    const captcha = new CaptchaGenerator()
      .setDimension(150, 450)
      .setCaptcha({ text: `${cap}`, size: 60, color: 'green' })
      .setDecoy({ opacity: 0.5 })
      .setTrace({ color: 'greem' });

    const buffer = captcha.generateSync();

    const attachment = new AttachmentBuilder(buffer, { name: 'captcha.png' });

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setImage('attachment://captcha.png')
      .setTitle(`Solve the captcha to verify in ${member.guild.name}`)
      .setFooter({ text: 'Use the button below to submit your captcha.' });

    const capButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('capButton')
        .setLabel('⚠️ Submit')
        .setStyle(ButtonStyle.Danger)
    );

    const capModal = new ModalBuilder()
      .setTitle(`Submit Captcha Answer`)
      .setCustomId('capModal');

    const answer = new TextInputBuilder()
      .setCustomId('answer')
      .setRequired(true)
      .setLabel('Your Captcha Answer')
      .setPlaceholder(
        'Submit what you think the captcha is. If you get it wrong you can try again.'
      )
      .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(answer);

    capModal.addComponents(firstActionRow);

    const msg = await member
      .send({ embeds: [embed], files: [attachment], components: [capButton] })
      .catch((err) => {
        return;
      });

    const collector = msg.createMessageComponentCollector();

    collector.on('collect', async (i) => {
      if (i.customId === 'capButton') {
        i.showModal(capModal);
      }
    });

    guiLd = member.guild;
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  else {
    if (interaction.customId !== 'capModal') return;
    const Data = await capSchema.findOne({ Guild: guild.id });

    const answer = interaction.components.getTextInputValue('answer');
    const cap = Data.Captcha;

    if (answer !== `${cap}`)
      return await interaction.reply({
        content: 'That was wrong, try again!',
        ephemeral: true,
      });
    else {
      const roleID = Data.Role;

      const capGuild = await client.guilds.fetch(interaction.guildId);
      const role = await capGuild.roles.cache.get(roleID);

      const member = await capGuild.members.fetch(interaction.user.id);

      await member.roles.add(role).catch((err) => {
        interaction.reply({
          content:
            'There was an error verifying, contact server staff to proceed.',
          ephemeral: true,
        });
      });

      await interaction.reply({
        content: `You have been verified within ${capGuild.name}`,
        ephemeral: true,
      });
    }
  }
});

//TICKET SYSTEM

const ticketSchema = require('./Schemas.js/ticketSchema');
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) return;
  if (interaction.isChatInputCommand()) return;

  const modal = new ModalBuilder()
    .setTitle(`Provide us with more information.`)
    .setCustomId('modal');

  const email = new TextInputBuilder()
    .setCustomId('email')
    .setRequired(true)
    .setLabel('Provide us with your email.')
    .setPlaceholder(`You must enter a valid email.`)
    .setStyle(TextInputStyle.Short);

  const username = new TextInputBuilder()
    .setCustomId('username')
    .setRequired(true)
    .setLabel('Provide us with your username.')
    .setPlaceholder(`This is your username.`)
    .setStyle(TextInputStyle.Short);

  const reason = new TextInputBuilder()
    .setCustomId('reason')
    .setRequired(true)
    .setLabel('The reason for this ticket')
    .setPlaceholder(`Give us a reason for opening this ticket.`)
    .setStyle(TextInputStyle.Short);

  const firstActionRow = new ActionRowBuilder().addComponents(email);
  const secondicActionRow = new ActionRowBuilder().addComponents(username);
  const thirdActionRow = new ActionRowBuilder().addComponents(reason);

  modal.addComponents(firstActionRow, secondicActionRow, thirdActionRow);

  let choices;
  if (interaction.isStringSelectMenu()) {
    choices = interaction.values;

    const result = choices.join(' ');

    try {
      const filter = { Guild: interaction.guild.id };
      const update = { Ticket: result };

      await ticketSchema.updateOne(filter, update, { new: true });
    } catch (error) {
      console.error('Error updating ticket data:', error);
    }
  }

  if (!interaction.isModalSubmit()) {
    interaction.showModal(modal);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal') {
      try {
        const data = await ticketSchema.findOne({
          Guild: interaction.guild.id,
        });
        const emailInput = interaction.fields.getTextInputValue('email');
        const usernameInput = interaction.fields.getTextInputValue('username');
        const reasonInput = interaction.fields.getTextInputValue('reason');

        const posChannel = await interaction.guild.channels.cache.find(
          (c) => c.name === `ticket-${interaction.user.id}`
        );

        if (posChannel) {
          return await interaction.reply({
            content: `You already have a ticket open - ${posChannel}`,
            ephemeral: true,
          });
        }

        const category = data.Channel;

        const embed = new EmbedBuilder()
          .setColor('DarkRed')
          .setTitle(`${interaction.user.username}'s Ticket`)
          .setDescription(
            `Welcome to your ticket! Please wait while the staff review your information.`
          )
          .addFields({ name: `Email`, value: `${emailInput}` })
          .addFields({ name: `Username`, value: `${usernameInput}` })
          .addFields({ name: `Reason`, value: `${reasonInput}` })
          .addFields({ name: `Type`, value: `${data.Ticket}` })
          .setFooter({ text: `${interaction.guild.name} tickets` });

        const button = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket')
            .setLabel(`🗑️ Close Ticket`)
            .setStyle(ButtonStyle.Danger)
        );

        let channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: `${category}`,
          permissionOverwrites: [
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.guild.roles.everyone,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
          ],
        });

        let msg = await channel.send({
          embeds: [embed],
          components: [button],
        });
        await interaction.reply({
          content: `Your ticket is now open in ${channel}`,
          ephemeral: true,
        });

        const collector = msg.createMessageComponentCollector();

        collector.on('collect', async (i) => {
          (await channel).delete();

          const dmEmbed = new EmbedBuilder()
            .setColor('DarkRed')
            .setTitle(`Your ticket has been closed.`)
            .setDescription(
              `Thanks for contacting us! If you need anything else, feel free to create another ticket. Dattebayo!`
            )
            .setFooter({ text: `${interaction.guild.name} tickets` })
            .setTimestamp();

          await interaction.user.send({ embeds: [dmEmbed] }).catch((err) => {
            return;
          });
        });
      } catch (error) {
        console.error('Error finding ticket data:', error);
      }
    }
  }
});

//SNIPE COMMAND

client.snipes = new Map();
client.on('messageDelete', function (message, channel) {
  client.snipes.set(message.channel.id, {
    content: message.content,
    author: message.author,
    image: message.attachments.first()
      ? message.attachments.first().proxyURL
      : null,
  });
});

//MODMAIL

const modSchema = require('./Schemas.js/mod');
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const guildID = '1130452321621520414';
  const guild = client.guilds.cache.get(guildID);

  if (message.channel.type == ChannelType.DM) {
    const member = message.author;

    try {
      const data = await modSchema.findOne({ Guild: guild.id, User: member });

      if (!data) {
        await modSchema.create({
          Guild: guild.id,
          User: member.id,
        });
      } else {
        await modSchema.create({
          Guild: guild.id,
          User: member.id,
        });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: 'An error occurred while executing the command.',
        ephemeral: true,
      });
    }

    if (message.attachments.size > 0) {
      message.react('❌');
      return member.send('I cannot send this message.');
    }

    const posChannel = guild.channels.cache.find(
      (c) => c.name === `${message.author.id}`
    );

    if (posChannel) {
      const embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setAuthor({
          name: `${message.author.username}`,
          iconURL: `${message.author.displayAvatarURL()}`,
        })
        .setDescription(`${message.content}`);

      posChannel.send({ embeds: [embed] });
      message.react('📨');
      return;
    }

    const category = guild.channels.cache.get('1130888116664811580');
    const channel = await guild.channels.create({
      name: message.author.id,
      type: ChannelType.GuildText,
      parent: category,
      topic: `A mail sent by ${message.author.tag}`,
    });

    member
      .send(`Your modmail conversation has been started in ${guild.name}`)
      .catch((err) => {
        return;
      });

    const embed = new EmbedBuilder()
      .setTitle('NEW MODMAIL')
      .setColor('DarkRed')
      .setAuthor({
        name: `${message.author.username}`,
        iconURL: `${message.author.displayAvatarURL()}`,
      })
      .setDescription(`${message.content}`)
      .setTimestamp()
      .setFooter({ text: 'Use the button below to close this mail.' });

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('button')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Close')
        .setEmoji('🔐')
    );

    const m = await channel.send({ embeds: [embed], components: [button] });

    const collector = m.createMessageComponentCollector();

    collector.on('collect', async (i) => {
      if (i.customId === 'button') {
        await channel.delete();
        member.send(
          `Your ModMail conversation in ${guild.name} has been deleted closed by a moderator.`
        );
      }
    });

    m.pin();
    message.react('📨');
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.type === ChannelType.GuildText) {
    const guildID = '1130452321621520414';
    const guild = client.guilds.cache.get(guildID);

    try {
      const data = await modSchema.findOne({
        Guild: guild.id,
        User: message.channel.name,
      });

      if (data) {
        const colChannel = guild.channels.cache.find(
          (c) => c.name === `${data.User}`
        );

        if (message.channel === colChannel) {
          if (message.author.bot) return;

          const memberID = data.User;
          const member = await client.users.fetch(memberID);

          if (message.attachments.size > 0) {
            message.react('❌');
            return member.send('I cannot send this message.');
          }

          message.react('📨');

          const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setAuthor({
              name: `${message.author.username}`,
              iconURL: `${message.author.displayAvatarURL()}`,
            })
            .setDescription(`${message.content}`);

          member.send({ embeds: [embed] });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
});

//LEVELING SYSTEM

const levelSchema = require('./Schemas.js/level');

const levelRoles = {
  5: 'Ephemeral Novice (Level 5+)',
  10: 'Otaku Trainee (Level 10+)',
  15: 'Kawaii Adept (Level 15+)',
  20: 'Senpai Seeker (Level 20+)',
  25: 'Manga Master (Level 25+)',
  30: 'Waifu Warrior (Level 30+)',
  40: 'Sugoi Specialist (Level 40+)',
  50: 'Nyan Nurturer (Level 50+)',
  60: 'Sushi Sensei (Level 60+)',
  70: 'Ramen Ronin (Level 70+)',
  80: 'Onigiri Overlord (Level 80+)',
  90: 'Baka Boss (Level 90+)',
  100: 'Weeb Almighty (Level 100+)',
};

client.on(Events.MessageCreate, async (message) => {
  const { guild, author } = message;

  if (!guild || author.bot) return;

  let data = await levelSchema.findOne({ Guild: guild.id, User: author.id });

  if (!data) {
    data = await levelSchema.create({
      Guild: guild.id,
      User: author.id,
      XP: 0,
      Level: 0,
    });
  }

  const channel = message.channel;
  const give = 1;
  const requireXP = data.Level * data.Level * 20 + 20;

  if (data.XP + give >= requireXP) {
    data.XP += give;
    data.Level += 1;
    await data.save();

    if (channel) {
      const embed = new EmbedBuilder()
        .setColor('Purple')
        .setDescription(
          `${author}, you have reached Level ${data.Level}! Where yo hoes at?`
        )
        .setImage('https://i.imgur.com/f1Ox6xz.jpg');

      channel.send({ embeds: [embed] });
    }

    // Check if the member reached a level with a corresponding role
    if (levelRoles[data.Level]) {
      const roleName = levelRoles[data.Level];
      const role = guild.roles.cache.find((r) => r.name === roleName);

      if (role) {
        // Add the role to the member
        const member = guild.members.cache.get(author.id);
        member.roles.add(role).catch((err) => {
          console.error(`Error adding role to member: ${err}`);
        });

        // Notify the member about receiving the role
        if (channel) {
          channel.send(
            `Congratulations, ${author}! You reached Level ${data.Level} and received the role ${role}`
          );
        }
      } else {
        console.error(`Role "${roleName}" not found in the server.`);
      }
    }
  } else {
    data.XP += give;
    await data.save();
  }
});

//INVITE LOGGING SYTSEM

const inviteSchema = require('./Schemas.js/inviteSchema');
const internal = require('stream');

const invites = new Collection();
const wait = require('timers/promises').setTimeout;

client.on('ready', async () => {
  await wait(2000);

  client.guilds.cache.forEach(async (guild) => {
    const clientMember = guild.members.cache.get(client.user.id);

    if (!clientMember.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return;

    const firstInvites = await guild.invites.fetch().catch((err) => {
      console.log(err);
    });

    invites.set(
      guild.id,
      new Collection(firstInvites.map((invite) => [invite.code, invite.uses]))
    );
  });
});

client.on(Events.GuildMemberAdd, async (member) => {
  const Data = await inviteSchema.findOne({ Guild: member.guild.id });
  if (!Data) return;

  const channelID = Data.Channel;

  const channel = member.guild.channels.cache.get(channelID);

  const newInvites = await member.guild.invites.fetch();

  const oldInvites = invites.get(member.guild.id);

  const invite = newInvites.find((i) => i.uses > oldInvites.get(i.code));

  if (invite) {
    const inviter = await client.users.fetch(invite.inviter.id);

    channel.send(
      `${member.user.tag} joined the server using the invite ${
        invite.code
      } from ${
        inviter ? inviter.tag : 'an unknown user'
      }. The invite was used ${invite.uses} time(s).`
    );
  } else {
    channel.send(
      `${member.user.tag} joined the server but I can't find what invite they used to join.`
    );
  }
});

//WELCOME/LEAVE MESSAGE

client.on(Events.GuildMemberAdd, async (member) => {
  const channelID = await db.get(`welchannel_${member.guild.id}`);
  const channel = member.guild.channels.cache.get(channelID);
  const totalMembers = member.guild.memberCount;

  const joinMessage = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle('Welcome to Hamzonia!')
    .setAuthor({
      name: `Ohayo, ${member.user.username}!`,
      iconURL: 'https://i.imgur.com/mdtmwJk.jpg',
    })
    .setDescription(
      `Welcome to the realm of ultimate kawaii and sugoi adventures! Let's embrace the power of friendship and embark on an unforgettable anime journey together!\nMake sure to check out <#1130456097652748360> and <#1130456332911247471>`
    )
    .setThumbnail(`${member.user.displayAvatarURL()}`)
    .setImage('https://i.ytimg.com/vi/2t77sQoZjhw/maxresdefault.jpg')
    .setTimestamp()
    .setFooter({ text: `You are the ${totalMembers}th here!` });

  if (channelID == null) return;

  channel.send({ embeds: [joinMessage] });
});

client.on(Events.GuildMemberRemove, async (member) => {
  const welcomeChannelId = '1130452322489733193'; // Replace this with the ID of the channel where you want to send the welcome message
  const totalMembers = member.guild.memberCount;

  const welcomeMessage = new EmbedBuilder()
    .setColor('Red')
    .setTitle("Looks like the rookie couldn't last longer!")
    .setAuthor({
      name: `Sayonara, ${member.user.username}...`,
      iconURL: 'https://i.imgur.com/mdtmwJk.jpg',
    })
    .setDescription(
      `Farewell, loser! Your anime antics won't be missed. Get lost and don't let the door hit you on your weeb butt. Good riddance!`
    )
    .setThumbnail(`${member.user.displayAvatarURL()}`)
    .setImage(
      'https://thumbs.gfycat.com/UltimateEmbarrassedAustraliancurlew-size_restricted.gif'
    )
    .setTimestamp()
    .setFooter({ text: `*spit* You serve no purpose anyway.` });

  try {
    const welcomeChannel = await member.guild.channels.fetch(welcomeChannelId);

    if (!welcomeChannel) {
      console.log(`Welcome channel not found with ID: ${welcomeChannelId}`);
      return;
    }

    welcomeChannel.send({ embeds: [welcomeMessage] });
  } catch (error) {
    console.error(`Error sending welcome message: ${error}`);
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const role = await db.get(`autorole_${member.guild.id}`);
  const giveRole = await member.guild.roles.cache.get(role);

  member.roles.add(giveRole);
});

//ModLogs

client.on(Events.ChannelCreate, async (channel) => {
  channel.guild
    .fetchAuditLogs({
      type: AuditLogEvent.ChannelCreate,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = channel.name;
      const id = channel.id;
      let type = channel.type;

      if (type == 0) type = 'Text';
      if (type == 2) type = 'Voice';
      if (type == 13) type = 'Stage';
      if (type == 15) type = 'Form';
      if (type == 5) type = 'Announcement';
      if (type == 4) type = 'Category';

      const channelID = '1130793487437139970';
      const mChannel = await channel.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Channel Created')
        .addFields({
          name: 'Channel Name',
          value: `${name} (<#${id}>)`,
          inline: false,
        })
        .addFields({ name: 'Channel Type', value: `${type}`, inline: false })
        .addFields({ name: 'Channel ID', value: `${id}`, inline: false })
        .addFields({
          name: 'Created By',
          value: `${executor.tag}`,
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: 'Mod Logging System' });

      mChannel.send({ embeds: [embed] });
    });
});

client.on(Events.ChannelDelete, async (channel) => {
  channel.guild
    .fetchAuditLogs({
      type: AuditLogEvent.ChannelDelete,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = channel.name;
      const id = channel.id;
      let type = channel.type;

      if (type == 0) type = 'Text';
      if (type == 2) type = 'Voice';
      if (type == 13) type = 'Stage';
      if (type == 15) type = 'Form';
      if (type == 5) type = 'Announcement';
      if (type == 4) type = 'Category';

      const channelID = '1130793487437139970';
      const mChannel = await channel.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Channel Deleted')
        .addFields({
          name: 'Channel Name',
          value: `${name}`,
          inline: false,
        })
        .addFields({ name: 'Channel Type', value: `${type}`, inline: false })
        .addFields({ name: 'Channel ID', value: `${id}`, inline: false })
        .addFields({
          name: 'Deleted By',
          value: `${executor.tag}`,
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: 'Mod Logging System' });

      mChannel.send({ embeds: [embed] });
    });
});

client.on(Events.GuildBanAdd, async (member) => {
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberBanAdd,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = member.user.username;
      const id = member.user.id;

      const channelID = '1130795444352593951';
      const mChannel = await member.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Member Banned')
        .addFields({
          name: 'Member Name',
          value: `${name} (<@${id}>)`,
          inline: false,
        })
        .addFields({ name: 'Member ID', value: `${id}`, inline: false })
        .addFields({
          name: 'Banned By',
          value: `${executor.tag}`,
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: 'Mod Logging System' });

      mChannel.send({ embeds: [embed] });
    });
});

client.on(Events.GuildBanRemove, async (member) => {
  member.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MemberBanRemove,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const name = member.user.username;
      const id = member.user.id;

      const channelID = '1130795444352593951';
      const mChannel = await member.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Member Unbanned')
        .addFields({
          name: 'Member Name',
          value: `${name} (<@${id}>)`,
          inline: false,
        })
        .addFields({ name: 'Member ID', value: `${id}`, inline: false })
        .addFields({
          name: 'Unbanned By',
          value: `${executor.tag}`,
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: 'Mod Logging System' });

      mChannel.send({ embeds: [embed] });
    });
});

client.on(Events.MessageDelete || Events.MessageBulkDelete, async (message) => {
  message.guild
    .fetchAuditLogs({
      type: AuditLogEvent.MessageDelete,
    })
    .then(async (audit) => {
      const { executor } = audit.entries.first();

      const mes = message.content;

      if (!mes) return;

      const channelID = '1130798411080282182';
      const mChannel = await message.guild.channels.cache.get(channelID);

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Message Deleted')
        .addFields({
          name: 'Message Content',
          value: `${mes}`,
          inline: false,
        })
        .addFields({
          name: 'Message Channel',
          value: `${message.channel}`,
          inline: false,
        })
        .addFields({
          name: 'Deleted By',
          value: `${executor.tag}`,
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: 'Mod Logging System' });

      mChannel.send({ embeds: [embed] });
    });
});

//REACTION ROLES

const reactions = require('./Schemas.js/reactionrs');
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (!reaction.message.guildId) return;
  if (user.bot) return;

  let cID = `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
  if (!reaction.emoji.id) cID = reaction.emoji.name;

  const data = await reactions.findOne({
    Guild: reaction.message.guildId,
    Message: reaction.message.id,
    Emoji: cID,
  });
  if (!data) return;

  const guild = await client.guilds.cache.get(reaction.message.guildId);
  const member = await guild.members.cache.get(user.id);

  try {
    await member.roles.add(data.Role);
  } catch (e) {
    return;
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (!reaction.message.guildId) return;
  if (user.bot) return;

  let cID = `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
  if (!reaction.emoji.id) cID = reaction.emoji.name;

  const data = await reactions.findOne({
    Guild: reaction.message.guildId,
    Message: reaction.message.id,
    Emoji: cID,
  });
  if (!data) return;

  const guild = await client.guilds.cache.get(reaction.message.guildId);
  const member = await guild.members.cache.get(user.id);

  try {
    await member.roles.remove(data.Role);
  } catch (e) {
    return;
  }
});

//SKULLBOARD SYSTEM

const skullboardSchema = require('./Schemas.js/skullBoardSchema');

const processedMessages = new Set();

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  const { message } = reaction;
  const { guild } = message;
  const member = guild.members.cache.get(user.id);

  if (member.bot) return;

  const data = await skullboardSchema.findOne({ Guild: guild.id });
  if (!data) return;

  await message.fetch();

  if (reaction.emoji.name === '💀') {
    const member = guild.members.cache.get(message.author.id);
    if (message.reactions.cache.get('💀').count >= data.Threshold) {
      const skullboardChannel = guild.channels.cache.get(data.Channel);
      if (skullboardChannel) {
        if (processedMessages.has(message.id)) {
          return; // Skip processing if the message has already been sent
        }

        const embed = new EmbedBuilder().setColor('Red').setAuthor({
          name: `${member.user.username}`,
          iconURL: member.user.displayAvatarURL(),
        });

        if (message.content) {
          embed.setDescription(message.content);
        }

        if (message.attachments.size > 0) {
          embed.setImage(message.attachments.first().url);
        }

        const button = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('View Original Message')
            .setStyle(ButtonStyle.Link)
            .setURL(message.url)
        );

        skullboardChannel.send({ embeds: [embed], components: [button] });

        processedMessages.add(message.id); // Add the message ID to the set of processed messages

        // Optional: You may want to remove the message ID from the set after a certain amount of time
        setTimeout(() => {
          processedMessages.delete(message.id);
        }, 10 * 60 * 1000); // Remove the message ID after 10 minutes (adjust the time as needed)
      }
    }
  }
});

// REPORT BUG
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'bugreport') {
    const command = interaction.fields.getTextInputValue('command');
    const description = interaction.fields.getTextInputValue('description');

    const id = interaction.user.id;
    const member = interaction.member;
    const server = interaction.guild.id || 'No server provided';

    const channelId = '1131601841361272875'; // Replace this with the channel ID where you want to send the bug reports
    const channel = await client.channels.fetch(channelId);

    const embed = new EmbedBuilder()
      .setColor('DarkRed')
      .setTitle(`Report from ${member.user.username}!`)
      .addFields({ name: 'User ID', value: `${id}` })
      .addFields({ name: 'Member', value: `${member}` })
      .addFields({ name: 'Server ID', value: `${server}` })
      .addFields({ name: `Command Reported`, value: `${command}` })
      .addFields({ name: `Reported Description`, value: `${description}` })
      .setTimestamp()
      .setFooter({ text: `Report Bug System` });

    await channel.send({ embeds: [embed] }).catch((err) => {});
    await interaction.reply({
      content: `Your report has been submitted`,
      ephemeral: true,
    });
  }
});
