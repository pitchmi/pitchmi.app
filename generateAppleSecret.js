import jwt from "jsonwebtoken";
import fs from "fs";

const teamId = "CS8Y258DZ2";
const keyId = "6V9GRVWL6V";
const clientId = "admin.pitchmi.app.signin";
const privateKey = fs.readFileSync("./apple/AuthKey_6V9GRVWL6V.p8", "utf8");

const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  {
    iss: teamId,
    iat: now,
    exp: now + 15777000, // 6 meses
    aud: "https://appleid.apple.com",
    sub: clientId,
  },
  privateKey,
  { algorithm: "ES256", keyid: keyId }
);

console.log(token);
