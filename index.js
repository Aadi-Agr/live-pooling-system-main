const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// In-memory store
const polls = {};
let pollCounter = 1;

io.on('connection', (socket) => {
  console.log('client connected', socket.id);

  socket.on('join-poll', ({pollId, role, name}) => {
    if (!pollId) {
      pollId = Object.keys(polls)[0];
      if (!pollId) return socket.emit('no-poll', {message: 'No poll available'});
    }
    const poll = polls[pollId];
    if (!poll) return socket.emit('no-poll', {message:'Poll not found'});
    socket.join(pollId);
    poll.students[socket.id] = {id: socket.id, name, role};
    socket.emit('joined', poll);
    io.to(pollId).emit('poll-update', poll);
  });

  socket.on('create-demo-poll', ({title}) => {
    const id = 'poll-' + (pollCounter++);
    const questions = [
      { id: 'q1', text: 'Which planet is known as the Red Planet?', options: [
        {id:'o1', text:'Mars', votes:0},
        {id:'o2', text:'Venus', votes:0},
        {id:'o3', text:'Jupiter', votes:0},
        {id:'o4', text:'Saturn', votes:0},
      ]},
      { id: 'q2', text: 'Which gas do plants breathe?', options: [
        {id:'o1', text:'Carbon Dioxide', votes:0},
        {id:'o2', text:'Oxygen', votes:0},
        {id:'o3', text:'Nitrogen', votes:0},
        {id:'o4', text:'Hydrogen', votes:0},
      ]}
    ];
    polls[id] = { id, title: title||'Demo Poll', questions, currentQuestionIndex: -1, students:{}, studentsAnswered:{} };
    io.emit('new-poll', polls[id]);
  });

  socket.on('start-question', ({pollId, questionIndex, timeLimit=60}) => {
    const poll = polls[pollId];
    if (!poll) return;
    poll.currentQuestionIndex = questionIndex;
    poll.studentsAnswered = {};
    io.to(pollId).emit('question-start', {questionIndex, timeLimit, question: poll.questions[questionIndex]});
    setTimeout(() => {
      const q = poll.questions[questionIndex];
      if (q) {
        io.to(pollId).emit('question-end', {questionIndex, results: q.options});
      }
    }, timeLimit*1000);
  });

  socket.on('submit-answer', ({pollId, questionIndex, optionId, name}) => {
    const poll = polls[pollId];
    if (!poll) return;
    const q = poll.questions[questionIndex];
    if (!q) return;
    if (poll.studentsAnswered[socket.id]) return;
    const opt = q.options.find(o=>o.id===optionId);
    if (opt) opt.votes = (opt.votes||0)+1;
    poll.studentsAnswered[socket.id] = true;
    io.to(pollId).emit('answer-submitted', {questionIndex, optionId, by:name});
  });

  // Chat support
  socket.on('chat-message', ({pollId, from, text}) => {
    if (!polls[pollId]) return;
    io.to(pollId).emit('chat-message', {from, text});
  });

  socket.on('disconnect', () => {
    for (const pid in polls) {
      if (polls[pid].students && polls[pid].students[socket.id]) {
        delete polls[pid].students[socket.id];
        io.to(pid).emit('poll-update', polls[pid]);
      }
    }
    console.log('client disconnected', socket.id);
  });
});

// Serve frontend build
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Server running on port', PORT));
