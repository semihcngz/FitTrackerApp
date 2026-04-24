const pool = require('../config/db');

// Get today's water data
const getWater = async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM waters WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ glasses: 0, goal: 8 });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get water error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add or update today's water
const updateWater = async (req, res) => {
  const { userId, glasses, goal } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO waters (user_id, glasses, goal, date)
       VALUES ($1, $2, $3, CURRENT_DATE)
       ON CONFLICT (user_id, date)
       DO UPDATE SET glasses = $2, goal = $3
       RETURNING *`,
      [userId, glasses, goal]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Update water error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getWater, updateWater };
