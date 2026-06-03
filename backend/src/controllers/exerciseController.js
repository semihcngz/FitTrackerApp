const pool = require('../config/db');


const getDateFromQuery = (req, res) => {
  const date = req.query.date;

  return date;
};

const getMondayOfWeek = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay();
  const daysAfterMonday = dayIndex === 0 ? 6 : dayIndex - 1;

  date.setDate(date.getDate() - daysAfterMonday);

  const mondayYear = date.getFullYear();
  const mondayMonth = String(date.getMonth() + 1).padStart(2, '0');
  const mondayDay = String(date.getDate()).padStart(2, '0');

  return `${mondayYear}-${mondayMonth}-${mondayDay}`;
};

const getExercises = async (req, res) => {
  const userId = req.params.userId;
  const localDate = getDateFromQuery(req, res);
  if (!localDate) return;

  try {
    const result = await pool.query(
      `SELECT * FROM exercises
       WHERE user_id = $1 AND created_at::date = $2::date
       ORDER BY created_at DESC`,
      [userId, localDate]
    );

    const totalCalories = result.rows.reduce((sum, ex) => sum + ex.calories_burned, 0);
    const totalMinutes = result.rows.reduce((sum, ex) => sum + ex.duration_minutes, 0);

    res.status(200).json({
      exercises: result.rows,
      total_calories: totalCalories,
      total_minutes: totalMinutes,
    });
  } catch (err) {
    console.error('Get exercises error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const getWeeklyExerciseStats = async (req, res) => {
  const userId = req.params.userId;
  const localDate = getDateFromQuery(req, res);
  if (!localDate) return;

  try {
    const result = await pool.query(
      `WITH history_days AS (
         SELECT generate_series(
           $2::date - INTERVAL '21 days',
           $2::date + INTERVAL '6 days',
           INTERVAL '1 day'
         )::date AS day
       )
       SELECT
         TO_CHAR(history_days.day, 'YYYY-MM-DD') AS day,
         COALESCE(SUM(ex.calories_burned), 0)::int AS total_calories,
         COALESCE(SUM(ex.duration_minutes), 0)::int AS total_minutes,
         COALESCE(COUNT(ex.id), 0)::int AS workout_count
       FROM history_days
       LEFT JOIN exercises ex
         ON ex.user_id = $1
        AND ex.created_at::date = history_days.day
       GROUP BY history_days.day
       ORDER BY history_days.day ASC`,
      [userId, getMondayOfWeek(localDate)]
    );

    const totals = result.rows.reduce(
      (acc, day) => {
        acc.calories += day.total_calories;
        acc.minutes += day.total_minutes;
        acc.workouts += day.workout_count;
        return acc;
      },
      { calories: 0, minutes: 0, workouts: 0 }
    );

    res.status(200).json({
      days: result.rows,
      total_calories: totals.calories,
      total_minutes: totals.minutes,
      workout_count: totals.workouts,
    });
  } catch (err) {
    console.error('Get exercise history stats error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

const addExercise = async (req, res) => {
  const { userId, exercise_type, activity, duration_minutes, calories_burned, local_date } = req.body;

  if (!userId || !exercise_type || !activity || !duration_minutes || !calories_burned) {
    return res.status(400).json({ error: 'All fields are required' });
  }


  try {
    const result = await pool.query(
      `INSERT INTO exercises (user_id, exercise_type, activity, duration_minutes, calories_burned, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::date)
       RETURNING *`,
      [userId, exercise_type, activity, duration_minutes, calories_burned, local_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add exercise error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete an exercise
const deleteExercise = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const result = await pool.query(
      'DELETE FROM exercises WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.status(200).json({ message: 'Exercise deleted' });
  } catch (err) {
    console.error('Delete exercise error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getExercises, getWeeklyExerciseStats, addExercise, deleteExercise };
