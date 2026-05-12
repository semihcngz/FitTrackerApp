const pool = require('../config/db');

// Get today's exercises
const getExercises = async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM exercises
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
       ORDER BY created_at DESC`,
      [userId]
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

// Add a new exercise
const addExercise = async (req, res) => {
  const { userId, exercise_type, activity, duration_minutes, calories_burned } = req.body;

  if (!userId || !exercise_type || !activity || !duration_minutes || !calories_burned) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO exercises (user_id, exercise_type, activity, duration_minutes, calories_burned)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, exercise_type, activity, duration_minutes, calories_burned]
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

module.exports = { getExercises, addExercise, deleteExercise };
