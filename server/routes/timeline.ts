import { Express } from 'express';
import { withAuth, handleError, AuthenticatedRequest } from '../index';

export function setupTimelineRoutes(app: Express) {
  // Provide a local route that mirrors the serverless timeline generator so
  // dev and production environments behave the same.
  app.post('/api/reddit/generate-timeline', withAuth(async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId, subreddits, karmaLevel, analytics, category } = req.body as any;
      if (!projectId || !subreddits || karmaLevel === undefined || karmaLevel === null) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const totalDays: number = Number(req.body.totalDays || 14);
      const timelinePhases = await generateTimelineTasks(subreddits, karmaLevel, analytics || [], { totalDays, category });
      return res.status(200).json({ timeline: timelinePhases, message: 'Timeline generated successfully' });
    } catch (error) {
      return handleError(res, error, 'Failed to generate timeline');
    }
  }));
}

// ---- Helpers: templates, details, generation (copied/synced from serverless) ----
function getTemplateForType(type: string, title: string, primarySub: string, allSubs: string[], category?: string) {
  const commonHeader = `Hi ${primarySub ? `r/${primarySub}` : 'everyone'},\n\n`;
  switch (type) {
    case 'launch': {
      if ((category || '').toLowerCase() === 'education') {
        const eduLaunch = [
          {
            title: `Study Tools for [Action - ex Creting Flashcard ]`,
            body: `Hey! I’m looking for the best AI tools to help record and summarize lectures, then turn them into flashcards or quizzes. I’ve seen a bunch of ads for apps like Coconote, TurboAI, and [Your Tool], but I’m not sure which one actually works best — or if there’s something better out there. I’m starting my freshman year of college soon, so I’d really appreciate any recommendations. Thanks!`
          },
          {
            title: `Increased my grades by X% with a simple habbit change`,
            body: `One simple habit that’s made a huge difference in my study sessions is focusing on removing friction by [effect/action] using [your tool]. I’ve realized that the best way to stay consistent and focused is to make it harder to get distracted and easier to stay on task. It doesn’t really matter what method you use the key is finding small tweaks that help you maintain momentum when studying.`
          }
        ];
        const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
        const id = eduLaunch.length ? (sum % eduLaunch.length) : 0;
        const chosen = eduLaunch[id];
        return `${chosen.title}\n\n${chosen.body}`;
      }
      if ((category || '').toLowerCase() === 'skincare') {
        const skinLaunch = [
          { title: '[Routine Help] I stopped chasing trends and built a boring routine', body: `[Relevant Image for your product]\n\nHey Reddit,\n\nI used to try all sorts of trendy products to fix {specific problem}, but after months of learning I focused on fundamentals: gentle cleansing, a solid moisturizer, and a couple of reliable actives. I\u2019ve been consistent for {time period} and my skin has improved — fewer breakouts, calmer texture.\n\nAM Routine:\n[Cleanser / product 1] — [reason]\n[Serum / product 2] — [benefits]\n[Moisturizer / product 3] — [texture/comment]\n\nPM Routine:\n[Cleanser / product 1] — [why]\n[Serum / product 2] — [active]\n[Moisturizer / product 3] — [note]\n\nMain takeaway: simple, consistent care works. Do you agree / am I on the right path?` },
          { title: 'How can I get rid of [specific skin issue / location]?', body: `[Image related to title and your product]\n\nI\u2019ve noticed {describe issue} on my {location} for {time period}. My skin type: {dry/oily/combination/sensitive}. Current routine: {brief routine}. Any tips for treatment or prevention? I\u2019ll post pics soon.` }
        ];
        const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
        const id = skinLaunch.length ? (sum % skinLaunch.length) : 0;
        const chosen = skinLaunch[id];
        return `${chosen.title}\n\n${chosen.body}`;
      }
      if ((category || '').toLowerCase() === 'saas') {
        const saasLaunch = [
          { title: 'I got fed up with {problem in your niche}, so I built my own.', body: `{product_media}\n\nHey Reddit,\n\nMost {category} tools fall into two buckets:\n– {Weakness 1}\n– {Weakness 2}\n\nNone of them actually {core emotional frustration or goal they fail at}.\n\nSo I built my own. It\u2019s called {Product Name} — a {one-line description with clear differentiator}.\n\nHere\u2019s what it does:\n– {Core function 1}\n– {Core function 2}\n– {Core function 3}\n– {Unique selling point}\n– {Tech/UX highlight}\n\nIt\u2019s live now on {platforms}, free to try: {link}\n\nWould love your honest feedback:\n– What frustrates you about current {product category}?\n– What features do you wish existed?\n\nHappy to answer questions or go deeper in the comments.` },
          { title: 'Turn {input or idea} into {output or result}', body: `\nHey Reddit,\n\nI\u2019ve been experimenting with {tech/idea in one line}. Right now, I\u2019ve built {brief description of current prototype or tool} — {product link}.\n\nIt takes {what the tool accepts} and turns it into {what it produces}. It\u2019s still rough, but you can {mention what users can try or download}.\n\nLong-term goal: {describe bigger vision briefly}.\n\nIf you\u2019re into {related fields}, I\u2019d love to connect or collaborate.` },
          { title: 'I made an app where you {fun or emotional core action / experience}', body: `\nHey Reddit,\n\nI\u2019ve always been {personal hook}. Fast forward to today — I decided to build {product name or concept}, a {short one-line description of what it is and what it does}.\n\nHere\u2019s what it does:\n– {Core feature 1}\n– {Core feature 2}\n– {Core feature 3}\n\nRight now you can [describe free tier or how to try it easily].\n\nWould love for you to give it a try and tell me what you think: {App or website link}` }
        ];
        const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
        const id = saasLaunch.length ? (sum % saasLaunch.length) : 0;
        const chosen = saasLaunch[id];
        return `${chosen.title}\n\n${chosen.body}`;
      }
      const launchVariants = [
        { title: 'I built {catchy_project_description}', body: `{product_media}\n\nHere\u2019s how it works:\n\n{core_concept_1}\n\n{core_concept_2}\n\n{core_concept_3}\n\nBasically, {one_line_summary}.\n\nWould you like to try it out?\n\n{call_to_action}` },
        { title: 'Made a {short_project_description}', body: `{product_demo_video}\n\nCheck out a quick demo above — would love to hear feedback.` },
        { title: 'Wanted something better than {competitor}, made it myself in {time_frame}', body: `{demo_video}\n\nI was frustrated with {competitor} because {reason}. So I built {project_name} to solve that by {unique_approach}.` }
      ];
      const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
      const id = launchVariants.length ? (sum % launchVariants.length) : 0;
      const chosen = launchVariants[id];
      return `${chosen.title}\n\n${commonHeader}${chosen.body}`;
    }
    case 'milestone': {
      if ((category || '').toLowerCase() === 'saas') {
        const saasMilestones = [
          { title: '[X months/years] of [your project/phase] and here\u2019s what nobody tells you', body: `Been {brief context — what you\u2019ve been doing, how you started, what tools you used}. Everyone talks about {the easy or hyped-up part}, but nobody talks about {the painful or hidden truth}.\n\n{Main lesson 1 — the “60% truth” part}\nYou can {describe what\u2019s possible or easy at first}. But then {what breaks or goes wrong when it gets real}. AI / tools / templates help a lot early, but they fail in the messy middle.\n\n{Example problem 1 — describe one real technical or business issue}\nWhat went wrong, what you thought, what the reality was, what you learned.\n\n{Example problem 2 — another one with brief story and learning}\nWhat failed, how AI or shortcuts didn\u2019t help, and the real fix or understanding you gained.\n\n{Example problem 3 — short one-line insight about a recurring pain point or theme}\n\n{Turning point paragraph}\nThe shift came when I stopped {bad habit / mindset} and started {new approach / skill / discipline}.\nStarted {describe what you actually learned or started doing differently}.\n\n{Lesson / reflection paragraph}\nYou don\u2019t need to become {expert role}, but you do need to understand {fundamentals you ignored before}. That\u2019s what separates {people who burn out} from {those who build something stable}.\n\n{Closing thought}\nMost success stories skip this part. The real game is learning enough of the fundamentals so your tools don\u2019t destroy you — then using them to move 10x faster where you actually know what\u2019s going on.\n\n{Optional final line — what you\u2019re doing now / takeaway}\nStill using {tool/process} every day, just with better judgment and a bit more humility.` },
          { title: 'It\u2019s finally happening — my SaaS just hit [$X] in [timeframe]!', body: `\n[Revenue Screenshot Image]\nJust {X weeks/months} ago, I started building {brief description of your product — what it does and who it\u2019s for}. It began as a small idea to {problem you were solving or gap you noticed}.\n\n{Insert your website or product link}\n\nWhat started as a quick experiment has grown faster than I expected — {X users, reviews, traction stats, etc.}. All organic, no paid ads.` }
        ];
        const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
        const id = saasMilestones.length ? (sum % saasMilestones.length) : 0;
        const chosen = saasMilestones[id];
        return `${chosen.title}\n\n${chosen.body}`;
      }
      if ((category || '').toLowerCase() === 'education') {
        const eduMilestones = [
          {
            title: `Day [X] of [activity/habit] on the way to [goal]`,
            body: `[Image clearly showcasing your product]\n\nDay [X] wasn’t easy at all — it takes a lot of discipline, especially on [challenging time periods, e.g., weekends, nights, mornings].\n\nBut honestly, [reflective insight — e.g., certain times can actually be easier than expected]. For example, [explain why, with a small tip or strategy].\n\nHow do you handle [relevant challenge for the audience]? Would love to hear your thoughts/tips!`
          },
          {
            title: `Your brain is literally rewiring itself when you struggle to learn something new (tips from a [your background, e.g., top student / subject expert])`,
            body: `Here’s what most people don’t realize: the [foggy/uncomfortable/difficult] feeling when you can’t recall something? It’s not failure. It’s your brain forming new connections. This is the core principle behind [active recall / learning method].\n\nBut without reinforcement, these connections fade quickly — this is [reference to forgetting curve or concept]. The fix is [spaced repetition / deliberate practice / self-testing]. Each [quiz / flashcard / review session], timed right before you’d forget, strengthens memory and builds mental resilience.\n\nThink of it like [analogy — lifting weights / building a muscle / practicing an instrument]. The struggle means growth, and [spacing / repetition / consistent practice] locks it in. You can use tools like [software/tool] to handle the timing and practice for you.\n\nWhether it’s [subject 1, subject 2, subject 3], breakthroughs come from struggle, review, and testing. Don’t quit during the hard part. Each [quiz / exercise / practice session] is an investment in a sharper, more durable mind.\n\nYour future self is counting on you to push through today’s discomfort. Every moment of mental strain is an investment into a sharper, more resilient brain.\n\nHappy studying :)`
          }
        ];
        const pickKey = (title || '').toString(); let sumE = 0; for (let i = 0; i < pickKey.length; i++) sumE += pickKey.charCodeAt(i);
        const idxE = eduMilestones.length ? (sumE % eduMilestones.length) : 0;
        const chosenE = eduMilestones[idxE];
        return `${chosenE.title}\n\n${chosenE.body}`;
      }
      if ((category || '').toLowerCase() === 'skincare') {
        const skinMilestones = [
          { title: 'My skin now — X years of [skincare method] vs before', body: `[3-4 Images - Before/After/Product Related Images]\n\nDefinitely not perfect, but as someone who struggled with {concerns}, the improvement is clear. Thinking of adding {ingredient} for scarring/hyperpigmentation — any recs? Skin type: {type}.` },
          { title: 'Empties — [Season]: [Brand1], [Brand2], [Brand3]', body: `[Multiple images]\n\nSkin type: {type}. Notes: {short notes on likes/dislikes and repurchase intent}.` }
        ];
        const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
        const id = skinMilestones.length ? (sum % skinMilestones.length) : 0;
        const chosen = skinMilestones[id];
        return `${chosen.title}\n\n${chosen.body}`;
      }
      const milestoneVariants = [
        { title: "X months of building — what nobody tells you", body: `I've been building {project_name}...` },
        { title: "My app made $[REVENUE] — how", body: `I\u2019ve been building {product_category}...` },
        { title: "Side project crossed $[MRR] MRR", body: `I can\u2019t believe it, but my side project...` }
      ];
      const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
      const id = milestoneVariants.length ? (sum % milestoneVariants.length) : 0;
      const chosen = milestoneVariants[id];
      return `${chosen.title}\n\n${commonHeader}${chosen.body}`;
    }
    case 'ama': {
      const cat = (category || '').toLowerCase();
      // Do not schedule or return AMAs for skincare
      if (cat === 'skincare') return undefined;
      // Prevent generic AMA fallback for education as well — only category-specific AMAs
      if (cat === 'education') {
        const eduAma = [
          {
            title: `What’s the one study habit that actually changed your grades?`,
            body: `Okay, real talk — what’s the specific study habit that actually moved your grades up? Not the generic “take notes” advice, but something concrete that genuinely worked for you.\n\nAlso curious — are [AI study tools / apps / flashcard software] actually helping anyone else, or are they just another source of distraction?`
          }
        ];
        const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
        const id = eduAma.length ? (sum % eduAma.length) : 0; const chosen = eduAma[id];
        return `${chosen.title}\n\n${chosen.body}`;
      }
      const amaVariants = [
        { title: "[Achievement] — here\u2019s how it happened", body: `Hey {community_name} 👋\n\nI wanted to share the journey...` },
        { title: "My [PROJECT] made $[REVENUE] — AMA", body: `Hi {community_name},\n\nMy {project_name} just passed...` },
        { title: "[PROJECT] helped [#] — AMA", body: `Hello {community_name},\n\nI\u2019m {founder_name}, founder of {project_name}...` }
      ];
      const pick = (title || '').toString(); let sum = 0; for (let i = 0; i < pick.length; i++) sum += pick.charCodeAt(i);
      const id = amaVariants.length ? (sum % amaVariants.length) : 0;
      const chosen = amaVariants[id];
      return `${chosen.title}\n\n${commonHeader}${chosen.body}`;
    }
    case 'value':
      return `${commonHeader}Here\u2019s one helpful tip we use in {project_name}: {practical_tip}\n\nWhy it matters: {why_it_matters}`;
    case 'journey':
      return `${commonHeader}The story of how {project_name} came to be:\n\n{origin_story_paragraph}`;
    case 'resource':
      return `${commonHeader}Found a resource that helped us build {project_name}: {resource_title} — {resource_link}`;
    default:
      return `${commonHeader}${title}\n\n{body}\n`;
  }
}

