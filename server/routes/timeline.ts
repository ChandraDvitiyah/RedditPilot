import { Express } from 'express';
import { withAuth, handleError, AuthenticatedRequest } from '../index';

export function setupTimelineRoutes(app: Express) {
  // Timeline routes moved to frontend - Supabase operations handled directly
  // Backend can provide external API services for timeline generation
  
  // Generate timeline suggestions based on Reddit data
  app.post('/api/reddit/generate-timeline', withAuth(async (req: AuthenticatedRequest, res) => {
    try {
      const { projectId, subreddits, karmaLevel, analytics } = req.body;
      
      if (!projectId || !subreddits || karmaLevel === undefined || karmaLevel === null) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

          // accept optional totalDays (default 14). We use UTC-only timestamps; frontend should convert to local time.
          const totalDays: number = Number(req.body.totalDays || 14);

          // Generate timeline tasks using provided analytics (if any). Use UTC-only scheduled_at timestamps.
          const timelineTasks = await generateTimelineTasks(subreddits, karmaLevel, analytics || [], { totalDays });
      
          res.json({
            timeline: timelineTasks,
            message: 'Timeline generated successfully'
          });

    } catch (error) {
      return handleError(res, error, 'Failed to generate timeline');
    }
  }));
}

// Helper: Return a full post template string for a given type. Newbie-friendly, with placeholders to be replaced by the frontend.
function getTemplateForType(type: string, title: string, primarySub: string, allSubs: string[]) {
  const commonHeader = `Hi ${primarySub ? `r/${primarySub}` : 'everyone'},\n\n`;
  switch (type) {
    case 'launch':
      // Multiple launch variants - pick deterministically by title
      const launchVariants = [
        {
          title: 'I built {catchy_project_description}',
          body: `{product_media}\n\nHere’s how it works:\n\n{core_concept_1}\n\n{core_concept_2}\n\n{core_concept_3}\n\nBasically, {one_line_summary}.\n\nWould you like to try it out?\n\n{call_to_action}`
        },
        {
          title: 'Made a {short_project_description}',
          body: `{product_demo_video}\n\nCheck out a quick demo above — would love to hear feedback.`
        },
        {
          title: 'Wanted something better than {competitor}, made it myself in {time_frame}',
          body: `{demo_video}\n\nI was frustrated with {competitor} because {reason}. So I built {project_name} to solve that by {unique_approach}.` 
        }
      ];
      const pickLaunch = (title || '').toString();
      let sL = 0;
      for (let i = 0; i < pickLaunch.length; i++) sL += pickLaunch.charCodeAt(i);
      const lid = launchVariants.length ? (sL % launchVariants.length) : 0;
      const chosenLaunch = launchVariants[lid];
      return `${chosenLaunch.title}\n\n${commonHeader}${chosenLaunch.body}`;
    case 'milestone':
      // Multiple milestone variants; pick deterministically using the title
      const milestoneVariants = [
        {
          title: "X months of [vibe coding / hacking / building] a [SaaS / project] — here’s what nobody tells you",
          body: `I've been building {project_name} with {tech_stack_placeholder}, and here’s the stuff nobody warns you about.

Everyone says {platform_placeholder} make building SaaS easy, and they do… up to maybe 60%. You can spin up a landing page, auth, even a decent dashboard. But when real users + real money hit the system? Everything breaks in ways the tutorials never cover.

Here’s what I ran into:

{Payment Issue} — Worked fine in test mode, failed in production. I thought I was making money while payments were bouncing.

{Database/Performance Issue} — Fine with 10 users, broke at 1000+. Queries timing out, bad indexing, dashboard trying to load everything at once.

{Session/Auth Issue} — Users logged out randomly. Subscriptions expiring mid-session. Multi-tab chaos.

{Data Isolation Issue} — Customers seeing each other’s data. Fun support tickets.

{Billing Logic Issue} — Looked perfect in dev, but proration/retries/sub changes wrecked accounting.

At first, I was just pasting AI code and trusting it. But the turning point was realizing my job isn’t to be a perfect dev — it’s to be an AI supervisor:

• Setting up logging for every critical action.
• Testing payment flows with real cards before launch.
• Keeping a spreadsheet of “what actually works” vs “what looks fine in dev.”
• Learning the basics of {ops_placeholder} so I could spot when AI was wrong.

Most success stories gloss over these “WTF weeks.” The truth is, you’ll probably need to learn just enough fundamentals to not get wrecked in production.

Now I still use AI for 90% of development, but I can tell when it’s giving me code that will blow up in production vs something stable for real users.`
        },
        {
          title: "My [AI / non-AI] app made $[REVENUE] in [X months] — here’s how I did it",
          body: `I’ve been building {product_category} for the past {timeframe}. Most of them failed to make real money — but each failure taught me how to {skill}.

The Idea

{Context: market change, unmet need, or problem you noticed}.

Launch

I hacked together an MVP in {mvp_timeframe}. The design was {design_quality}, but it worked. My first users came from {initial_channel}.

Promotion

Early growth came from {channel_one} → got me initial traction. Then I tried {channel_two} → {result}. Big break: {big_break_description}.

Growth

One customer asked for {feature_or_plan}. I built it overnight and closed the deal. That turned into $[first_big_sale], and suddenly it felt real.

What Didn’t Work

Paid ads on {platforms} — waste of money.

What Worked

{Platform_1} → great for early users.

Wrap-up

This was my journey to making $[REVENUE] in {timeframe} with {product}. Happy to answer questions.`
        },
        {
          title: "My Side Project just crossed $[MRR] MRR. I can’t believe it’s real",
          body: `I can’t believe it, but my side project just crossed $[MRR] MRR, and it feels surreal.

{PROJECT_NAME} is a {short_description}. It helps people {benefit}.

I launched it {launch_window} with:

• {visits} visits
• {signups} signups
• {paying_customers} paying customers
• ${'{revenue_total}'} earned

Today, the numbers look like this:

• {visits_now} visits
• {signups_now} signups
• {paying_customers_now} paying customers

It’s not life-changing money yet, but it’s proof that people will pay for something I made.

Consistency beats going viral — keep posting, iterating, and building.`
        }
      ];
      // deterministic pick based on title
      const pickKey = (title || '').toString();
      let sum = 0;
      for (let i = 0; i < pickKey.length; i++) sum += pickKey.charCodeAt(i);
      const idx = milestoneVariants.length ? (sum % milestoneVariants.length) : 0;
      const chosen = milestoneVariants[idx];
      return `${chosen.title}\n\n${commonHeader}${chosen.body}`;
    case 'ama':
      // AMA variants: deterministic pick by title
      const amaVariants = [
        {
          title: "[Achievement / milestone in X hours/days] — here’s how it happened",
          body: `Hey {community_name} 👋

I wanted to share the journey behind {short_timeframe} building {project_name}, our {brief_description}.

We started building {project_name} because we were frustrated: {problem_statement}. So we built {project_name} — {what_it_does}.

A few {days_weeks} ago, we {launched/shared/demoed} {project_name}. Within {timeframe}:

• {Key milestone 1}
• {Key milestone 2}
• {Key milestone 3}

Here’s what worked for us:

• {Lesson 1}
• {Lesson 2}
• {Lesson 3}
• {Lesson 4}

We’re still in the early days, and there’s a ton to figure out. But the biggest lesson so far: {core_insight}.

If you’re working on something related, I’d love to hear what you’re building too. AMA!`
        },
        {
          title: "My [PROJECT TYPE] made $[REVENUE] in [YEAR]",
          body: `Hi {community_name},

My {project_name} just passed ${'{revenue}'} in revenue in {year}.

{Optional link: url}

The best part? It’s {profitability_note} and requires {maintenance_note}.

If you have any questions about building, marketing, monetization, or niche distribution, AMA!`
        },
        {
          title: "[PROJECT NAME] helped [# users/customers] & made $[REVENUE] — AMA",
          body: `Hello {community_name},

I’m {founder_name}, founder of {project_name} ({project_url}). {project_name} is {short_description} and helps {target_audience} {benefit}.

I started this {timeframe_ago} after seeing {inspiration}.

Key lessons:
• {Lesson 1}
• {Lesson 2}
• {Lesson 3}
• {Lesson 4}

Over the years we’ve hit milestones like {user_growth} and {revenue_milestone}.

Ask me anything about product, growth, hiring, or monetization — happy to share details.`
        }
      ];
      const pick = (title || '').toString();
      let s = 0;
      for (let i = 0; i < pick.length; i++) s += pick.charCodeAt(i);
      const id = amaVariants.length ? (s % amaVariants.length) : 0;
      const chosenAma = amaVariants[id];
      return `${chosenAma.title}\n\n${commonHeader}${chosenAma.body}`;
    case 'value':
      return `${commonHeader}Here’s one helpful tip we use in ${'{project_name}'}: ${'{practical_tip}'}\n\nWhy it matters: ${'{why_it_matters}'}\n\nIf this helps, tell me and I'll share more.`;
    case 'journey':
      return `${commonHeader}The story of how ${'{project_name}'} came to be:\n\n${'{origin_story_paragraph}'}\n\nThe biggest lesson: ${'{lesson}'}\n\nWould love to hear your stories too.`;
    case 'resource':
      return `${commonHeader}Found a resource that helped us build ${'{project_name}'}: ${'{resource_title}'} — ${'{resource_link}'}\n\nWhy it's useful: ${'{resource_reason}'}\n\nHope it helps someone here.`;
    default:
      return `${commonHeader}${title}\n\n${'{body}'}\n`;
  }
}

