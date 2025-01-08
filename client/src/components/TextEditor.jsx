// import React, { useCallback, useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { io } from "socket.io-client";
// import Quill from "quill";
// import "quill/dist/quill.snow.css";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const SAVE_INTERVAL_MS=2000;

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],
  ["link", "image", "video", "formula"],

  [{ header: 1 }, { header: 2 }], // custom button values
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ script: "sub" }, { script: "super" }], 
  [{ indent: "-1" }, { indent: "+1" }], 
  [{ direction: "rtl" }], 

  [{ size: ["small", false, "large", "huge"] }], 
  [{ header: [1, 2, 3, 4, 5, 6, false] }],

  [
    { color: ["red", "yellow", "black", "green", "coral"] },
    { background: ["red", "yellow", "black", "green", "coral"] },
  ], 
  [{ font: [] }],
  [{ align: [] }],

  ["clean"], 
];


// const TextEditor=()=> {
//   const { id: documentId } = useParams();
//   const [socket, setSocket] = useState();
//   const [quill, setQuill] = useState();

//   useEffect(() => {
//     //connecting to backend socket io server;
//     const s = io("https://realtime-docs-collab.onrender.com");
//     setSocket(s);
//     return () => {
//       s.disconnect();
//     };
//   }, []);


//   useEffect(()=>{
//     if(socket==null||quill ==null) return;
//     const interval=setInterval(()=>{
//         socket.emit('save-document',quill.getContents());
//     },SAVE_INTERVAL_MS)
//     return ()=>clearInterval(interval);
//   },[socket, quill]);


//   useEffect(() => {
//     if (socket == null || quill == null) return;
//     socket.emit("get-document", documentId);
//     socket.once("load-document", (document) => {
//       quill.setContents(document);
//       quill.enable();
//     });
    
//   }, [socket, quill, documentId]);


//   useEffect(()=>{
//     if(socket==null || quill==null ) return;
//     socket.emit("get-document", documentId);
//     const handler=(delta,oldDelta,source)=>{
//         if(source!=="user") return;
//         socket.emit('send-changes',delta);
//     }
//     quill.on('text-change',handler);

//     return ()=>{
//         quill.off('text-change',handler); 
//     }
//   },[socket,quill])


//   useEffect(()=>{
//    if(socket==null || quill==null ) return;
//    const handler=(delta) => {
//     quill.updateContents(delta);
//    }
//    socket.on('receive-changes',handler );
//    return ()=>{
//     socket.off('receive-changes',handler);
//    }
//   },[socket,quill])


// const wrapperRef = useCallback((wrapper) => {
//     if (wrapper == null) return;
//     wrapper.innerHTML = "";
//     const editor = document.createElement("div");
//     wrapper.append(editor);
//     const q = new Quill(editor, {
//       theme: "snow",
//       modules: {
//         toolbar: toolbarOptions,
//       },
//     });

//     q.setText("loading...");
//     setQuill(q);
//   }, []);


//   return (
//   <>
//   <h2 id="top">Realtime Docs</h2>
  
//   <div className="container" ref={wrapperRef}></div>
//   </>
//   )}

// export default TextEditor;


const TextEditor = () => {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);

  // Establish Socket.IO connection
  useEffect(() => {
    // const s = io("https://realtime-docs-collab.onrender.com");
    const s = io("http://localhost:5000", {
      transports: ['websocket'],
    });
    
    setSocket(s);

    s.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      alert("Failed to connect to the server. Please try again later.");
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Auto-save document every SAVE_INTERVAL_MS milliseconds
  useEffect(() => {
    if (socket == null || quill == null) return;
    
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socket, quill]);

  // Load document when the editor is ready
  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.emit("get-document", documentId);
    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });
  }, [socket, quill, documentId]);

  // Handle user text changes and emit them
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  // Apply received changes to the editor
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  // Initialize Quill editor
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);

    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: toolbarOptions,
      },
    });

    q.setText("loading...");  // Placeholder text while loading
    setQuill(q);
  }, []);

  return (
    <>
      <h2>Realtime Docs</h2>
      <div className="container" ref={wrapperRef}></div>
    </>
  );
};

export default TextEditor;