const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const waterRoutes = require('./routes/waterRoutes');
const stepsRoutes = require('./routes/stepsRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/water', waterRoutes);
app.use('/steps', stepsRoutes);
app.use('/exercise', exerciseRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FitTracker API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