// Helper: Return step-by-step instructions and tips for posting each type. Helpful for newbies (what to do before/after posting).
function getDetailsForType(type: string, title: string, primarySub: string, allSubs: string[]) {
  const tips: any = {
    launch: {
      checklist: [
        'Read the subreddit rules and the pinned rules thread',
        'Ensure your post follows the community format (flair, spoiler tags, etc.)',
        'Prepare 1-2 supporting images/screenshots (optional)',
        'Keep the intro short and clear — 3-4 short paragraphs',
        'Include a clear call-to-action (link or how to try)'
      ],
      step_by_step: [
        'Draft your post locally using the template. Replace placeholders like {project_name} and {call_to_action_link}.',
        'Proofread for spelling and remove marketing-heavy language; be honest and specific.',
        'Choose an appropriate flair and add 1-2 relevant screenshots if helpful.',
        'Post during a top hour suggested by the analytics, or use the provided scheduled_at time.',
        'Within the first hour, reply to any thoughtful comments with appreciation and short answers.'
      ],
      posting_tips: 'If you are new, ask moderators if a short introduction post is allowed; some subs prefer questions or discussion-style posts.'
    },
    milestone: {
      checklist: ['Summarize what changed', 'Include real numbers (without doxxing)', 'Link to previous post or demo if available'],
      step_by_step: ['Write a 2-3 sentence headline with the milestone', 'List 2 concrete changes or results', 'Invite feedback/questions'],
      posting_tips: 'Avoid overclaiming — show real data and be humble; communities appreciate transparency.'
    },
    ama: {
      checklist: ['Pick a specific time and date', 'Announce the AMA ahead of time if allowed', 'Prepare 3-5 talking points and links'],
      step_by_step: ['Create an announcement post with time and timezone', 'During the AMA, answer quickly and mark answered questions', 'After the AMA, summarize top questions and answers in a follow-up post'],
      posting_tips: 'Use bullet points for answers and link to relevant resources; cut long technical answers into short sections.'
    },
    value: {
      checklist: ['Share one practical tip', 'Provide a short example or code snippet if helpful'],
      step_by_step: ['Start with the tip in the first line', 'Give a short example or screenshot', 'Close with an invitation for readers to share their experience'],
      posting_tips: 'Value posts perform well when they solve a specific, common problem.'
    },
    journey: {
      checklist: ['Keep it personal and concise', 'Include one lesson and one ask from the community'],
      step_by_step: ['Open with the challenge you faced', 'Explain one key turning point', 'Finish with the lesson and what you want from readers'],
      posting_tips: 'Stories resonate when they include setbacks and what you learned — be specific.'
    },
    resource: {
      checklist: ['Include the resource name and link', 'Explain why it helped you'],
      step_by_step: ['Introduce the problem the resource solves', 'Give a 1-sentence summary of how you used it', 'Link to the resource and invite comments'],
      posting_tips: 'Avoid affiliate links and be transparent about any affiliations.'
    }
  };

  return tips[type] || { checklist: [], step_by_step: [], posting_tips: '' };
}

