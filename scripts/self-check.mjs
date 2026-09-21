import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const required=["template.json","README.md","AGENTS.md","LICENCE","packages/nextjs/.env.example"];
const failures=required.filter(path=>!existsSync(path)).map(path=>`missing ${path}`);
const manifest=JSON.parse(readFileSync("template.json","utf8"));
if(!manifest["create-scaffold-hbar"]) failures.push("invalid template.json");
for(const file of [".env","packages/nextjs/.env"]){if(existsSync(file)) failures.push(`committed-risk file present: ${file}`)}
for(const [name,command] of [["typecheck",["run","next:check-types"]],["lint",["run","lint"]],["test",["test"]],["build",["run","next:build"]]]){const run=spawnSync("npm",command,{stdio:"inherit",shell:process.platform==="win32"});if(run.status!==0) failures.push(`${name} failed`)}
if(failures.length){console.error(`SELF-CHECK FAILED\n- ${failures.join("\n- ")}`);process.exit(1)}
console.log("SELF-CHECK PASSED");
