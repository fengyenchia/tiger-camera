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
  console.log(await hash(password, 12));
}
