// Quick test harness to call generateTimelineTasks
// Note: This file loads the server route file and calls the function directly.
(async () => {
  try {
    const mod = require('./server/routes/timeline');
    if (!mod || !mod.generateTimelineTasks) {
      console.error('generateTimelineTasks not exported; attempting to access via module exports.');
      // try to read the file and evaluate
      const g = mod.generateTimelineTasks || mod.setupTimelineRoutes;
      console.error('module keys:', Object.keys(mod));
      process.exit(1);
    }
    const gen = mod.generateTimelineTasks;
    const phases = await gen(['r/learnprogramming','r/javascript'], 3, [], { totalDays: 21 });
    console.log('Generated phases (count):', phases.length);
    phases.forEach((p, i) => {
      const earliest = p.tasks && p.tasks.length ? (p.tasks[0].scheduled_at || p.tasks[0].scheduled_day) : 'none';
      console.log(i+1, p.id, p.title, earliest, 'tasks:', p.tasks.length);
    });
  } catch (e) {
    console.error('Error running test:', e);
    process.exit(2);
  }
})();