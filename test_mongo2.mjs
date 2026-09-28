import mongoose from 'mongoose';

const uri = "mongodb+srv://pmnoushu010:Aamir12345@cluster0.ary1pde.mongodb.net/question-app?retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
