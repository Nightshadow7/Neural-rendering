import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '-p', '3002'], { stdio: ['inherit', 'pipe', 'inherit'] });
let announced = false;
child.stdout.on('data', data => {
 process.stdout.write(data);
 if (!announced && data.toString().includes('Ready')) {
  announced = true;
  console.log('\n  Visualización: http://127.0.0.1:3002/\n  Arañita:       http://127.0.0.1:3002/arañita\n');
 }
});
child.on('error', error => { console.error('No se pudo iniciar:', error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
