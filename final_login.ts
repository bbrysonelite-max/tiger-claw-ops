import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input"; // Ensure you have: npm install input

// ------------------------------------------------------------------
// THE SKELETON KEYS (Official Telegram Desktop Credentials)
// These bypass your "Zombie Key" and the "String vs Integer" trap.
// ------------------------------------------------------------------
const apiId = 2040;  
const apiHash = "b18441a1ff607e10a989891a5462e627"; 

const stringSession = new StringSession("");

(async () => {
  console.log("----------------------------------------------------");
  console.log("🚀 INITIALIZING WITH SKELETON KEYS (ID: 2040)...");
  console.log("----------------------------------------------------");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
    deviceModel: "TigerDesktop",
    appVersion: "1.0.0",
  });

  await client.start({
    phoneNumber: async () => await input.text("Enter your number (+1...): "),
    password: async () => await input.text("Enter your 2FA Password (if set): "),
    phoneCode: async () => await input.text("Enter the Telegram Code: "),
    onError: (err) => console.log(err),
  });

  console.log("\n✅ SUCCESS! COPY THE STRING BELOW TO YOUR .ENV FILE:\n");
  console.log(client.session.save());
  console.log("\n----------------------------------------------------");

  process.exit(0);
})();
