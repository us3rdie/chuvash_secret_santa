import "dotenv/config";

import { getRandomNumber, isAdmin, reWriteFile } from "./helpers.js";
import { readFile, readFileSync } from "fs";

import { Telegraf } from "telegraf";
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  if (ctx.message.chat.id < 0) {
    ctx.reply("Пиши в ЛС этому боту чтобы получить номер, который нужно указать на подарке.", {
      reply_to_message_id: ctx.message.message_id
    });
    console.log(ctx.message);
  }

  let parsedJSON = JSON.parse(readFileSync("./db/users.json", "utf8"));

  let userAlreadyRegistred = false;
  // let userAlreadyRegistred = parsedJSON.some((e) =>
  //     e.telegram_id == ctx.message.from.id ? ctx.reply(`Номер, который тебе нужно укзаать на подарке: ${e.secret_santa_number}.`) : 0
  // );

  if (!userAlreadyRegistred) {
    let genRandomNumber = getRandomNumber();
    while (parsedJSON.some((e) => e.secret_santa_number == genRandomNumber)) {
      genRandomNumber = getRandomNumber();
    }

    const newUser = {
      telegram_id: ctx.message.from.id,
      first_name: ctx.message.from.first_name + (parsedJSON.length + 1),
      last_name: ctx.message.from.last_name ?? "",
      username: ctx.message.from.username,
      chat_id: ctx.message.chat.id,
      secret_santa_number: genRandomNumber,
      takes_gift_number: null
    };
    parsedJSON.push(newUser);
    reWriteFile(parsedJSON, "/start");

    return ctx.reply(
      `${ctx.message.from.first_name} ${ctx.message.from.last_name ?? ""}, теперь ты участвуешь в Тайном Санте 🎅🏻` +
        `\n\nНомер, который тебе нужно указать на подарке: ${genRandomNumber}.`
    );
  }
});

bot.command("startsanta", (ctx) => {
  const chatData = {
    chatId: ctx.message.chat.id,
    chatTitle: ctx.message.chat.title,
    chatDateStart: ctx.message.date
  };
  ctx.reply(`Для чата (${ctx.message.chat.title}) был создан Тайный Санта. `);
});

bot.command("list", (ctx) => {
  let parsedJSON = JSON.parse(readFileSync("./db/users.json", "utf8"));
  let replyTextList = parsedJSON.length == 0 ? `Участников пока нет.` : `Список (${parsedJSON.length}):`;
  for (var i in parsedJSON) {
    replyTextList += `\n${Number(i) + 1}: ${parsedJSON[i].first_name} ${parsedJSON[i].last_name}`;
  }
  return ctx.reply(replyTextList, { reply_to_message_id: ctx.message.message_id });
});

bot.command("del", (ctx) => {
  if (!isAdmin(ctx.message.from.id)) {
    return ctx.reply("⚠️ No access.");
  }

  let deleteNumber = ctx.update.message.text.split(" ")[1] ?? 1;
  let parsedJSON = JSON.parse(readFileSync("./db/users.json", "utf8"));

  if (isNaN(deleteNumber) || deleteNumber < 1 || deleteNumber > parsedJSON.length) {
    ctx.reply(`Попробуйте ещё раз, число должно быть положительным и не больше ${parsedJSON.length}.`, {
      reply_to_message_id: ctx.message.message_id
    });
  } else {
    parsedJSON.splice(deleteNumber - 1, 1);
    reWriteFile(parsedJSON, "/del");
    ctx.reply(`Пользователь под номером ${deleteNumber} удален. Команда /list для просмотра списка участников.`, {
      reply_to_message_id: ctx.message.message_id
    });
  }
});

bot.command("roll", (ctx) => {
  if (!isAdmin(ctx.message.from.id)) {
    return ctx.reply("⚠️ No access.");
  }

  let parsedJSON = JSON.parse(readFileSync("./db/users.json", "utf8"));

  if (parsedJSON.length < 3) {
    ctx.reply(`Зароллить среди ${parsedJSON.length} ${parsedJSON.length == 1 ? "человека" : "человек"} невозможно.`);
  } else {
    //var users_ids = Array(parsedJSON.length).fill().map((e, i) => i + 1);

    let users_ids = [];
    parsedJSON.forEach((el) => {
      users_ids.push(el.secret_santa_number);
    });
    //console.log("users_secret_santa_number_massive=" + users_ids);

    var ssWriteNumber = Array.from(users_ids);

    var haveSelfGift = false;
    do {
      //Fisher–Yates shuffle https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
      for (let i = ssWriteNumber.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ssWriteNumber[i], ssWriteNumber[j]] = [ssWriteNumber[j], ssWriteNumber[i]];
      }

      for (var i in users_ids) {
        if (users_ids[i] == ssWriteNumber[i]) {
          haveSelfGift = true;
          break;
        } else {
          haveSelfGift = false;
        }
      }
    } while (haveSelfGift == true);

    console.log(users_ids);
    console.log(ssWriteNumber);

    var replyText = `Йохохо, вот ваши подарочки (всего ${parsedJSON.length}):\nПодарок ➡ Участник\n`;
    for (var i in parsedJSON) {
      parsedJSON[i].takes_gift_number = ssWriteNumber[i];
      replyText += `\n${parsedJSON[i].takes_gift_number} ➡ ${parsedJSON[i].first_name} ${parsedJSON[i].last_name}`;
    }

    // var replyText = `Распределение (всего ${parsedJSON.length}):\nУчастник ➡ Номер, который он писал на подарке ➡ Номер подарка\n`;
    // for (var i in parsedJSON) {
    //     parsedJSON[i].takes_gift_number = ssWriteNumber[i];
    //     replyText += `\n${parsedJSON[i].first_name} ${parsedJSON[i].last_name} ➡ ${parsedJSON[i].secret_santa_number} ➡ ${parsedJSON[i].takes_gift_number}`;
    // }
    ctx.reply(replyText, { reply_to_message_id: ctx.message.message_id });
  }

  reWriteFile(parsedJSON, "/roll");
});

bot.help((ctx) =>
  ctx.reply(
    `Список всех команд:` +
      `\n/start - запустить бота или узнать какой номер нужно указывать на подарке;` +
      `\n/help - просмотреть справку;` +
      `\n/list - просмотреть список всех участников;` +
      `\n/del [n] - удалить участника из списка; (admin only)` +
      `\n/roll - запустить процесс распределения подарков. (admin only)`,
    { reply_to_message_id: ctx.message.message_id }
  )
);

bot.launch();
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
