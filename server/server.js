const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reservations', require('./routes/reservations'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
