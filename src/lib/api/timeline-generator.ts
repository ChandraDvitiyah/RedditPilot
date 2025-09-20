interface TimelineItem {
  id: string;
  type: 'post' | 'comment' | 'engagement' | 'milestone';
  title: string;
  description: string;
  subreddit?: string;
  scheduledDate: string; // ISO string in user's timezone
  template: string;
  status: 'pending' | 'completed' | 'skipped';
  metadata?: {
    postType?: 'launch' | 'ama' | 'milestone' | 'update' | 'showcase';
    engagementGoal?: number;
    templateContent?: string;
  };
}

interface ProjectTimelineData {
  projectId: string;
  items: TimelineItem[];
  totalDuration: number; // days
  postsCount: number;
  engagementTasksCount: number;
}

interface SubredditAnalytics {
  subreddit: string;
  best_posting_day: number;
  best_posting_hour: number;
  avg_engagement_score: number;
}

class TimelineGenerator {
  private postTemplates = {
    launch: {
      title: "🚀 Introducing [Project Name]",
      description: "Share your project launch with the community",
      content: "Hey r/{subreddit}! I'm excited to introduce [Project Name] - [brief description]. Would love to get your feedback!"
    },
    ama: {
      title: "🤔 AMA about [Project Name]",
      description: "Host an Ask Me Anything session",
      content: "I'm the creator of [Project Name] and happy to answer any questions about [topic/industry]!"
    },
    milestone: {
      title: "🎉 [Project Name] Milestone Update",
      description: "Share project achievements and progress",
      content: "Excited to share that [Project Name] just hit [milestone]! Here's what we learned and what's next..."
    },
    update: {
      title: "📈 [Project Name] Progress Update",
      description: "Regular progress update post",
      content: "Quick update on [Project Name]'s progress. Here's what we've been working on..."
    },
    showcase: {
      title: "✨ [Project Name] Feature Showcase",
      description: "Highlight specific features or capabilities",
      content: "Want to show off this cool feature of [Project Name]..."
    }
  };

  private getEngagementTasks(karmaLevel: number): string[] {
    const baseTasks = [
      "Respond to comments on recent posts",
      "Engage with community discussions",
      "Share helpful insights in relevant threads",
      "Comment thoughtfully on trending posts"
    ];

    const lowKarmaTasks = [
      "Build reputation by helping others",
      "Ask thoughtful questions to start discussions",
      "Share valuable resources and links",
      "Participate in community events or weekly threads"
    ];

    return karmaLevel <= 2 ? [...baseTasks, ...lowKarmaTasks] : baseTasks;
  }

  private convertToUserTimezone(utcDate: Date, timezone: string): Date {
    // For simplicity, using UTC offset calculation
    // In production, use a proper timezone library like date-fns-tz
    const utcTime = utcDate.getTime();
    const utcOffset = utcDate.getTimezoneOffset() * 60000;
    const userTime = new Date(utcTime + utcOffset);
    
    // This is a simplified conversion - you'd want to use a proper timezone library
    return userTime;
  }

