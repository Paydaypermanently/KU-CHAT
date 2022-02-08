const users = []; //유저 목록

// 채팅방에 유저를 참여시킴
function userJoin(id, username, room) {
  //아이디, 유저이름, 방을 매개변수로 받는다
  const user = { id, username, room }; //유저 객체 생성

  users.push(user); //유저 목록 배열에 유저 추가

  return user; //생성한 유저 객체 반환
}

// 유저 정보 얻기
function getCurrentUser(id) {
  //아이디를 매개변수로 받아서
  return users.find((user) => user.id === id); //유저 목록 중 아이디가 같은 유저를 뽑아내 정보출력
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0]; //유저 배열에서 해당 유저를 제거한다
  }
}

// Get room users
function getRoomUsers(room) {
  //방을 매개변수로 받아서
  return users.filter((user) => user.room === room); //해당 방에 포함된 유저 리스트를 반환
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
};
