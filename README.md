# 보스 레이드 <br>

* PVE 컨텐츠 관련 rest api 구현<br><br>

* 실행환경: docker-compose <br><br>

* Api-docs: 'localhost:3000/api-docs'<br>
https://drive.google.com/file/d/1GENKlnfbWKIHeQbWaM03EcMhP_q1t0Hn/view?usp=sharing<br><br>


### 사용 기술스택<br>
&nbsp;&nbsp;<img src="https://img.shields.io/badge/NestJS-FF0000?style=for-the-badge&logo=NestJS&logoColor=white">
  <img src="https://img.shields.io/badge/TypefORM-FF8C0A?style=for-the-badge&logo=Typeform&logoColor=black"> <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=MySQL&logoColor=white">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=Redis&logoColor=white"> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=Docker&logoColor=white"> <br><br>


## 구현 내용
### <br>1. 유저 생성
username을 입력 받아, Auto increment 방식으로 생성된 number타입의 userId를 반환합니다.<br><br>
Request Body Example :
```
{ 
  "username": string 
}
```
201 Response Example :
```
{
  "success": true,
  "timestamp": "2022-09-21T10:01:36.776Z",
  "message": "Created",
  "data": 3
}
```
### &nbsp; <br> 2. 유저 조회
Path Parameter를 통해 userId를 입력받아 해당 유저의 보스레이드 총 점수와 참여 기록을 반환합니다. <br><br>
201 Response Example :
```
{
  "success": true,
  "timestamp": "2022-09-21T10:04:17.347Z",
  "message": "OK",
  "data": {
    "totalScore": 40,
    "bossRaidHistory": [
      {
        "raidRecordId": 2,
        "score": 20,
        "enterTime": "2022-09-21T10:02:52.000Z",
        "endTime": "2022-09-21T10:03:06.000Z"
      },
      {
        "raidRecordId": 3,
        "score": 20,
        "enterTime": "2022-09-21T10:03:17.000Z",
        "endTime": "2022-09-21T10:03:53.000Z"
      }
    ]
  }
}
```

### &nbsp; <br> 3. 보스레이드 상태 조회
현재 보스 레이드를 시작 가능한 지 여부와, 시작 불가능한 경우 현재 보스 레이드를 진행중인 유저의 id를 반환합니다. <br>보스레이드의 시작 가능 조건은 다음과 같습니다.
* 보스레이드 테이블에 아무 레코드도 없는 경우
* 레코드가 하나 이상 존재한다면, 가장 최근 레코드의 종료시간(또는 제한시간)이 현재 조회 요청 시간보다 작은 경우(요청 당시가 종료시간을 지났을 경우)
<br><br>
200 Response Example :
```
{
  "success": true,
  "timestamp": "2022-09-21T11:05:08.152Z",
  "message": "OK",
  "data": {
    "canEnter": true
  }
}
```
200 Response Example (시작 불가능한 경우) :
```
{
  "success": true,
  "timestamp": "2022-09-21T11:07:01.859Z",
  "message": "OK",
  "data": {
    "canEnter": false,
    "enterdUserId": 3
  }
}
```

### &nbsp; <br> 4. 보스레이드 시작
userId와 참여할 레이드 level을 입력받아 보스레이드 시작 가능 여부를 판별한 뒤, 가능하다면 레이드 레코드를 새로 생성하며, **생성 시간(enterTime)에 제한 시간을 더한 값을 종료 시간(endTime)에 대입**해 저장합니다. 따라서 생성 당시의 종료 시간 값은 해당 레이드가 만료 될 시간입니다. 이 값은 이후 보스레이드 종료 요청에 따라 변경될 수 있습니다. <br>또한 서버에서 처음으로 받은 시작 요청의 경우는 레이드의 제한시간과 레벨 별 점수 정보가 담긴 정적 데이터를 웹에서 응답받아 사용하지만, 첫 요청 이후론 redis에 캐싱되어 있는 값을 가져와 사용하게 됩니다.<br><br>
Request Body Example :
```
{
  "userId": 3,
  "level": 0
}
```
201 Response Example :
```
{
  "success": true,
  "timestamp": "2022-09-21T11:06:58.556Z",
  "message": "Created",
  "data": {
    "isEntered": true,
    "raidRecordId": 5
  }
}
```
200 Response Example (시작 불가능한 경우) :
```
{
  "success": true,
  "timestamp": "2022-09-21T11:06:58.556Z",
  "message": "Created",
  "data": {
    "isEntered": false,
  }
}
```
### &nbsp; <br> 5. 보스레이드 종료
userId와 raidRecoreId를 입력 받아 보스레이드를 종료 시킵니다. 현재 시간이 레이드의 종료시간을 넘지 않았다면 성공 처리되어 기존의 종료시간 column을 현재 시간으로 덮어 씌우고 user의 total_score에 보스레이드 점수를 합산하며, redis에 저장되어 있는 유저 랭킹을 갱신합니다.<br>하지만 현재 시간이 레이드의 종료시간을 넘었다면 실패 처리되어 점수와 랭킹은 변하지 않습니다.<br><br>
Request Body Example :
```
{
  "userId": 3,
  "raidRecordId": 4
}
```
200 Response Example
```
{
  "success": true,
  "timestamp": "2022-09-21T10:04:35.421Z",
  "message": "OK"
}
```
401 Response Example
```
{
  "statusCode": 401,
  "message": "옳지 않은 유저입니다."
}
```
404 Response Example
```
{
  "statusCode": 404,
  "message": "존재하지 않는 레코드입니다."
}
```
408 Response Example
```
{
  "statusCode": 408,
  "message": "제한시간이 만료되었습니다. (레이드 실패)"
}
```


### &nbsp; <br> 6. 보스레이드 랭킹 조회
userId를 입력 받아 해당 유저의 랭킹과 함께 전체 유저의 total_score를 내림차순 정렬한 랭킹 배열을 반환합니다. <br><br>
Request Body Example :
```
{
  "userId": 1
}
```
200 Response Example :
```
{
  "success": true,
  "timestamp": "2022-09-21T11:59:59.002Z",
  "message": "Created",
  "data": {
    "topRankerInfoList": [
      {
        "ranking": 0,
        "userId": "1",
        "totalScore": 85
      },
      {
        "ranking": 1,
        "userId": "2",
        "totalScore": 40
      },
      {
        "ranking": 2,
        "userId": "3",
        "totalScore": 20
      }
    ],
    "myRankingInfo": {
      "ranking": 0,
      "userId": "1",
      "totalScore": 85
    }
  }
}
```
