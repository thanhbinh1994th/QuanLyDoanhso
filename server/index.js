const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static client files
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use(routes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
