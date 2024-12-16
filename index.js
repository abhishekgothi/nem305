const express =require("express");
const http=require("http");
const { Server } =require('socket.io');
const Redis=require('ioredis');
var cron = require('node-cron');

const app=express();

const server=http.createServer(app);
const io =new Server(server);

const redis=new Redis();

app.use(express.json());

io.on('connection',(socket)=>{
    console.log("New Client Connected:",socket.id);

    socket.on('newDoubt' , async (doubt)=>{
        io.emit('doubtPosted', doubt);

        const recentDoubtKey='recentDoubts';
        await redis.lpush(recentDoubtsKey,JSON.stringify(doubt));
        await redis.ltrim(recentDoubtsKey,0 ,9);

        socket.on('resolveDoubt', async (doubtId)=>{
                io.emit('doubtResolved',doubtId);

                const unansweredDoubtsKey='unansweredDoubts';
                await redis.lrem(unansweredDoubtsKey,0,doubtId)
        })

        socket.on('disconnect',()=>{
            console.log('Client disconnected:',socket.id)
        })

    });



})
cron.schedule('1,2,4,5 * * * *', () => {
    app.get('/unanswered-doubts',async (req,res)=>{
        const unansweredDoubtsKey="unansweredDoubts";
        const doubts= await redis.lrange(unansweredDoubtsKey, 0 ,-1);
        res.json(doubts.map((doubt)=> JSON.parse(doubt)))
    })
  });

const PORT=3000;
server.listen(PORT,()=>{
    console.log(`server is listening on ${PORT}`)
})