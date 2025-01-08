// const { default: mongoose } = require("mongoose");
// const Document = require("./Document");
// require("dotenv").config();
// const http =require("http");
// const { MONGO_URL } = process.env;

// const cors = require('cors');
// const express = require('express');
// const app = express();

// app.use(cors());

// mongoose.connect( MONGO_URL).then(()=>console.log("connected to DB successfully"));
// const server=http.createServer();
// // const io=require("socket.io")(server,{
// //     cors: {
// //         origin: "*",
// //         methods: ["GET", "POST"],
// //         credentials: true
// //       }
// // })

// const io = require('socket.io')(server, {
//     cors: {
//       origin: "http://localhost:5173", // Replace with your frontend URL
//       methods: ["GET", "POST"]
//     }
//   });


// io.on('connection', (socket) => {
//   console.log("User connected");

//   let currentDocumentId;

//   // Listener for loading documents
//   socket.on('get-document', async (documentId) => {
//       currentDocumentId = documentId;
//       const document = await findorcreateDocument(documentId);
//       socket.join(documentId);
//       socket.emit("load-document", document.data);
//   });

//   // Set up listeners only once per connection
//   socket.on("send-changes", (delta) => {
//       if (currentDocumentId) {
//           socket.broadcast.to(currentDocumentId).emit("receive-changes", delta);
//       }
//   });

//   socket.on("save-document", async (data) => {
//       if (currentDocumentId) {
//           await Document.findByIdAndUpdate(currentDocumentId, { data });
//       }
//   });

//   socket.on('disconnect', () => {
//       console.log("User disconnected");
//   });

//   socket.on('error', (err) => {
//       console.error('Socket error:', err);
//   });
// });




// async function findorcreateDocument(id){
//     if(id==null) return;
//     const document=await Document.findById(id);
//     if(document) return document;
//     return await Document.create({
//         _id:id,
//         data:""
//     })

// }



// const PORT = process.env.PORT || 5000;
// server.listen(PORT,()=>{
//   console.log("server is running successfully");
// })


const { default: mongoose } = require("mongoose");
const Document = require("./Document");
require("dotenv").config();
const http = require("http");
const { MONGO_URL } = process.env;

const cors = require('cors');
const express = require('express');
const app = express();

// Use CORS middleware for Express (although the socket.io config handles this separately)
app.use(cors());

mongoose.connect(MONGO_URL)
  .then(() => console.log("Connected to DB successfully"))
  .catch(err => console.error("Database connection failed:", err));

const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
// const io = require('socket.io')(server, {
//   cors: {
//     origin: "http://localhost:5173", // Replace with your frontend URL
//     methods: ["GET", "POST"]
//   }
// });

// const io = require('socket.io')(server, {
//     cors: {
//       origin: "http://localhost:5173", // Replace with your frontend URL
//       methods: ["GET", "POST"],
//       allowedHeaders: ["Content-Type"], // You can adjust the headers as needed
//       credentials: true, // Allow credentials if needed
//     },
//   });

const io = require('socket.io')(server, {
    cors: {
      origin: "http://localhost:5173", // Adjust as needed
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Enable both transports
  });
  

io.on('connection', (socket) => {
  console.log("User connected");

  let currentDocumentId;

  // Listener for loading documents
  socket.on('get-document', async (documentId) => {
    currentDocumentId = documentId;
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
  });

  // Listener for receiving and broadcasting changes
  socket.on("send-changes", (delta) => {
    if (currentDocumentId) {
      socket.broadcast.to(currentDocumentId).emit("receive-changes", delta);
    }
  });

  // Listener for saving document data
  socket.on("save-document", async (data) => {
    if (currentDocumentId) {
      try {
        await Document.findByIdAndUpdate(currentDocumentId, { data });
      } catch (err) {
        console.error("Error saving document:", err);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log("User disconnected");
  });

  // Handle socket errors
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// Helper function to find or create a document
async function findOrCreateDocument(id) {
  if (!id) return null;

  try {
    let document = await Document.findById(id);
    if (document) return document;

    // If document doesn't exist, create a new one
    return await Document.create({
      _id: id,
      data: ""  // Initial document data (empty string)
    });
  } catch (err) {
    console.error("Error finding or creating document:", err);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