const getTemplateWithFallback = (type: string, title: string, primarySub: string, allSubs: string[], category?: string) => {
  try {
    const t = getTemplateForType(type, title, primarySub, allSubs, category);
    if (t && t.toString().trim()) return t;
  } catch (e) {}
  try {
    return getTemplateForType(type, title, primarySub, allSubs);
  } catch (e) {
    return undefined;
  }
};

function getDetailsForType(type: string) {
  const tips: any = {
    launch: { checklist: ['Read rules', 'Proper flair', 'Short intro'], step_by_step: ['Draft', 'Proofread', 'Post at peak hour'], posting_tips: 'Be specific and honest.' },
    milestone: { checklist: ['Real numbers', '2 concrete changes'], step_by_step: ['Headline with milestone', 'List changes', 'Invite questions'], posting_tips: 'Avoid overclaiming.' },
    ama: { checklist: ['Pick time', 'Prepare topics'], step_by_step: ['Announce', 'Answer quickly', 'Summarize later'], posting_tips: 'Use bullet points.' },
  };
  return tips[type] || { checklist: [], step_by_step: [], posting_tips: '' };
}

const pickTemplateTypeForCategory = (category?: string) => {
  switch ((category || '').toLowerCase()) {
    case 'saas':
      return 'launch';
    case 'education':
      return 'resource';
    case 'skincare':
      return 'value';
    default:
      return 'journey';
  }
};

