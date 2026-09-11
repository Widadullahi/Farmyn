const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Farmyn Backend API');
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
