import { hash } from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const prompt = createInterface({ input: stdin, output: stdout });
const password = await prompt.question("輸入管理員密碼（輸入內容會顯示，請在私人終端執行）：");
prompt.close();

if (password.length < 16) {
  console.error("管理員密碼至少需要 16 個字元。");
  process.exitCode = 1;
} else {
  const passwordHash = await hash(password, 12);
  console.log("\n本機 .env.local（可直接複製）：");
  console.log(`ADMIN_PASSWORD_HASH=${passwordHash.replaceAll("$", "\\$")}`);
  console.log("\nVercel Environment Variables（Value 欄位，不要加反斜線）：");
  console.log(passwordHash);
}