async function generateTimelineTasks(subreddits: string[], karmaLevel: number, analytics: any[] = [], options: { totalDays?: number, category?: string } = {}) {
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
        const t: any = { id, type: 'post', title, duration_days: 1, order: tasks.length + 1, subreddits: [subreddit], status: 'pending', template, scheduled_day: day, scheduled_hour: hour, scheduled_at: scheduledDate.toISOString(), category: options.category || null, template_category: pickTemplateTypeForCategory(options.category) };
        try {
          const cat = (options.category || '').toLowerCase();
          let tpl: string | undefined;
          if (template === 'ama' && (cat === 'skincare' || cat === 'education')) {
            try { tpl = getTemplateForType(template, title, cleanedSubs[0], cleanedSubs, options.category); } catch (e) { tpl = undefined; }
          } else {
            try { tpl = getTemplateWithFallback(template, title, cleanedSubs[0], cleanedSubs, options.category); } catch (e) { tpl = undefined; }
          }
          if (tpl?.trim()) t.post_template = tpl;
        } catch {}
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
        const t: any = { id, type: 'post', title, duration_days: 1, order: tasks.length + 1, subreddits: [subreddit], status: 'pending', template, scheduled_day: day, scheduled_hour: hour, scheduled_at: scheduledDate.toISOString(), category: options.category || null, template_category: pickTemplateTypeForCategory(options.category) };
        try { const tpl = getTemplateWithFallback(template, title, cleanedSubs[0], cleanedSubs, options.category); if (tpl?.trim()) t.post_template = tpl; } catch {}
        tasks.push(t); postsPerDay[day]++; scheduledHoursPerDay[day].push(hour); reservedDayHour.add(key); lastPostDayBySub.set(subreddit, day); return t;
      }
    }
    const fallbackDay = Math.min(TOTAL_DAYS - 1, desiredDay); const fallbackHour = 12; const id = `post_${tasks.length + 1}`; const scheduledDate = new Date(); scheduledDate.setUTCDate(scheduledDate.getUTCDate() + fallbackDay); scheduledDate.setUTCHours(fallbackHour, 0, 0, 0);
    const t: any = { id, type: 'post', title, duration_days: 1, order: tasks.length + 1, subreddits: [subreddit], status: 'pending', template, scheduled_day: fallbackDay, scheduled_hour: fallbackHour, scheduled_at: scheduledDate.toISOString(), category: options.category || null, template_category: pickTemplateTypeForCategory(options.category) };
    try { const tpl = getTemplateWithFallback(template, title, cleanedSubs[0], cleanedSubs, options.category); if (tpl?.trim()) t.post_template = tpl; } catch {}
    tasks.push(t); postsPerDay[fallbackDay]++; scheduledHoursPerDay[fallbackDay].push(fallbackHour); reservedDayHour.add(`${fallbackDay}-${fallbackHour}`); lastPostDayBySub.set(subreddit, fallbackDay); return t;
  };

  // 1) Schedule engagement days
  for (let d = 0; d < Math.min(engagementDays, TOTAL_DAYS); d++) {
    const sub = cleanedSubs[d % cleanedSubs.length];
    const slots = subSlots.get(sub) || [12, 18, 20]; const a = analyticsMap.get(sub);
    let preferredWeekday: number | null = null;
    if (a && a.best_posting_day !== undefined && a.best_posting_day !== null) preferredWeekday = Number(a.best_posting_day);
    else if (a && Array.isArray(a.activity_heatmap)) {
      try { const daySums = a.activity_heatmap.map((row: number[]) => row.reduce((s: number, v: any) => s + Number(v || 0), 0)); let maxDay = 0; for (let i = 1; i < daySums.length; i++) if ((daySums[i] || 0) > (daySums[maxDay] || 0)) maxDay = i; preferredWeekday = maxDay; } catch (e) { preferredWeekday = null; }
    }
    const nowEng = new Date(); let chosenDay = d;
    if (preferredWeekday !== null && preferredWeekday !== undefined) {
      let found = false;
      for (let dd = 0; dd < Math.min(engagementDays, TOTAL_DAYS); dd++) {
        const candidateDate = new Date(nowEng); candidateDate.setUTCDate(nowEng.getUTCDate() + dd);
        if (candidateDate.getUTCDay() === preferredWeekday) { chosenDay = dd; found = true; break; }
      }
      if (!found) chosenDay = d;
    }
    let scheduled = false;
    for (let offset = 0; offset < Math.min(TOTAL_DAYS, engagementDays); offset++) {
      const tryDay = Math.min(TOTAL_DAYS - 1, chosenDay + offset);
      for (const hr of slots) {
        const collisionKey = `${tryDay}-${hr}`; if (reservedDayHour.has(collisionKey)) continue; if (postsPerDay[tryDay] >= 2) continue; const last = lastPostDayBySub.get(sub); const onlyOne = cleanedSubs.length === 1; if (!onlyOne && last !== undefined && (tryDay - last) < 7) continue;
        const scheduledDateEng = new Date(nowEng); scheduledDateEng.setUTCDate(nowEng.getUTCDate() + tryDay); scheduledDateEng.setUTCHours(hr, 0, 0, 0);
        tasks.push({ id: `engagement_${d + 1}`, type: 'engagement', title: `Engage: Comment and contribute to r/${sub}`, duration_days: 1, order: tasks.length + 1, subreddits: [sub], status: 'pending', scheduled_day: tryDay, scheduled_hour: hr, scheduled_at: scheduledDateEng.toISOString() });
        postsPerDay[tryDay]++; scheduledHoursPerDay[tryDay].push(hr); reservedDayHour.add(collisionKey); lastPostDayBySub.set(sub, tryDay); scheduled = true; break;
      }
      if (scheduled) break;
    }
    if (!scheduled) {
      const scheduledDateEng = new Date(nowEng); scheduledDateEng.setUTCDate(nowEng.getUTCDate() + d); scheduledDateEng.setUTCHours(9, 0, 0, 0);
      tasks.push({ id: `engagement_${d + 1}`, type: 'engagement', title: `Engage: Comment and contribute to r/${sub}`, duration_days: 1, order: tasks.length + 1, subreddits: [sub], status: 'pending', scheduled_day: d, scheduled_hour: 9, scheduled_at: scheduledDateEng.toISOString() });
    }
  }

  // 2-4) Per-subreddit chain: Launch -> Milestone -> AMA
  const amaOffsetByKarma: Record<number, [number, number]> = { 1: [5, 7], 2: [4, 6], 3: [3, 5], 4: [2, 4], 5: [2, 3] };
  const k = Math.min(Math.max(Math.floor(karmaLevel), 1), 5); const [amaMin, amaMax] = amaOffsetByKarma[k];
  for (const sub of cleanedSubs) {
    const launch = schedulePost(engagementDays, sub, 'launch', `Launch post in r/${sub}`, { ignoreCooldown: true });
    if (launch) {
      const milestoneDesired = Math.min(launch.scheduled_day + (3 + Math.floor(Math.random() * 3)), TOTAL_DAYS - 2);
      // Prefer milestone template; if missing, try AMA in the same slot; otherwise schedule an extra milestone later
      try {
        const maybeMilestoneTpl = getTemplateWithFallback('milestone', `Milestone update in r/${sub}`, sub, cleanedSubs, options.category);
        if (maybeMilestoneTpl && maybeMilestoneTpl.toString().trim()) {
          schedulePost(milestoneDesired, sub, 'milestone', `Milestone update in r/${sub}`, { ignoreCooldown: true });
          try {
            const maybeAmaTpl = getTemplateWithFallback('ama', `AMA in r/${sub}`, sub, cleanedSubs, options.category);
            if (maybeAmaTpl && maybeAmaTpl.toString().trim()) {
              const amaDesired = Math.min(milestoneDesired + (amaMin + Math.floor(Math.random() * (amaMax - amaMin + 1))), TOTAL_DAYS - 1);
              schedulePost(amaDesired, sub, 'ama', `AMA in r/${sub}`, { ignoreCooldown: true });
            } else {
              const extraMilestoneDesired = Math.min(TOTAL_DAYS - 1, milestoneDesired + 2);
              schedulePost(extraMilestoneDesired, sub, 'milestone', `Milestone update in r/${sub}`, { ignoreCooldown: true });
            }
          } catch (e) {
            const extraMilestoneDesired = Math.min(TOTAL_DAYS - 1, milestoneDesired + 2);
            schedulePost(extraMilestoneDesired, sub, 'milestone', `Milestone update in r/${sub}`, { ignoreCooldown: true });
          }
        } else {
          const maybeAmaTpl = getTemplateWithFallback('ama', `AMA in r/${sub}`, sub, cleanedSubs, options.category);
          if (maybeAmaTpl && maybeAmaTpl.toString().trim()) {
            schedulePost(milestoneDesired, sub, 'ama', `AMA in r/${sub}`, { ignoreCooldown: true });
          } else {
            const extraMilestoneDesired = Math.min(TOTAL_DAYS - 1, milestoneDesired + 2);
            schedulePost(extraMilestoneDesired, sub, 'milestone', `Milestone update in r/${sub}`, { ignoreCooldown: true });
          }
        }
      } catch (e) {
        const extraMilestoneDesired = Math.min(TOTAL_DAYS - 1, milestoneDesired + 2);
        schedulePost(extraMilestoneDesired, sub, 'milestone', `Milestone update in r/${sub}`, { ignoreCooldown: true });
      }
    }
  }

  // Build phases
  const phases: any[] = [];
  const tasksByTemplateAndSub = new Map<string, Map<string, any[]>>();
  tasks.forEach(t => { const tpl = t.template || t.type || 'post'; const bySub = tasksByTemplateAndSub.get(tpl) || new Map<string, any[]>(); const subs = (Array.isArray(t.subreddits) && t.subreddits.length) ? t.subreddits : [cleanedSubs[0]]; subs.forEach((s: string) => { const arr = bySub.get(s) || []; arr.push(t); bySub.set(s, arr); }); tasksByTemplateAndSub.set(tpl, bySub); });
  for (const sub of cleanedSubs) {
    const engagementTasks = tasks.filter(t => t.type === 'engagement' && t.subreddits?.includes(sub)).map(t => ({ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: (t as any).post_template, details: t.details }));
    phases.push({ id: `engage_${sub}`, title: `Community Engagement — r/${sub}`, days: `Days 1-${engagementDays}`, description: `Engage authentically with r/${sub}`, tasks: engagementTasks, completed: false });
    const launchArr = (tasksByTemplateAndSub.get('launch')?.get(sub) || []).map((t: any) => ({ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: (t.post_template as string) || getTemplateForType(t.template, t.title, sub, cleanedSubs, (t as any).category), details: getDetailsForType(t.template) }));
    if (launchArr.length) phases.push({ id: `launch_${sub}`, title: `Launch — r/${sub}`, days: launchArr[0].scheduled_day ? `Day ${launchArr[0].scheduled_day}` : '', description: `Introduce your project in r/${sub}`, tasks: launchArr, completed: false });
    const milestoneArr = (tasksByTemplateAndSub.get('milestone')?.get(sub) || []);
    const amaArr = (tasksByTemplateAndSub.get('ama')?.get(sub) || []);
    const pairs = Math.max(milestoneArr.length, amaArr.length);
    for (let i = 0; i < pairs; i++) {
      if (milestoneArr[i]) { const t = milestoneArr[i]; phases.push({ id: `milestone_${sub}_${i}`, title: `Milestone Update — r/${sub}`, days: '', description: 'Share progress and results', tasks: [{ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: (t.post_template as string) || getTemplateForType(t.template, t.title, sub, cleanedSubs, (t as any).category), details: t.details || getDetailsForType(t.template) }], completed: false }); }
      if (amaArr[i]) { const t = amaArr[i]; phases.push({ id: `ama_${sub}_${i}`, title: `AMA — r/${sub}`, days: '', description: 'Host an AMA to engage deeply', tasks: [{ id: t.id, title: t.title, completed: false, scheduled_day: t.scheduled_day, scheduled_hour: t.scheduled_hour, scheduled_at: t.scheduled_at, template: t.template, post_template: (t.post_template as string) || getTemplateForType(t.template, t.title, sub, cleanedSubs, (t as any).category), details: t.details || getDetailsForType(t.template) }], completed: false }); }
    }
  }
  const phaseTimes: Map<string, number> = new Map();
  phases.forEach((ph: any) => { const first = ph.tasks?.[0]; const t = first?.scheduled_at ? new Date(first.scheduled_at).getTime() : Number.POSITIVE_INFINITY; phaseTimes.set(ph.id, t); });
  phases.sort((a: any, b: any) => (phaseTimes.get(a.id)! - phaseTimes.get(b.id)!));
  return phases;
}