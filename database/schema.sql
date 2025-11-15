-- Loch Ness Marathon Trainer - Database Schema
-- Supabase PostgreSQL Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Personal Info
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    
    -- Training Background
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
    current_weekly_km INTEGER DEFAULT 0,
    longest_recent_run INTEGER DEFAULT 0, -- in minutes
    
    -- Availability
    sessions_per_week INTEGER CHECK (sessions_per_week BETWEEN 3 AND 6) NOT NULL,
    time_per_session INTEGER NOT NULL, -- in minutes
    time_preferences TEXT[], -- array of: morning, lunch, evening, weekend
    
    -- Goals
    goal_type TEXT CHECK (goal_type IN ('finish', 'time', 'pr')) NOT NULL,
    target_time TEXT, -- format: "HH:MM"
    race_date DATE NOT NULL DEFAULT '2026-09-27',
    
    -- Cross Training
    cross_training TEXT[], -- array of: cycling, swimming, strength
    
    -- Medical
    medications TEXT[], -- array of: statin, bloodthinner, other, none
    injuries TEXT,
    medical_notes TEXT,
    
    -- Preferences
    prefer_outdoor BOOLEAN DEFAULT true,
    prefer_morning BOOLEAN DEFAULT false
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ============================================
-- TRAINING PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Plan Metadata
    plan_name TEXT DEFAULT 'Loch Ness Marathon 2026',
    start_date DATE NOT NULL,
    race_date DATE NOT NULL,
    total_weeks INTEGER DEFAULT 45,
    
    -- AI Generation Info
    generated_by TEXT DEFAULT 'claude-sonnet-4',
    generation_prompt TEXT, -- Store the full prompt used
    
    -- Plan Status
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    
    -- Full plan data (JSONB for flexibility)
    plan_data JSONB NOT NULL,
    /* Structure:
    {
        "weeks": [
            {
                "week_number": 1,
                "phase": "Fase 1 - Terug in beweging",
                "total_minutes": 180,
                "workouts": [
                    {
                        "day": "Monday",
                        "type": "Run-Walk",
                        "duration": 30,
                        "description": "10×(1' jog / 2' wandelen)",
                        "intensity": "Z2",
                        "notes": "Talk test - je moet kunnen praten"
                    }
                ]
            }
        ],
        "personalization": {
            "sessions_per_week": 4,
            "target_pace": "5:30 min/km",
            "medical_considerations": ["statines"],
            "deload_weeks": [4, 8, 12, ...]
        }
    }
    */
    
    UNIQUE(user_id, is_active) WHERE is_active = true -- Only one active plan per user
);

-- Row Level Security
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" 
    ON training_plans FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" 
    ON training_plans FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" 
    ON training_plans FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" 
    ON training_plans FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- WORKOUT PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workout_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Workout Identification
    week_number INTEGER NOT NULL,
    workout_day TEXT NOT NULL, -- Monday, Tuesday, etc.
    workout_type TEXT NOT NULL,
    
    -- Completion Status
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    skipped BOOLEAN DEFAULT false,
    
    -- Actual Performance
    actual_duration INTEGER, -- in minutes
    actual_distance NUMERIC(5,2), -- in km
    actual_pace TEXT, -- min/km format
    average_heart_rate INTEGER,
    
    -- Subjective Metrics
    perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
    felt_good BOOLEAN,
    notes TEXT,
    
    -- Weather & Conditions
    weather TEXT,
    temperature INTEGER,
    location TEXT, -- indoor/outdoor/trail
    
    UNIQUE(plan_id, week_number, workout_day)
);

-- Row Level Security
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" 
    ON workout_progress FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
    ON workout_progress FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
    ON workout_progress FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" 
    ON workout_progress FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================
