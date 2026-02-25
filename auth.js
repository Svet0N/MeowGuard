// auth.js - Supabase Initialization & Helpers
const SUPABASE_URL = 'https://fzbhvfegkjwkwtgbftsy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6Ymh2ZmVna2p3a3d0Z2JmdHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjcyOTYsImV4cCI6MjA4NzU0MzI5Nn0.o3oyt8-jt4oNEolCDg_nCFYkEzdxHL8VqcrMhfIO31c';

// Initialize Supabase Client (attached to window for global access if needed, or just let it be)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper for check session
const getSession = async () => {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) console.error("Session fetch error:", error);
    return session;
};

// Sign Out
const signOut = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
};
