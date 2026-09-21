# Tech King Classes — Quiz Management

## What was added
- Admin Quiz Management at `/admin/quizzes`
- Create/edit/delete module and final quizzes
- Passing percentage and optional time limit
- Publish/unpublish quizzes
- Randomize questions/options settings
- Question bank management
- Four-option MCQ editor with correct-answer selection
- Optional explanations and question ordering
- Admin-only access to `quiz_answer_keys`

## Supabase migration
Run this in Supabase SQL Editor:
`supabase/migrations/20260921_admin_quiz_answer_keys.sql`

This migration does not expose answer keys to students or anonymous users; only admin users can manage them.