-- WEEKLY REFLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_reflections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    week_number INTEGER NOT NULL,
    
    -- Reflection Questions
    how_did_week_go INTEGER CHECK (how_did_week_go BETWEEN 1 AND 5), -- 1=terrible, 5=excellent
    training_completed INTEGER, -- number of sessions completed
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 5),
    
    -- Health & Recovery
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
    any_pain BOOLEAN,
    pain_description TEXT,
    resting_heart_rate INTEGER,
    
    -- Notes
    highlights TEXT,
    challenges TEXT,
    notes TEXT,
    
    UNIQUE(plan_id, week_number)
);

-- Row Level Security
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reflections" 
    ON weekly_reflections FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections" 
    ON weekly_reflections FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections" 
    ON weekly_reflections FOR UPDATE 
    USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_plans_updated_at BEFORE UPDATE ON training_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate week statistics
CREATE OR REPLACE FUNCTION get_week_stats(p_plan_id UUID, p_week_number INTEGER)
RETURNS TABLE (
    total_workouts INTEGER,
    completed_workouts INTEGER,
    total_distance NUMERIC,
    total_time INTEGER,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_workouts,
        COUNT(*) FILTER (WHERE completed = true)::INTEGER as completed_workouts,
        COALESCE(SUM(actual_distance), 0) as total_distance,
        COALESCE(SUM(actual_duration), 0)::INTEGER as total_time,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
            ELSE 0 
        END as completion_percentage
    FROM workout_progress
    WHERE plan_id = p_plan_id 
    AND week_number = p_week_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get overall plan statistics
CREATE OR REPLACE FUNCTION get_plan_stats(p_plan_id UUID)
RETURNS TABLE (
    total_workouts INTEGER,
    completed_workouts INTEGER,
    total_distance NUMERIC,
    total_time INTEGER,
    current_week INTEGER,
    weeks_completed INTEGER,
    overall_completion NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_workouts,
        COUNT(*) FILTER (WHERE completed = true)::INTEGER as completed_workouts,
        COALESCE(SUM(actual_distance), 0) as total_distance,
        COALESCE(SUM(actual_duration), 0)::INTEGER as total_time,
        COALESCE(MAX(week_number), 1)::INTEGER as current_week,
        COUNT(DISTINCT week_number) FILTER (WHERE completed = true)::INTEGER as weeks_completed,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE completed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
            ELSE 0 
        END as overall_completion
    FROM workout_progress
    WHERE plan_id = p_plan_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_workout_progress_user_plan ON workout_progress(user_id, plan_id);
CREATE INDEX idx_workout_progress_week ON workout_progress(week_number);
CREATE INDEX idx_training_plans_active ON training_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_weekly_reflections_week ON weekly_reflections(plan_id, week_number);

-- ============================================
-- VIEWS for Easy Queries
-- ============================================

-- View: Current active plan for user
CREATE OR REPLACE VIEW user_active_plan AS
SELECT 
    tp.*,
    up.full_name,
    up.experience_level,
    up.sessions_per_week
FROM training_plans tp
JOIN user_profiles up ON tp.user_id = up.id
WHERE tp.is_active = true;

-- View: Weekly summary
CREATE OR REPLACE VIEW weekly_summary AS
SELECT 
    wp.user_id,
    wp.plan_id,
    wp.week_number,
    COUNT(*) as total_workouts,
    COUNT(*) FILTER (WHERE completed = true) as completed_workouts,
    COALESCE(SUM(actual_distance), 0) as total_distance,
    COALESCE(SUM(actual_duration), 0) as total_time,
    ROUND(AVG(perceived_effort) FILTER (WHERE perceived_effort IS NOT NULL), 1) as avg_effort
FROM workout_progress wp
GROUP BY wp.user_id, wp.plan_id, wp.week_number
ORDER BY wp.week_number;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON TABLE user_profiles IS 'User profile information and training preferences';
COMMENT ON TABLE training_plans IS 'AI-generated personalized training plans';
COMMENT ON TABLE workout_progress IS 'Individual workout completion and performance tracking';
COMMENT ON TABLE weekly_reflections IS 'Weekly training reflections and health check-ins';

-- Setup complete!
SELECT 'Database schema created successfully! 🎉' as status;
