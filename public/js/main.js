const chatForm = document.getElementById("chat-form"); //chat.html에 있는 chat-form (입력 메시지 내용)을 가져온다
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// URL에서 유저이름이랑 방 이름을 가져온다.
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true, //쿼리 접두사 무시하기
});

const socket = io();

// 채팅 입장
socket.emit("joinRoom", { username, room });

// 유저 목록 가져오기
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// message 이벤트가 발생했을 경우 해당 message를 받아서 채팅창 화면에 띄워준다.
socket.on("message", (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// 채팅 전송
chatForm.addEventListener("submit", (e) => {
  //전송 시
  e.preventDefault(); //(전송)의 디폴트 기능 삭제

  //msg, 즉 입력해놓은 메시지를 가져와서 msg 변수에 저장한다.
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  } //메시지가 있는지 없는지 체크

  // 서버로 해당 메시지를 전송한다.
  socket.emit("chatMessage", msg);

  // 전송 완료 후엔 입력창을 초기화시킨다
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// 메시지를 클라이언트(채팅방)의 대화창으로 내보내기
function outputMessage(message) {
  const div = document.createElement("div"); //div생성
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta"); //유저이름, 시간 추가
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p"); //메세지 내용 추가
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div); // 대화창에 위의 div 추가
}

// DOM에 방 이름을 추가
function outputRoomName(room) {
  roomName.innerText = room;
}

// DOM에 유저의 목록을 추가
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//나가기 시에 확인 메시지 받기
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("채팅방을 정말 나가시겠습니까?");
  if (leaveRoom) {
    //방을 나가면 이전 페이지로 이동
    window.location = "/";
  } else {
  }
});
