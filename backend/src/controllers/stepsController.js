const pool = require('../config/db');

// Get today's steps data
const getSteps = async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM steps WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ step_count: 0, goal: 10000 });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get steps error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add or update today's steps
const updateSteps = async (req, res) => {
  const { userId, stepCount, goal } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO steps (user_id, step_count, goal, date)
       VALUES ($1, $2, $3, CURRENT_DATE)
       ON CONFLICT (user_id, date)
       DO UPDATE SET step_count = $2, goal = $3
       RETURNING *`,
      [userId, stepCount, goal]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Update steps error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getSteps, updateSteps };
