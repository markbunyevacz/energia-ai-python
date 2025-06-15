const { exec } = require('child_process');

async function repairMigrations() {
  try {
    await executeCommand('supabase migration repair --status reverted 20240320');
    await executeCommand('supabase db pull');
    await executeCommand('supabase migration up');
    // console.log('Migration repair completed successfully');
  } catch (error) {
    console.error('Migration repair failed:', error);
  }
}

function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error) => {
      if (error) reject(error);
      resolve();
    });
  });
}

repairMigrations(); 