// Mock function to generate timeline tasks based on Reddit data
async function generateTimelineTasks(subreddits: string[], karmaLevel: number, analytics: any[] = [], options: { totalDays?: number } = {}) {
  // Timeline generation per spec
  // Inputs: subreddits (['r/foo', ...] or ['foo']), karmaLevel (1-5), analytics [{ subreddit, best_posting_hour, activity_heatmap, top_posts }]
  // Output: array of tasks for 14 days with scheduled_day (0-based) and scheduled_hour

  // helper: normalize subreddit name (no leading r/)
  const clean = (s: string) => s.replace(/^r\//i, '').toLowerCase();
  const cleanedSubs = subreddits.map(clean);

  // Map analytics by subreddit
  const analyticsMap = new Map<string, any>();
  (analytics || []).forEach((a: any) => {
    if (!a) return;
    const key = clean(a.subreddit || a.subreddit_name || '');
    analyticsMap.set(key, a);
  });

  // Determine engagement days per karma level
  const engagementByKarma: Record<number, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };
  const engagementDays = engagementByKarma[Math.min(Math.max(Math.floor(karmaLevel), 1), 5)] || 3;

  const TOTAL_DAYS = Math.max(7, Math.min(90, Number(options.totalDays || 14)));
  const tasks: any[] = [];

  // Determine top slots (hours) for each subreddit (top-3 if available), fallback to [12, 18, 20]
  const subSlots = new Map<string, number[]>();
  cleanedSubs.forEach((s) => {
    const a = analyticsMap.get(s);
    let slots: number[] = [];
    if (a) {
      if (Array.isArray(a.top_posts) && a.best_posting_hour !== undefined) {
        // prefer best_posting_hour plus +/- common hours
        const b = Number(a.best_posting_hour);
        slots = [b, (b + 6) % 24, (b + 12) % 24].map(h => Math.floor(h));
      } else if (Array.isArray(a.activity_heatmap)) {
        // try to find top 3 hours by flattening heatmap columns
        try {
          const heatmap = a.activity_heatmap; // expected 7 x 24
          const hourSums = Array.from({ length: 24 }, (_, i) => 0);
          heatmap.forEach((dayArr: number[]) => dayArr.forEach((v: number, hr: number) => hourSums[hr] += Number(v || 0)));
          const topHours = hourSums.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v).slice(0, 3).map(x => x.i);
          slots = topHours.length ? topHours : [12, 18, 20];
        } catch (e) {
          slots = [12, 18, 20];
        }
      }
    }
    if (!slots || slots.length === 0) slots = [12, 18, 20];
    subSlots.set(s, slots);
  });

  // Helper: pick subreddit priority (by analytics activity sum) - higher activity first
  const subPriority = cleanedSubs.slice().sort((a, b) => {
    const aa = analyticsMap.get(a);
    const bb = analyticsMap.get(b);
    const sum = (arr: number[][]) => arr && arr.flat ? arr.flat().reduce((s: number, v: number) => s + (Number(v) || 0), 0) : 0;
    const sa = aa && aa.activity_heatmap ? sum(aa.activity_heatmap) : 0;
    const sb = bb && bb.activity_heatmap ? sum(bb.activity_heatmap) : 0;
    return sb - sa;
  });

  // State to enforce constraints
  const postsPerDay = Array(TOTAL_DAYS).fill(0);
  const scheduledHoursPerDay: number[][] = Array.from({ length: TOTAL_DAYS }, () => []);
  const lastPostDayBySub = new Map<string, number>();
  // Track exact day-hour reservations for non-engagement posts to avoid duplicate scheduling
  const reservedDayHour = new Set<string>();

  // Helper to check if a candidate time conflicts with any existing task (3-hour minimum gap)
  const hasGlobalConflict = (candidateDay: number, candidateHour: number) => {
    const candidateTime = new Date();
    candidateTime.setUTCDate(candidateTime.getUTCDate() + candidateDay);
    candidateTime.setUTCHours(candidateHour, 0, 0, 0);
    const candidateMs = candidateTime.getTime();
    
    return tasks.some(existingTask => {
      if (!existingTask.scheduled_at) return false;
      const existingMs = new Date(existingTask.scheduled_at).getTime();
      const gapHours = Math.abs(candidateMs - existingMs) / (1000 * 60 * 60);
      return gapHours < 3; // 3-hour minimum gap globally
    });
  };

  // Utility to schedule a post on or after a target day
  // This now also sets an ISO `scheduled_at` timestamp in UTC for convenience; the frontend is responsible for converting to local time.
  const schedulePost = (
    desiredDay: number,
    subreddit: string,
    template: string,
    title: string,
    opts?: { ignoreCooldown?: boolean }
  ) => {
    // try hours/days with priorities: try best hours in order, prefer preferred weekday first
    const minGapHours = 6; // enforce 6-hour gap within same day
    const globalMinGapHours = 3; // enforce 3-hour gap globally across all tasks
    const onlyOne = cleanedSubs.length === 1;
    const a = analyticsMap.get(subreddit);
    // build prioritized hours: best_posting_hour first, then top heatmap hours, then fallback list
    const prioritizedHours: number[] = [];
    if (a && a.best_posting_hour !== undefined && a.best_posting_hour !== null) prioritizedHours.push(Number(a.best_posting_hour));
    // if activity_heatmap exists, extract top hours
    if (a && Array.isArray(a.activity_heatmap)) {
      try {
        const heatmap = a.activity_heatmap;
        const hourSums = Array.from({ length: 24 }, (_, i) => 0);
        heatmap.forEach((dayArr: number[]) => dayArr.forEach((v: number, hr: number) => hourSums[hr] += Number(v || 0)));
        const topHours = hourSums.map((v, i) => ({ v, i })).sort((x, y) => y.v - x.v).map(x => x.i);
        for (const h of topHours) if (!prioritizedHours.includes(h)) prioritizedHours.push(h);
      } catch (e) {
        // ignore
      }
    }
    // fallback default hours
    const fallbackHours = [21, 18, 12];
    for (const h of fallbackHours) if (!prioritizedHours.includes(h)) prioritizedHours.push(h);

    // preferred weekday if provided
    const preferredWeekday = (a && a.best_posting_day !== undefined && a.best_posting_day !== null) ? Number(a.best_posting_day) : 4; // Thu default

    const now = new Date();
    // For each hour in priority order, try to schedule on or after desiredDay
    for (const hour of prioritizedHours) {
      // Build candidate day ordering: days that match preferredWeekday first (starting at desiredDay), then other days
      const preferredDays: number[] = [];
      const otherDays: number[] = [];
      for (let d = desiredDay; d < TOTAL_DAYS; d++) {
        const candidateDate = new Date(now);
        candidateDate.setUTCDate(now.getUTCDate() + d);
        if (candidateDate.getUTCDay() === preferredWeekday) preferredDays.push(d);
        else otherDays.push(d);
      }
      const candidateDays = [...preferredDays, ...otherDays];

      for (const day of candidateDays) {
        if (postsPerDay[day] >= 2) continue; // cap 2 posts/day
        const last = lastPostDayBySub.get(subreddit);
        const ignoreCooldown = !!(opts && opts.ignoreCooldown);
        if (!onlyOne && !ignoreCooldown && last !== undefined && (day - last) < 7) continue; // cooldown unless overridden

        const hoursUsed = scheduledHoursPerDay[day] || [];
        const collisionKey = `${day}-${hour}`;
        // ensure no exact day-hour reservation for another post (but allow engagement collisions)
        if (reservedDayHour.has(collisionKey)) continue;
        // check global 3-hour minimum gap with all existing tasks
        if (hasGlobalConflict(day, hour)) continue;
        const ok = hoursUsed.every(h => Math.abs(h - hour) >= minGapHours && Math.abs((h + 24) - hour) >= minGapHours && Math.abs(h - (hour + 24)) >= minGapHours);
        if (!ok) continue;

        // schedule it
        const id = `post_${tasks.length + 1}`;
        const scheduledDate = new Date(now);
        scheduledDate.setUTCDate(now.getUTCDate() + day);
        scheduledDate.setUTCHours(hour, 0, 0, 0);
        const t: any = {
          id,
          type: 'post',
          title,
          duration_days: 1,
          order: tasks.length + 1,
          subreddits: [subreddit],
          status: 'pending',
          template,
          scheduled_day: day,
          scheduled_hour: hour,
          scheduled_at: scheduledDate.toISOString()
        };
        // ensure at least one concrete post_template exists — generate from type if missing
        try {
          const tpl = getTemplateForType(template, title, cleanedSubs[0], cleanedSubs);
          if (tpl && tpl.trim()) t.post_template = tpl;
        } catch (e) {
          // ignore
        }

        tasks.push(t);
        postsPerDay[day]++;
        scheduledHoursPerDay[day].push(hour);
        // reserve exact day-hour for non-engagement posts
        reservedDayHour.add(`${day}-${hour}`);
        lastPostDayBySub.set(subreddit, day);
        return t;
      }
    }

    // fallback: try any hour/day naive loop (preserve previous fallback)
    for (let day = desiredDay; day < TOTAL_DAYS; day++) {
      if (postsPerDay[day] >= 2) continue;
      const onlyOneLocal = cleanedSubs.length === 1;
      const lastLocal = lastPostDayBySub.get(subreddit);
      if (!onlyOneLocal && lastLocal !== undefined && (day - lastLocal) < 7) continue;
      const slots = subSlots.get(subreddit) || [12, 18, 20];
  for (const hour of slots) {
  const hoursUsed = scheduledHoursPerDay[day] || [];
  const collisionKey = `${day}-${hour}`;
  if (reservedDayHour.has(collisionKey)) continue;
  // check global 3-hour minimum gap with all existing tasks
  if (hasGlobalConflict(day, hour)) continue;
  const ok = hoursUsed.every(h => Math.abs(h - hour) >= minGapHours && Math.abs((h + 24) - hour) >= minGapHours && Math.abs(h - (hour + 24)) >= minGapHours);
  if (!ok) continue;
        const id = `post_${tasks.length + 1}`;
        const now2 = new Date();
        const scheduledDate = new Date(now2);
        scheduledDate.setUTCDate(now2.getUTCDate() + day);
        scheduledDate.setUTCHours(hour, 0, 0, 0);
        const t: any = {
          id,
          type: 'post',
          title,
          duration_days: 1,
          order: tasks.length + 1,
          subreddits: [subreddit],
          status: 'pending',
          template,
          scheduled_day: day,
          scheduled_hour: hour,
          scheduled_at: scheduledDate.toISOString()
        };
        try {
          const tpl = getTemplateForType(template, title, cleanedSubs[0], cleanedSubs);
          if (tpl && tpl.trim()) t.post_template = tpl;
        } catch (e) {}
        tasks.push(t);
        postsPerDay[day]++;
        scheduledHoursPerDay[day].push(hour);
        reservedDayHour.add(`${day}-${hour}`);
        lastPostDayBySub.set(subreddit, day);
        return t;
      }
    }
    // fallback: schedule at the end on the last day at a default hour
    const fallbackDay = Math.min(TOTAL_DAYS - 1, desiredDay);
    const fallbackHour = 12;
  const id = `post_${tasks.length + 1}`;
  const scheduledDate = new Date(now);
    scheduledDate.setUTCDate(now.getUTCDate() + fallbackDay);
    scheduledDate.setUTCHours(fallbackHour, 0, 0, 0);
    const t = {
      id,
      type: 'post',
      title,
      duration_days: 1,
      order: tasks.length + 1,
      subreddits: [subreddit],
      status: 'pending',
      template,
      scheduled_day: fallbackDay,
      scheduled_hour: fallbackHour,
      scheduled_at: scheduledDate.toISOString()
    };
    tasks.push(t);
    postsPerDay[fallbackDay]++;
    scheduledHoursPerDay[fallbackDay].push(fallbackHour);
    reservedDayHour.add(`${fallbackDay}-${fallbackHour}`);
    lastPostDayBySub.set(subreddit, fallbackDay);
    return t;
  };

  // 1) Schedule engagement days (comment tasks) for required number of days
  for (let d = 0; d < Math.min(engagementDays, TOTAL_DAYS); d++) {
    // pick subreddit rotating by priority
    const sub = subPriority[d % subPriority.length];
    const id = `engagement_${d + 1}`;

    // Determine preferred hour slots and weekday per subreddit
    const slots = subSlots.get(sub) || [12, 18, 20];
    const a = analyticsMap.get(sub);
    let preferredWeekday: number | null = null;
    if (a && a.best_posting_day !== undefined && a.best_posting_day !== null) {
      preferredWeekday = Number(a.best_posting_day);
    } else if (a && Array.isArray(a.activity_heatmap)) {
      try {
        const daySums = a.activity_heatmap.map((row: number[]) => row.reduce((s: number, v: any) => s + Number(v || 0), 0));
        let maxDay = 0;
        for (let i = 1; i < daySums.length; i++) if ((daySums[i] || 0) > (daySums[maxDay] || 0)) maxDay = i;
        preferredWeekday = maxDay;
      } catch (e) {
        preferredWeekday = null;
      }
    }

    const nowEng = new Date();
    // Choose a starting day that tries to align with preferredWeekday if possible
    let chosenDay = d;
    if (preferredWeekday !== null && preferredWeekday !== undefined) {
      let found = false;
      for (let dd = 0; dd < Math.min(engagementDays, TOTAL_DAYS); dd++) {
        const candidateDate = new Date(nowEng);
        candidateDate.setUTCDate(nowEng.getUTCDate() + dd);
        if (candidateDate.getUTCDay() === preferredWeekday) {
          chosenDay = dd;
          found = true;
          break;
        }
      }
      if (!found) chosenDay = d;
    }

    // Try preferred hours for the chosen day, then other days/hours if collisions occur
    let scheduled = false;
    for (let offset = 0; offset < Math.min(TOTAL_DAYS, engagementDays); offset++) {
      const tryDay = Math.min(TOTAL_DAYS - 1, chosenDay + offset);
      for (const hr of slots) {
        const collisionKey = `${tryDay}-${hr}`;
        if (reservedDayHour.has(collisionKey)) continue;
        if (postsPerDay[tryDay] >= 2) continue;
        const last = lastPostDayBySub.get(sub);
        const onlyOne = cleanedSubs.length === 1;
        if (!onlyOne && last !== undefined && (tryDay - last) < 7) continue;

        const scheduledDateEng = new Date(nowEng);
        scheduledDateEng.setUTCDate(nowEng.getUTCDate() + tryDay);
        scheduledDateEng.setUTCHours(hr, 0, 0, 0);

        tasks.push({
          id,
          type: 'engagement',
          title: `Engage: Comment and contribute to r/${sub}`,
          duration_days: 1,
          order: tasks.length + 1,
          subreddits: [sub],
          status: 'pending',
          scheduled_day: tryDay,
          scheduled_hour: hr,
          scheduled_at: scheduledDateEng.toISOString()
        });
        postsPerDay[tryDay]++;
        scheduledHoursPerDay[tryDay].push(hr);
        // Reserve the slot so other posts don't use the exact same day-hour
        reservedDayHour.add(collisionKey);
        lastPostDayBySub.set(sub, tryDay);
        scheduled = true;
        break;
      }
      if (scheduled) break;
    }

    // If not scheduled (edge case), fallback to the original day at 09:00 UTC
    if (!scheduled) {
      const scheduledDateEng = new Date(nowEng);
      scheduledDateEng.setUTCDate(nowEng.getUTCDate() + d);
      scheduledDateEng.setUTCHours(9, 0, 0, 0);
      tasks.push({
        id,
        type: 'engagement',
        title: `Engage: Comment and contribute to r/${sub}`,
        duration_days: 1,
        order: tasks.length + 1,
        subreddits: [sub],
        status: 'pending',
        scheduled_day: d,
        scheduled_hour: 9,
        scheduled_at: scheduledDateEng.toISOString()
      });
    }
  }

  // Helper to pick next subreddit for posts based on priority and cooldown
  const pickSubForPost = (preferredIndex = 0) => {
    for (const s of subPriority) {
      const last = lastPostDayBySub.get(s);
      const onlyOne = cleanedSubs.length === 1;
      if (!onlyOne && last !== undefined && (tasks.length > 0) && ((tasks.length - last) < 0)) {
        // ignore (this condition isn't meaningful here)
      }
    }
    // Prefer highest priority that is allowed (cooldown)
    for (const s of subPriority) {
      const last = lastPostDayBySub.get(s);
      const onlyOne = cleanedSubs.length === 1;
      if (onlyOne) return s;
      if (last === undefined) return s;
      if ((tasks.length === 0) || ((tasks.length - last) >= 0)) return s;
    }
    return subPriority[0] || cleanedSubs[0];
  };

  // 2) Analytics-driven group scheduling: Launch -> Milestone -> AMA with conflict avoidance
  
  // Helper to generate optimal time slots for a subreddit based on analytics
  const getOptimalSlots = (subreddit: string, startDay: number, numSlots: number) => {
    const a = analyticsMap.get(subreddit);
    const slots = subSlots.get(subreddit) || [12, 18, 20];
    const slots_ordered = [...slots]; // copy to avoid mutation
    
    // Get preferred weekday if available
    let preferredWeekday: number | null = null;
    if (a && a.best_posting_day !== undefined && a.best_posting_day !== null) {
      preferredWeekday = Number(a.best_posting_day);
    } else if (a && Array.isArray(a.activity_heatmap)) {
      try {
        const daySums = a.activity_heatmap.map((row: number[]) => row.reduce((s: number, v: any) => s + Number(v || 0), 0));
        let maxDay = 0;
        for (let i = 1; i < daySums.length; i++) if ((daySums[i] || 0) > (daySums[maxDay] || 0)) maxDay = i;
        preferredWeekday = maxDay;
      } catch (e) {
        preferredWeekday = null;
      }
    }
    
    // Generate sorted list of day-hour combinations, prioritizing preferred weekday and hours
    const candidates: Array<{day: number, hour: number, score: number}> = [];
    const now = new Date();
    
    for (let d = startDay; d < Math.min(startDay + 14, TOTAL_DAYS); d++) {
      const candidateDate = new Date(now);
      candidateDate.setUTCDate(now.getUTCDate() + d);
      const isPreferredWeekday = preferredWeekday !== null && candidateDate.getUTCDay() === preferredWeekday;
      
      for (let i = 0; i < slots_ordered.length; i++) {
        const hour = slots_ordered[i];
        // Score: preferred weekday + hour priority + day preference (earlier = better)
        const score = (isPreferredWeekday ? 100 : 0) + (10 - i) + (14 - (d - startDay));
        candidates.push({ day: d, hour, score });
      }
    }
    
    // Sort by score (higher is better) and return top slots
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, numSlots);
  };
  
  // 2-4) Per-subreddit chain: Launch -> Milestone -> AMA
  const amaOffsetByKarma: Record<number, [number, number]> = {
    1: [5, 7],
    2: [4, 6],
    3: [3, 5],
    4: [2, 4],
    5: [2, 3]
  };
  const karmaBucket = Math.min(Math.max(Math.floor(karmaLevel), 1), 5);
  const [amaMin, amaMax] = amaOffsetByKarma[karmaBucket] || [3, 5];

  const actualLaunchDays = new Map<string, number>();
  for (const sub of subPriority) {
    // Launch after engagement for this plan
    const launchDesiredDay = engagementDays;
    const launchTask = schedulePost(launchDesiredDay, sub, 'launch', `Launch post in r/${sub}`, { ignoreCooldown: true });
    if (!launchTask) continue;
    actualLaunchDays.set(sub, launchTask.scheduled_day);

    // Milestone 3-5 days after the actual launch day for this subreddit
    const milestoneOffset = 3 + Math.floor(Math.random() * 3);
    const milestoneDesired = Math.min(launchTask.scheduled_day + milestoneOffset, TOTAL_DAYS - 2);
    schedulePost(milestoneDesired, sub, 'milestone', `Milestone update in r/${sub}`, { ignoreCooldown: true });

    // AMA after milestone with karma-based offset
    const amaOffset = amaMin + Math.floor(Math.random() * (amaMax - amaMin + 1));
    const amaDesired = Math.min(milestoneDesired + amaOffset, TOTAL_DAYS - 1);
    schedulePost(amaDesired, sub, 'ama', `AMA in r/${sub}`, { ignoreCooldown: true });
  }

  // 5) Convert generated tasks into dynamic phases per subreddit.
  // Enforce sequence per subreddit: Engagement -> Launch -> Milestone(s) -> AMA(s)
  const phases: any[] = [];

  // Group generated tasks by template and subreddit for assignment
  const tasksByTemplateAndSub = new Map<string, Map<string, any[]>>();
  tasks.forEach(t => {
    const tpl = t.template || 'post';
    const subs = Array.isArray(t.subreddits) && t.subreddits.length ? t.subreddits : [cleanedSubs[0]];
    subs.forEach((s: string) => {
      const bySub = tasksByTemplateAndSub.get(tpl) || new Map<string, any[]>();
      const arr = bySub.get(s) || [];
      arr.push(t);
      bySub.set(s, arr);
      tasksByTemplateAndSub.set(tpl, bySub);
    });
  });

  // Helper to ensure at least N tasks exist for a given template & subreddit; schedule new ones if missing
  // ensureTasksFor: ensure at least minCount scheduled posts exist for templateName & subreddit
  // desiredStartDay (optional): day to begin searching/scheduling from (UTC day offset)
  const ensureTasksFor = (templateName: string, subreddit: string, minCount: number, desiredStartDay?: number) => {
    let bySub = tasksByTemplateAndSub.get(templateName);
    if (!bySub) {
      bySub = new Map();
      tasksByTemplateAndSub.set(templateName, bySub);
    }
    const arr = bySub.get(subreddit) || [];
    let currentDesiredDay = (typeof desiredStartDay === 'number') ? Math.min(Math.max(0, desiredStartDay), TOTAL_DAYS - 1) : Math.min(engagementDays, TOTAL_DAYS - 1);
    
    while (arr.length < minCount) {
      const newTask = schedulePost(currentDesiredDay, subreddit, templateName, `${templateName} in r/${subreddit}`);
      if (newTask) {
        arr.push(newTask);
        // Increment desired day for next task to avoid scheduling at same time
        currentDesiredDay = Math.min(TOTAL_DAYS - 1, currentDesiredDay + 1);
      } else {
        break;
      }
    }
    bySub.set(subreddit, arr);
  };

  // For each subreddit, build sequence phases
  for (const sub of subPriority) {
    // Engagement phase for this subreddit
    const engagementPhaseTasks = tasks.filter(t => t.type === 'engagement' && Array.isArray(t.subreddits) && t.subreddits.includes(sub)).map(t => ({
      id: t.id,
      title: t.title,
      completed: false,
      scheduled_day: t.scheduled_day,
      scheduled_hour: t.scheduled_hour,
      scheduled_at: t.scheduled_at,
      template: t.template,
      post_template: t.post_template,
      details: t.details
    }));
    if (engagementPhaseTasks.length === 0) {
      engagementPhaseTasks.push({ id: `engage_${sub}`, title: `Engage: Comment and contribute to r/${sub}`, completed: false, scheduled_day: undefined, scheduled_hour: undefined, scheduled_at: undefined, template: undefined, post_template: undefined, details: undefined });
    }
    phases.push({ id: `engage_${sub}`, title: `Community Engagement — r/${sub}`, days: `Days 1-${engagementDays}`, description: `Engage authentically with r/${sub}`, tasks: engagementPhaseTasks, completed: false });

    // Launch phase(s) - use existing scheduled tasks
    const launchTasks = (tasksByTemplateAndSub.get('launch')?.get(sub) || []).map((t: any) => ({
      id: t.id,
      title: t.title || `Launch in r/${sub}`,
      completed: false,
      scheduled_day: t.scheduled_day,
      scheduled_hour: t.scheduled_hour,
      scheduled_at: t.scheduled_at,
      template: t.template,
      post_template: t.post_template || getTemplateForType(t.template, t.title || `Launch in r/${sub}`, sub, cleanedSubs),
      details: t.details || getDetailsForType(t.template, t.title || `Launch in r/${sub}`, sub, cleanedSubs)
    }));
    if (launchTasks.length) {
      const firstLaunch = launchTasks[0];
      const dayLabel = (typeof firstLaunch.scheduled_day === 'number') ? `Day ${firstLaunch.scheduled_day}` : `Day ${engagementDays}`;
      phases.push({ id: `launch_${sub}`, title: `Launch — r/${sub}`, days: dayLabel, description: `Introduce your project in r/${sub}`, tasks: launchTasks, completed: false });
    }

    // Alternating Milestone/AMA phases
    const milestoneArr = (tasksByTemplateAndSub.get('milestone')?.get(sub) || []);
    const amaArr = (tasksByTemplateAndSub.get('ama')?.get(sub) || []);
    const pairs = Math.max(milestoneArr.length, amaArr.length);
    for (let i = 0; i < pairs; i++) {
      if (milestoneArr[i]) {
        const t = milestoneArr[i];
        phases.push({ id: `milestone_${sub}_${i}`, title: `Milestone Update — r/${sub}`, days: '', description: 'Share progress and results', tasks: [{
          id: t.id,
          title: t.title || `Milestone in r/${sub}`,
          completed: false,
          scheduled_day: t.scheduled_day,
          scheduled_hour: t.scheduled_hour,
          scheduled_at: t.scheduled_at,
          template: t.template,
          post_template: t.post_template || getTemplateForType(t.template, t.title || `Milestone in r/${sub}`, sub, cleanedSubs),
          details: t.details || getDetailsForType(t.template, t.title || `Milestone in r/${sub}`, sub, cleanedSubs)
        }], completed: false });
      }
      if (amaArr[i]) {
        const t = amaArr[i];
        phases.push({ id: `ama_${sub}_${i}`, title: `AMA — r/${sub}`, days: '', description: 'Host an AMA to engage deeply', tasks: [{
          id: t.id,
          title: t.title || `AMA in r/${sub}`,
          completed: false,
          scheduled_day: t.scheduled_day,
          scheduled_hour: t.scheduled_hour,
          scheduled_at: t.scheduled_at,
          template: t.template,
          post_template: t.post_template || getTemplateForType(t.template, t.title || `AMA in r/${sub}`, sub, cleanedSubs),
          details: t.details || getDetailsForType(t.template, t.title || `AMA in r/${sub}`, sub, cleanedSubs)
        }], completed: false });
      }
    }
  }

  // Ensure global ordering: sort tasks by scheduled_at ascending
  try {
    tasks.sort((a: any, b: any) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  } catch (e) {
    // ignore
  }

  // Sort per-template per-sub arrays
  for (const [tpl, bySub] of tasksByTemplateAndSub.entries()) {
    for (const [s, arr] of bySub.entries()) {
      arr.sort((a: any, b: any) => {
        const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
      bySub.set(s, arr);
    }
    tasksByTemplateAndSub.set(tpl, bySub);
  }

  // Sort tasks inside phases and record earliest time for phase
  const phaseTimes: Map<string, number> = new Map();
  phases.forEach((ph: any) => {
    if (Array.isArray(ph.tasks)) {
      ph.tasks.sort((a: any, b: any) => {
        const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
      const first = ph.tasks[0];
      const time = first && first.scheduled_at ? new Date(first.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      phaseTimes.set(ph.id, time);
    } else {
      phaseTimes.set(ph.id, Number.POSITIVE_INFINITY);
    }
  });

  // Sort phases by their earliest task time (engagement earliest)
  phases.sort((x: any, y: any) => {
    const tx = phaseTimes.get(x.id) ?? Number.POSITIVE_INFINITY;
    const ty = phaseTimes.get(y.id) ?? Number.POSITIVE_INFINITY;
    return tx - ty;
  });

  return phases;
}