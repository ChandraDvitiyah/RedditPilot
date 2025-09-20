import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, handleError } from '../_lib/auth';

export default withAuth(async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { projectId, subreddits, karmaLevel, analytics } = body || {};
    if (!projectId || !Array.isArray(subreddits) || typeof karmaLevel === 'undefined') {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const totalDays: number = Number(body?.totalDays || 14);
    const timelinePhases = await generateTimelineTasks(subreddits, karmaLevel, analytics || [], { totalDays });
    return res.status(200).json({ timeline: timelinePhases, message: 'Timeline generated successfully' });
  } catch (error) {
    return handleError(res, error, 'Failed to generate timeline');
  }
});

// ---- Helpers: templates, details, generation (ported from dev server) ----
function getTemplateForType(type: string, title: string, primarySub: string, allSubs: string[]) {
  const commonHeader = `Hi ${primarySub ? `r/${primarySub}` : 'everyone'},\n\n`;
  switch (type) {
    case 'launch': {
      const launchVariants = [
        { title: 'I built {catchy_project_description}', body: `{product_media}\n\nHere’s how it works:\n\n{core_concept_1}\n\n{core_concept_2}\n\n{core_concept_3}\n\nBasically, {one_line_summary}.\n\nWould you like to try it out?\n\n{call_to_action}` },
        { title: 'Made a {short_project_description}', body: `{product_demo_video}\n\nCheck out a quick demo above — would love to hear feedback.` },
        { title: 'Wanted something better than {competitor}, made it myself in {time_frame}', body: `{demo_video}\n\nI was frustrated with {competitor} because {reason}. So I built {project_name} to solve that by {unique_approach}.` }
      ];
      const pick = (title || '').toString();
      let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
      const id = launchVariants.length ? (sum % launchVariants.length) : 0;
      const chosen = launchVariants[id];
      return `${chosen.title}\n\n${commonHeader}${chosen.body}`;
    }
    case 'milestone': {
      const milestoneVariants = [
        { title: "X months of building — what nobody tells you", body: `I've been building {project_name}...` },
        { title: "My app made $[REVENUE] — how", body: `I’ve been building {product_category}...` },
        { title: "Side project crossed $[MRR] MRR", body: `I can’t believe it, but my side project...` }
      ];
      const pick = (title || '').toString();
      let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
      const id = milestoneVariants.length ? (sum % milestoneVariants.length) : 0;
      const chosen = milestoneVariants[id];
      return `${chosen.title}\n\n${commonHeader}${chosen.body}`;
    }
    case 'ama': {
      const amaVariants = [
        { title: "[Achievement] — here’s how it happened", body: `Hey {community_name} 👋\n\nI wanted to share the journey...` },
        { title: "My [PROJECT] made $[REVENUE] — AMA", body: `Hi {community_name},\n\nMy {project_name} just passed...` },
        { title: "[PROJECT] helped [#] — AMA", body: `Hello {community_name},\n\nI’m {founder_name}, founder of {project_name}...` }
      ];
      const pick = (title || '').toString();
      let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
      const id = amaVariants.length ? (sum % amaVariants.length) : 0;
      const chosen = amaVariants[id];
      return `${chosen.title}\n\n${commonHeader}${chosen.body}`;
    }
    case 'value':
      return `${commonHeader}Here’s one helpful tip we use in {project_name}: {practical_tip}\n\nWhy it matters: {why_it_matters}`;
    case 'journey':
      return `${commonHeader}The story of how {project_name} came to be:\n\n{origin_story_paragraph}`;
    case 'resource':
      return `${commonHeader}Found a resource that helped us build {project_name}: {resource_title} — {resource_link}`;
    default:
      return `${commonHeader}${title}\n\n{body}\n`;
  }
}

function getDetailsForType(type: string) {
  const tips: any = {
    launch: { checklist: ['Read rules', 'Proper flair', 'Short intro'], step_by_step: ['Draft', 'Proofread', 'Post at peak hour'], posting_tips: 'Be specific and honest.' },
    milestone: { checklist: ['Real numbers', '2 concrete changes'], step_by_step: ['Headline with milestone', 'List changes', 'Invite questions'], posting_tips: 'Avoid overclaiming.' },
    ama: { checklist: ['Pick time', 'Prepare topics'], step_by_step: ['Announce', 'Answer quickly', 'Summarize later'], posting_tips: 'Use bullet points.' },
  };
  return tips[type] || { checklist: [], step_by_step: [], posting_tips: '' };
}

