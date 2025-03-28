/*
  # Create strokes table for whiteboard

  1. New Tables
    - `strokes`
      - `id` (uuid, primary key)
      - `points` (jsonb array of x,y coordinates)
      - `color` (text)
      - `width` (integer)
      - `user_id` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `strokes` table
    - Add policies for authenticated users to read and write strokes
*/

CREATE TABLE IF NOT EXISTS strokes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  points jsonb NOT NULL,
  color text NOT NULL,
  width integer NOT NULL,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE strokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read strokes"
  ON strokes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert strokes"
  ON strokes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);