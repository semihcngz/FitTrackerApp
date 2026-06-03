const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
  override: true,
});

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const waterRoutes = require('./routes/waterRoutes');
const stepsRoutes = require('./routes/stepsRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const foodRoutes = require('./routes/foodRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/auth', authRoutes);
app.use('/water', waterRoutes);
app.use('/steps', stepsRoutes);
app.use('/exercise', exerciseRoutes);
app.use('/food', foodRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FitTracker API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
