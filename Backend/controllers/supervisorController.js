// const mongoose = require("mongoose");
// const Supervisor = require("./models/Supervisor");

// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(async () => {
//     await Supervisor.insertMany([
//       { email: "supervisor1@example.com", name: "Supervisor One" },
//       { email: "supervisor2@example.com", name: "Supervisor Two" },
//       { email: "supervisor3@example.com", name: "Supervisor Three" },
//     ]);
//     console.log("Supervisors added");
//     mongoose.connection.close();
//   })
//   .catch((err) => console.error(err));