async function generateTimelineTasks(subreddits: string[], karmaLevel: number, analytics: any[] = [], options: { totalDays?: number } = {}) {
  const clean = (s: string) => s.replace(/^r\//i, '').toLowerCase();
  const cleanedSubs = subreddits.map(clean);
  const analyticsMap = new Map<string, any>();
  (analytics || []).forEach((a: any) => { const key = clean(a?.subreddit || a?.subreddit_name || ''); if (key) analyticsMap.set(key, a); });
  const engagementByKarma: Record<number, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };
  const engagementDays = engagementByKarma[Math.min(Math.max(Math.floor(karmaLevel), 1), 5)] || 3;
  const TOTAL_DAYS = Math.max(7, Math.min(90, Number(options.totalDays || 14)));
  const tasks: any[] = [];
  const postsPerDay = Array(TOTAL_DAYS).fill(0);
  const scheduledHoursPerDay: number[][] = Array.from({ length: TOTAL_DAYS }, () => []);
  const lastPostDayBySub = new Map<string, number>();
  const reservedDayHour = new Set<string>();

  const subSlots = new Map<string, number[]>();
  cleanedSubs.forEach((s) => {
    const a = analyticsMap.get(s);
    let slots: number[] = [];
    if (a) {
      if (typeof a.best_posting_hour === 'number') slots = [a.best_posting_hour, (a.best_posting_hour + 6) % 24, (a.best_posting_hour + 12) % 24];
      else if (Array.isArray(a.activity_heatmap)) {
        const hourSums = Array.from({ length: 24 }, (_, i) => 0);
        a.activity_heatmap.forEach((row: number[]) => row.forEach((v: number, hr: number) => (hourSums[hr] += Number(v || 0))));
        slots = hourSums.map((v: number, i: number) => ({ v, i })).sort((x: any, y: any) => y.v - x.v).slice(0, 3).map((x: any) => x.i);
      }
    }
    if (!slots.length) slots = [12, 18, 20];
    subSlots.set(s, slots);
  });

  const hasGlobalConflict = (candidateDay: number, candidateHour: number) => {
    const base = new Date();
    const cand = new Date(base); cand.setUTCDate(base.getUTCDate() + candidateDay); cand.setUTCHours(candidateHour, 0, 0, 0);
    const candMs = cand.getTime();
    return tasks.some(t => t.scheduled_at && Math.abs(new Date(t.scheduled_at).getTime() - candMs) < 3 * 3600 * 1000);
  };

  const schedulePost = (desiredDay: number, subreddit: string, template: string, title: string, opts?: { ignoreCooldown?: boolean }) => {
    const minGapHours = 6; const now = new Date(); const a = analyticsMap.get(subreddit);
    const prioritizedHours: number[] = [];
    if (typeof a?.best_posting_hour === 'number') prioritizedHours.push(a.best_posting_hour);
    if (Array.isArray(a?.activity_heatmap)) {
      try { const hourSums = Array.from({ length: 24 }, (_, i) => 0); a.activity_heatmap.forEach((row: number[]) => row.forEach((v: number, hr: number) => (hourSums[hr] += Number(v || 0))));
        hourSums.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v).forEach(({ i }) => { if (!prioritizedHours.includes(i)) prioritizedHours.push(i); }); } catch {}
    }
    [21, 18, 12].forEach(h => { if (!prioritizedHours.includes(h)) prioritizedHours.push(h); });
    const preferredWeekday = (typeof a?.best_posting_day === 'number') ? a.best_posting_day : 4;
    for (const hour of prioritizedHours) {
      const preferredDays: number[] = []; const otherDays: number[] = [];
      for (let d = desiredDay; d < TOTAL_DAYS; d++) { const dt = new Date(now); dt.setUTCDate(now.getUTCDate() + d); (dt.getUTCDay() === preferredWeekday ? preferredDays : otherDays).push(d); }
      for (const day of [...preferredDays, ...otherDays]) {
        if (postsPerDay[day] >= 2) continue; const last = lastPostDayBySub.get(subreddit); const ignoreCooldown = !!opts?.ignoreCooldown; const onlyOne = cleanedSubs.length === 1;
        if (!onlyOne && !ignoreCooldown && last !== undefined && (day - last) < 7) continue;
        const hoursUsed = scheduledHoursPerDay[day]; const key = `${day}-${hour}`; if (reservedDayHour.has(key)) continue; if (hasGlobalConflict(day, hour)) continue;
        const ok = hoursUsed.every(h => Math.abs(h - hour) >= minGapHours); if (!ok) continue;
        const id = `post_${tasks.length + 1}`; const scheduledDate = new Date(now); scheduledDate.setUTCDate(now.getUTCDate() + day); scheduledDate.setUTCHours(hour, 0, 0, 0);
        const t: any = { id, type: 'post', title, duration_days: 1, order: tasks.length + 1, subreddits: [subreddit], status: 'pending', template, scheduled_day: day, scheduled_hour: hour, scheduled_at: scheduledDate.toISOString() };
        try { const tpl = getTemplateForType(template, title, cleanedSubs[0], cleanedSubs); if (tpl?.trim()) t.post_template = tpl; } catch {}
        tasks.push(t); postsPerDay[day]++; scheduledHoursPerDay[day].push(hour); reservedDayHour.add(key); lastPostDayBySub.set(subreddit, day); return t;
      }
    }
    // fallback
    for (let day = desiredDay; day < TOTAL_DAYS; day++) {
      if (postsPerDay[day] >= 2) continue; const last = lastPostDayBySub.get(subreddit); const onlyOne = cleanedSubs.length === 1; if (!onlyOne && last !== undefined && (day - last) < 7) continue;
      for (const hour of (subSlots.get(subreddit) || [12, 18, 20])) {
        const hoursUsed = scheduledHoursPerDay[day]; const key = `${day}-${hour}`; if (reservedDayHour.has(key)) continue; if (hasGlobalConflict(day, hour)) continue;
        const ok = hoursUsed.every(h => Math.abs(h - hour) >= minGapHours); if (!ok) continue;
        const id = `post_${tasks.length + 1}`; const scheduledDate = new Date(); scheduledDate.setUTCDate(scheduledDate.getUTCDate() + day); scheduledDate.setUTCHours(hour, 0, 0, 0);
        const t: any = { id, type: 'post', title, duration_days: 1, order: tasks.length + 1, subreddits: [subreddit], status: 'pending', template, scheduled_day: day, scheduled_hour: hour, scheduled_at: scheduledDate.toISOString() };
        try { const tpl = getTemplateForType(template, title, cleanedSubs[0], cleanedSubs); if (tpl?.trim()) t.post_template = tpl; } catch {}
        tasks.push(t); postsPerDay[day]++; scheduledHoursPerDay[day].push(hour); reservedDayHour.add(key); lastPostDayBySub.set(subreddit, day); return t;
      }
    }
    const fallbackDay = Math.min(TOTAL_DAYS - 1, desiredDay); const fallbackHour = 12; const id = `post_${tasks.length + 1}`; const scheduledDate = new Date(); scheduledDate.setUTCDate(scheduledDate.getUTCDate() + fallbackDay); scheduledDate.setUTCHours(fallbackHour, 0, 0, 0);
    const t = { id, type: 'post', title, duration_days: 1, order: tasks.length + 1, subreddits: [subreddit], status: 'pending', template, scheduled_day: fallbackDay, scheduled_hour: fallbackHour, scheduled_at: scheduledDate.toISOString() };
    tasks.push(t); postsPerDay[fallbackDay]++; scheduledHoursPerDay[fallbackDay].push(fallbackHour); reservedDayHour.add(`${fallbackDay}-${fallbackHour}`); lastPostDayBySub.set(subreddit, fallbackDay); return t;
  };

  // engagement days
  for (let d = 0; d < Math.min(engagementDays, TOTAL_DAYS); d++) {
    const sub = cleanedSubs[d % cleanedSubs.length];
    const slots = subSlots.get(sub) || [12, 18, 20]; const hr = slots[0]; const key = `${d}-${hr}`; if (reservedDayHour.has(key)) continue;
    const scheduled = new Date(); scheduled.setUTCDate(scheduled.getUTCDate() + d); scheduled.setUTCHours(hr, 0, 0, 0);
    tasks.push({ id: `engagement_${d + 1}`, type: 'engagement', title: `Engage: Comment and contribute to r/${sub}`, duration_days: 1, order: tasks.length + 1, subreddits: [sub], status: 'pending', scheduled_day: d, scheduled_hour: hr, scheduled_at: scheduled.toISOString() });
    reservedDayHour.add(key); postsPerDay[d]++; scheduledHoursPerDay[d].push(hr); lastPostDayBySub.set(sub, d);
  }

  // per-subreddit chain: launch -> milestone -> ama
  const amaOffsetByKarma: Record<number, [number, number]> = { 1: [5, 7], 2: [4, 6], 3: [3, 5], 4: [2, 4], 5: [2, 3] };
  const k = Math.min(Math.max(Math.floor(karmaLevel), 1), 5); const [amaMin, amaMax] = amaOffsetByKarma[k];
  for (const sub of cleanedSubs) {
    const launch = schedulePost(engagementDays, sub, 'launch', `Launch post in r/${sub}`, { ignoreCooldown: true });
    if (launch) {
      const milestoneDesired = Math.min(launch.scheduled_day + (3 + Math.floor(Math.random() * 3)), TOTAL_DAYS - 2);
      schedulePost(milestoneDesired, sub, 'milestone', `Milestone update in r/${sub}`, { ignoreCooldown: true });
      const amaDesired = Math.min(milestoneDesired + (amaMin + Math.floor(Math.random() * (amaMax - amaMin + 1))), TOTAL_DAYS - 1);
      schedulePost(amaDesired, sub, 'ama', `AMA in r/${sub}`, { ignoreCooldown: true });
    }
  }

  // Build phases
  const phases: any[] = [];
  const tasksByTemplateAndSub = new Map<string, Map<string, any[]>>();
  tasks.forEach(t => { const tpl = t.template || t.type || 'post'; const bySub = tasksByTemplateAndSub.get(tpl) || new Map<string, any[]>(); const subs = (Array.isArray(t.subreddits) && t.subreddits.length) ? t.subreddits : [cleanedSubs[0]]; subs.forEach((s: string) => { const arr = bySub.get(s) || []; arr.push(t); bySub.set(s, arr); }); tasksByTemplateAndSub.set(tpl, bySub); });
  for (const sub of cleanedSubs) {
    const engagementTasks = tasks.filter(t => t.type === 'engagement' && t.subreddits?.includes(sub)).map(t => ({ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: t.post_template, details: t.details }));
    phases.push({ id: `engage_${sub}`, title: `Community Engagement — r/${sub}`, days: `Days 1-${engagementDays}`, description: `Engage authentically with r/${sub}`, tasks: engagementTasks, completed: false });
    const launchArr = (tasksByTemplateAndSub.get('launch')?.get(sub) || []).map((t: any) => ({ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: t.post_template || getTemplateForType(t.template, t.title, sub, cleanedSubs), details: getDetailsForType(t.template) }));
    if (launchArr.length) phases.push({ id: `launch_${sub}`, title: `Launch — r/${sub}`, days: launchArr[0].scheduled_day ? `Day ${launchArr[0].scheduled_day}` : '', description: `Introduce your project in r/${sub}`, tasks: launchArr, completed: false });
    const milestoneArr = (tasksByTemplateAndSub.get('milestone')?.get(sub) || []);
    const amaArr = (tasksByTemplateAndSub.get('ama')?.get(sub) || []);
    const pairs = Math.max(milestoneArr.length, amaArr.length);
    for (let i = 0; i < pairs; i++) {
      if (milestoneArr[i]) { const t = milestoneArr[i]; phases.push({ id: `milestone_${sub}_${i}`, title: `Milestone Update — r/${sub}`, days: '', description: 'Share progress and results', tasks: [{ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: t.post_template || getTemplateForType(t.template, t.title, sub, cleanedSubs), details: getDetailsForType(t.template) }], completed: false }); }
      if (amaArr[i]) { const t = amaArr[i]; phases.push({ id: `ama_${sub}_${i}`, title: `AMA — r/${sub}`, days: '', description: 'Host an AMA to engage deeply', tasks: [{ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: t.post_template || getTemplateForType(t.template, t.title, sub, cleanedSubs), details: getDetailsForType(t.template) }], completed: false }); }
    }
  }
  // Sort phases by earliest scheduled time
  const phaseTimes: Map<string, number> = new Map();
  phases.forEach((ph: any) => { const first = ph.tasks?.[0]; const t = first?.scheduled_at ? new Date(first.scheduled_at).getTime() : Number.POSITIVE_INFINITY; phaseTimes.set(ph.id, t); });
  phases.sort((a: any, b: any) => (phaseTimes.get(a.id)! - phaseTimes.get(b.id)!));
  return phases;
}
