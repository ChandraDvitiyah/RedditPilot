// Test script to debug Supabase analytics insertion
// Run this in browser console on the frontend to test data format

const testAnalyticsData = {
  subreddit: "programming",
  subscriber_count: 6784993,
  active_users: 0,
  activity_heatmap: JSON.stringify([[0,0,0,183,0,0,0,0,0,0,0,0,0,237,0,95,709,0,423,0,1706,135,471,0],[289,0,239,0,0,0,0,0,0,0,0,167,199,0,0,0,0,8380,136,0,1441,0,2420,372],[0,794,0,0,0,0,0,0,581,0,0,331,0,0,607,126,373,581,477,1181,259,0,308,0],[0,0,496,0,133,1661,0,0,0,0,493,0,1219,0,188,0,195,278,0,827,564,161,128,546],[0,0,1296,0,0,650,0,0,0,0,156,404,0,0,0,121,0,0,504,1379,0,324,869,2583],[0,0,0,0,0,0,0,0,544,580,855,0,0,279,0,0,350,115,0,1083,205,615,920,733],[0,1073,0,0,0,0,0,0,0,0,2445,0,0,0,0,0,0,0,101,0,1480,229,0,1160]]),
  best_posting_day: "Monday",
  best_posting_hour: 17,
  top_posts: JSON.stringify([{"title":"AWS CEO Says Replacing Junior Developers with AI Is the Dumbest Thing He's Ever Heard","score":8188,"num_comments":417,"url":"https://www.finalroundai.com/blog/aws-ceo-matt-garman-says-replacing-junior-developers-with-ai-the-dumbest-thing","created_utc":1756122959,"author":"Infamous_Toe_7759","permalink":"https://reddit.com/r/programming/comments/1mzofsk/aws_ceo_says_replacing_junior_developers_with_ai/","subreddit":"programming"}]),
  avg_engagement_score: 640.55,
  last_updated: new Date().toISOString()
};

console.log('Test data structure:', testAnalyticsData);

// Test the insert operation
// const { error } = await supabase.from('subreddit_analytics').insert([testAnalyticsData]);
// console.log('Insert result:', error);