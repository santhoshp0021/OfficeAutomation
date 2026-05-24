require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await mongoose.connection.collection('enrollments').drop().catch(() => {
      console.log('Collection did not exist or already empty.');
    });
    console.log('enrollments collection dropped. Start fresh from the admin UI.');
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });
