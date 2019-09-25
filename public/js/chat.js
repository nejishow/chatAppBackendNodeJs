const socket = io()

socket.on("message",(message)=>{
    console.log(message);
    
})
document.querySelector("#increment").addEventListener("click",()=>{
    console.log("clicked");
    socket.emit("increment")
    
})