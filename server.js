const path = require("path");
const http = require("http");
const mysql = require("mysql");
const fs = require("fs");
const ejs = require("ejs");
const express = require("express");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages"); // 유저이름이랑 메시지를 받아서 메시지 객체를 만들기 위한 함수
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users"); //utils에 있는 users api 파일에서 유저와 관련된 함수들을 가져온다

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let client = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "company",
});

// public 정적 폴더 셋팅
app.use(express.static(path.join(__dirname, "public")));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.get("/", (request, response) => {
  fs.readFile("./public/index.html", "utf-8", (err, data) => {
    response.send(ejs.render(data));
  });
});

app.post("/", (request, response) => {
  let id = request.body.id;
  let password = request.body.password;
  let check = false;
  let password_DB;

  password = password.toString(); //DB 패스워드와 비교하기 위해 입력받은 패스워드를 문자열로 변경

  if (!id || !password) {
    console.log("아이디 또는 패스워드를 입력해주세요.");
  } else {
    check = true;
    password.trim();
  }

  client.query(
    "SELECT password FROM USERS WHERE id=?",
    [id],
    (err, results) => {
      try {
        console.log("입력받은 비번" + password);
        console.log("DB 비번" + results[0].password);
        console.log(check);
        password_DB = results[0].password;
      } catch (e) {
        console.log(e);
      }
    }
  );
  password_DB = Number(password_DB);
  password_DB = password_DB.toString();
  console.log(typeof password);
  console.log(typeof password_DB);
  console.log("로그인 일치 검사");

  setTimeout(() => {
    //DB에서 데이터를 받아오는 동안 미리 패스워드를 비교하는것을 방지하기 위해 1초 뒤에 로그인을 위한 패스워드 비교를 시도함
    if (password === password_DB && check === true) {
      //패스워드가 일치하며 위 조건들에 걸리지 않는 경우
      console.log("login 성공");
      response.redirect("/chat");
    }
    if (password !== password_DB && check == true) {
      console.log("아이디 또는 패스워드 오류");
    }
  }, 500);
});

app.get("/chat", (request, response) => {
  fs.readFile("./public/start.html", "utf-8", (err, data) => {
    response.send(ejs.render(data));
  });
});

app.get("/signup", (request, response) => {
  fs.readFile("./public/signup.html", "utf-8", (err, data) => {
    response.send(ejs.render(data));
  });
});

app.post("/signup", (request, response) => {
  let body = request.body;

  client.query(
    "INSERT INTO USERS (id, password, name, phone, email) VALUES (?,?,?,?,?)",
    [body.id, body.password, body.name, body.phone, body.email],
    () => {
      console.log("회원가입이 완료됐습니다!");
      response.redirect("/");
    }
  );
});

const botName = "방장";

// 서버와 클라이언트가 정상적으로 연결됐을 경우
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room); //고유 id로는 소켓의 id를 사용

    socket.join(user.room); //유저의 방 이름에 접속한다

    // Welcome current user
    socket.emit(
      "message",
      formatMessage(botName, "대화방에 오신걸 환영합니다~~") //유저이름(방장), 메시지 내용을 매개변수로 받아 message 객체를 리턴한다.
    );

    // 특정 사용자의 접속 사실을 해당 사용자를 제외한 다른 클라이언트들에게 Broadcast 방식으로 전달
    socket.broadcast
      .to(user.room) //해당 유저의 방에 있는 다른 사람들에게 전송
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`) //유저이름(방장), 메시지 내용을 매개변수로 받아 message 객체를 리턴한다.
      );

    //방에 접속해있는 유저의 목록을 나타낸다.
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //클라이언트에서 chatMessage 이벤트를 발생시키면서 메시지를 받아  전송
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id); //메시지를 보낸 유저의 정보를 받아온다

    io.to(user.room).emit("message", formatMessage(user.username, msg)); //메시지를 보낸 유저의 방에 있는 사용자들에게 메시지를 전송한다.
  });

  // 유저가 나가고 해당 클라이언트와 서버의 연결이 종료된경우
  socket.on("disconnect", () => {
    const user = userLeave(socket.id); //해당 유저를 유저 목록에서 지운뒤 업데이트된 유저 목록을 user 변수에 받는다

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`) //방장을 통해 유저나 나간 것을 알림
      );

      //나간 유저를 제외한 나머지 유저를 방의 유저 목록으로 업데이트함
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
