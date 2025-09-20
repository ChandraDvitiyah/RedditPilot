// Debug script to test project data
// Copy this into the browser console on the frontend (localhost:2040)

// Test fetching a specific project
const testProjectId = "5e15adbc-4a4c-4c10-ae8c-49d2eac32348";

console.log("Testing project fetch for ID:", testProjectId);

// Mock user for testing
const mockUser = { id: "user_12345" };

// Simulate the Timeline component's project fetching logic
async function testProjectFetch() {
  try {
    console.log("1. Fetching project data...");
    
    // This simulates the supabase query from Timeline component
    const projectQuery = supabase
      .from('projects')
      .select('*')
      .eq('id', testProjectId);
      
    console.log("Query:", projectQuery);
    
    // If you have a user session, add this line:
    // .eq('user_id', user.id)
    
    const { data: projectData, error: projectError } = await projectQuery.single();
    
    if (projectError) {
      console.error("Project error:", projectError);
      return;
    }
    
    console.log("2. Project data found:", projectData);
    
    // Test timeline data fetch
    console.log("3. Fetching timeline data...");
    const { data: timelineData, error: timelineError } = await supabase
      .from('project_timelines')
      .select('timeline_data')
      .eq('project_id', testProjectId);
      
    if (timelineError) {
      console.error("Timeline error:", timelineError);
    } else {
      console.log("4. Timeline data:", timelineData);
    }
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

console.log("Run testProjectFetch() to test the queries");