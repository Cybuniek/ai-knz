import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';

async function prompt(rl, question, def = '') {
  const answer = (await rl.question(question)).trim();
  return answer || def;
}

async function main() {
  const rl = createInterface({ input, output });
  console.log('\nAI Town Project Installer');

  const installDeps = (await prompt(rl, 'Run "npm install"? [Y/n]: ', 'y')).toLowerCase();
  if (installDeps === 'y' || installDeps === 'yes') {
    execSync('npm install', { stdio: 'inherit' });
  }

  const provider = (await prompt(
    rl,
    'Choose LLM provider [ollama/openai/together/custom] (ollama): ',
    'ollama',
  )).toLowerCase();

  const envPairs = [];
  switch (provider) {
    case 'openai': {
      const key = await prompt(rl, 'OPENAI_API_KEY: ');
      envPairs.push(['OPENAI_API_KEY', key]);
      const chat = await prompt(rl, 'OPENAI_CHAT_MODEL (optional): ');
      if (chat) envPairs.push(['OPENAI_CHAT_MODEL', chat]);
      const embed = await prompt(rl, 'OPENAI_EMBEDDING_MODEL (optional): ');
      if (embed) envPairs.push(['OPENAI_EMBEDDING_MODEL', embed]);
      break;
    }
    case 'together': {
      const key = await prompt(rl, 'TOGETHER_API_KEY: ');
      envPairs.push(['TOGETHER_API_KEY', key]);
      const chat = await prompt(rl, 'TOGETHER_CHAT_MODEL (optional): ');
      if (chat) envPairs.push(['TOGETHER_CHAT_MODEL', chat]);
      const embed = await prompt(rl, 'TOGETHER_EMBEDDING_MODEL (optional): ');
      if (embed) envPairs.push(['TOGETHER_EMBEDDING_MODEL', embed]);
      break;
    }
    case 'custom': {
      const url = await prompt(rl, 'LLM_API_URL: ');
      envPairs.push(['LLM_API_URL', url]);
      const key = await prompt(rl, 'LLM_API_KEY (optional): ');
      if (key) envPairs.push(['LLM_API_KEY', key]);
      const chat = await prompt(rl, 'LLM_MODEL: ');
      envPairs.push(['LLM_MODEL', chat]);
      const embed = await prompt(rl, 'LLM_EMBEDDING_MODEL: ');
      envPairs.push(['LLM_EMBEDDING_MODEL', embed]);
      break;
    }
    default: {
      const host = await prompt(rl, 'OLLAMA_HOST (http://127.0.0.1:11434): ');
      if (host) envPairs.push(['OLLAMA_HOST', host]);
      const model = await prompt(rl, 'OLLAMA_MODEL (optional): ');
      if (model) envPairs.push(['OLLAMA_MODEL', model]);
      const embed = await prompt(rl, 'OLLAMA_EMBEDDING_MODEL (optional): ');
      if (embed) envPairs.push(['OLLAMA_EMBEDDING_MODEL', embed]);
      break;
    }
  }

  const replicate = await prompt(rl, 'REPLICATE_API_TOKEN (optional): ');
  if (replicate) envPairs.push(['REPLICATE_API_TOKEN', replicate]);

  const useClerk = (await prompt(rl, 'Configure Clerk auth? [y/N]: ', 'n')).toLowerCase();
  const envLocal = [];
  if (useClerk === 'y' || useClerk === 'yes') {
    const pk = await prompt(rl, 'VITE_CLERK_PUBLISHABLE_KEY: ');
    const sk = await prompt(rl, 'CLERK_SECRET_KEY: ');
    envLocal.push(`VITE_CLERK_PUBLISHABLE_KEY=${pk}`);
    envLocal.push(`CLERK_SECRET_KEY=${sk}`);
  }

  const selfHost = (await prompt(rl, 'Self-hosting Convex? [y/N]: ', 'n')).toLowerCase();
  if (selfHost === 'y' || selfHost === 'yes') {
    const key = await prompt(rl, 'CONVEX_SELF_HOSTED_ADMIN_KEY: ');
    const url = await prompt(rl, 'CONVEX_SELF_HOSTED_URL (http://127.0.0.1:3210): ');
    envLocal.push(`CONVEX_SELF_HOSTED_ADMIN_KEY="${key}"`);
    envLocal.push(`CONVEX_SELF_HOSTED_URL=${url || 'http://127.0.0.1:3210'}`);
  }

  rl.close();

  for (const [key, val] of envPairs) {
    if (val) {
      execSync(`npx convex env set ${key} "${val}"`, { stdio: 'inherit' });
    }
  }

  if (envLocal.length) {
    const path = '.env.local';
    let content = '';
    try {
      content = await fs.readFile(path, 'utf8');
    } catch {}
    content += '\n' + envLocal.join('\n') + '\n';
    await fs.writeFile(path, content);
    console.log(`Updated ${path}`);
  }

  console.log('\nSetup complete. Run "npm run dev" to start the project.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
