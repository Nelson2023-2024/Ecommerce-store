import { configDotenv } from 'dotenv';
import express from 'express';
configDotenv();
const app = express();
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
