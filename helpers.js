import 'dotenv/config';
import { writeFile } from 'fs';

export const getRandomNumber = () => Math.floor(Math.random() * (100 - 1)) + 1;
export const isAdmin = (user_id) => user_id == process.env.ADMIN_ID;


export function reWriteFile(parsedJSON, fromCommand, addMessage) {
    var stringifyJSON = JSON.stringify(parsedJSON);
    writeFile('./db/users.json', stringifyJSON, function(err) {
        if(err) return console.log('Some error after adding a user:' + err);
        else console.log(`File after ${fromCommand} command saved. [${addMessage ?? 'No additional message.'}]`);
    });
};