  private getOptimalPostingTime(analytics: SubredditAnalytics[], timezone: string): { day: number; hour: number } {
    if (analytics.length === 0) {
      return { day: 2, hour: 14 }; // Default: Tuesday 2 PM
    }

    // Calculate weighted average of best posting times
    const totalEngagement = analytics.reduce((sum, a) => sum + a.avg_engagement_score, 0);
    
    let weightedDay = 0;
    let weightedHour = 0;

    analytics.forEach(a => {
      const weight = a.avg_engagement_score / totalEngagement;
      weightedDay += a.best_posting_day * weight;
      weightedHour += a.best_posting_hour * weight;
    });

    return {
      day: Math.round(weightedDay) % 7,
      hour: Math.round(weightedHour) % 24
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  generateTimeline(
    projectId: string,
    projectName: string,
    targetSubreddits: string[],
    karmaLevel: number,
    subredditAnalytics: SubredditAnalytics[],
    timezone: string = 'UTC',
    durationDays: number = 90
  ): ProjectTimelineData {
    const timeline: TimelineItem[] = [];
    const startDate = new Date();
    
    // Get optimal posting time based on analytics
    const optimalTiming = this.getOptimalPostingTime(subredditAnalytics, timezone);
    
    // Define posting strategy based on karma level
    const postsPerWeek = karmaLevel <= 2 ? 3 : 5; // Low karma: focus on engagement first
    const engagementDaysPerWeek = 7 - Math.ceil(postsPerWeek / 2); // Fill non-posting days with engagement
    
    let currentDate = new Date(startDate);
    let postCount = 0;
    let subredditIndex = 0;
    
    // Template cycle for posts
    const templateCycle = ['launch', 'update', 'showcase', 'ama', 'milestone'];
    let templateIndex = 0;

    // Generate timeline for the specified duration
    for (let day = 0; day < durationDays; day++) {
      const dayOfWeek = currentDate.getDay();
      const isOptimalDay = dayOfWeek === optimalTiming.day || 
                          Math.abs(dayOfWeek - optimalTiming.day) <= 1;
      
      // Determine if this should be a posting day (max 2 posts per day across all subreddits)
      const shouldPost = isOptimalDay && 
                        (postCount < 2) && 
                        (day === 0 || day % Math.ceil(7 / postsPerWeek) === 0);

      if (shouldPost && subredditIndex < targetSubreddits.length) {
        // Schedule a post
        const subreddit = targetSubreddits[subredditIndex % targetSubreddits.length];
        const template = templateCycle[templateIndex % templateCycle.length];
        const templateData = this.postTemplates[template as keyof typeof this.postTemplates];
        
        const postDate = new Date(currentDate);
        postDate.setHours(optimalTiming.hour, 0, 0, 0);
        
        timeline.push({
          id: this.generateId(),
          type: 'post',
          title: templateData.title.replace('[Project Name]', projectName),
          description: templateData.description,
          subreddit,
          scheduledDate: postDate.toISOString(),
          template,
          status: 'pending',
          metadata: {
            postType: template as any,
            templateContent: templateData.content
              .replace(/\[Project Name\]/g, projectName)
              .replace('{subreddit}', subreddit)
          }
        });
        
        subredditIndex++;
        templateIndex++;
        postCount++;
      } else {
        // Schedule engagement tasks for non-posting days
        if (day > 0) { // Skip first day
          const engagementTasks = this.getEngagementTasks(karmaLevel);
          const randomTask = engagementTasks[Math.floor(Math.random() * engagementTasks.length)];
          
          const engagementDate = new Date(currentDate);
          engagementDate.setHours(Math.max(10, optimalTiming.hour - 2), 0, 0, 0);
          
          timeline.push({
            id: this.generateId(),
            type: 'engagement',
            title: randomTask,
            description: 'Community engagement activity',
            scheduledDate: engagementDate.toISOString(),
            template: 'engagement',
            status: 'pending',
            metadata: {
              engagementGoal: karmaLevel <= 2 ? 5 : 3 // More engagement for low karma users
            }
          });
        }
      }

      // Add milestone markers every 2 weeks
      if (day > 0 && day % 14 === 0) {
        const milestoneDate = new Date(currentDate);
        milestoneDate.setHours(12, 0, 0, 0);
        
        timeline.push({
          id: this.generateId(),
          type: 'milestone',
          title: `Week ${Math.ceil(day / 7)} Review`,
          description: 'Review progress and plan next steps',
          scheduledDate: milestoneDate.toISOString(),
          template: 'milestone',
          status: 'pending',
          metadata: {
            postType: 'milestone'
          }
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      postCount = 0; // Reset daily post count
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    const postsCount = timeline.filter(item => item.type === 'post').length;
    const engagementTasksCount = timeline.filter(item => item.type === 'engagement').length;

    return {
      projectId,
      items: timeline,
      totalDuration: durationDays,
      postsCount,
      engagementTasksCount
    };
  }
}

export const timelineGenerator = new TimelineGenerator();
export type { TimelineItem, ProjectTimelineData };