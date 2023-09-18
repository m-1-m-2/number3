const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, { transports: ['websocket'] });
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  let userBalance;
  socket.on('userBalance', () => {
    if (!userBalance) userBalance = 10000;
    io.emit('userBalance', { userBalance });
  });

  socket.on('games.dice.bet', msg => {
    let Balance = userBalance * 1 - msg.amount * 1;
    let baseOdds = 99.0200;
    let roll_number = Math.floor((Math.random() * 100));
    let winAmount = 0;
    if (msg.is_under) {
      if (roll_number < msg.prediction) {
        winAmount = ((baseOdds / msg.prediction) * msg.amount).toFixed(8);
      }
    } else {
      if (roll_number > msg.prediction) {
        winAmount = ((baseOdds / (99 - msg.prediction)) * msg.amount).toFixed(8);
      }
    }
    Balance = Balance * 1 + winAmount * 1;
    userBalance = Balance;
    io.emit('games.dice.bet', { roll_number, winAmount })
    setTimeout(() => { io.emit('userBalance', { 'userBalance': Balance }); }, 1000)
  })

  socket.on('games.limbo.bet', msg => {
    let Balance = userBalance * 1 - msg.amount * 1;
    let roll_number = Math.floor((Math.random() * 10000));
    let winAmount = 0;
    if (roll_number > msg.prediction) {
      winAmount = (msg.prediction * msg.amount).toFixed(8);
    }
    Balance = Balance * 1 + winAmount * 1;
    userBalance = Balance;
    io.emit('games.limbo.bet', { roll_number, winAmount })
    setTimeout(() => { io.emit('userBalance', { 'userBalance': Balance }); }, 1000)
  })
  socket.on('games.coinflip.bet', msg => {
    let Balance = userBalance * 1 - msg.amount * 1;
    // 0 是反面 1是正面
    let random_num = Math.floor((Math.random() * 2));
    let winAmount = 0, odds = 1.9804;
    if (msg.prediction == random_num) { winAmount = (msg.amount * odds).toFixed(8) }

    Balance = Balance * 1 + winAmount * 1;
    userBalance = Balance;
    io.emit('games.coinflip.bet', { 'prediction': random_num, winAmount })
    setTimeout(() => { io.emit('userBalance', { 'userBalance': Balance }); }, 1000)
  })
  socket.on('games.crash.bet', msg => {
    io.emit('games.crash.bet', { roll_number, winAmount })
  })
  socket.on('games.plinko.bet', msg => {
    let Balance = userBalance * 1 - msg.amount * 1;
    let odds = [
      {},
      {
        8: [13.1, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13.1],
        9: [17.6, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 17.6],
        10: [22.5, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22.5],
        11: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
        12: [33.6, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 3, 11, 33.6],
        13: [44.1, 13, 6, 3, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 3, 6, 13, 44.1],
        14: [60.2, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 60.2],
        15: [90.2, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 90.2],
        16: [120.4, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 120.4],
      },
      {}
    ];
    let { amount, rows, sector, isFast } = msg;
    let roll_array = [0], winAmount, sum = 0;
    for (let i = 1; i < rows; i++) {
      let random_num = Math.floor((Math.random() * 2));
      roll_array.push(random_num);
      sum += random_num;
    }

    let coef = odds[sector][rows][sum];
    winAmount = coef * (amount * 1);

    Balance = Balance * 1 + winAmount * 1;
    userBalance = Balance;
    io.emit('games.plinko.bet', { roll_array, winAmount, coef, sum, })
    setTimeout(() => { io.emit('userBalance', { 'userBalance': Balance }); }, 100 * rows);
  })
  socket.on('games.spacedice.bet', msg => {
    let roll_number = Math.floor((Math.random() * 10000));
    let winAmount = 0;
    io.emit('games.spacedice.bet', { roll_number, winAmount })
  })
  socket.on('games.ring.bet', msg => {
    // console.log(msg);
    let roll_number = Math.floor((Math.random() * msg.segments));
    console.log(roll_number)
    io.emit('games.ring.bet', { roll_number, winAmount: 0 })
  })
  socket.on('games.tower.bet', msg => {
    console.log(msg);
    let params;
    if (msg.type == 0) {
      params = {
        fields: [],
        multi: 1,
        win: true,
        winAmount: 1
      }
    } else if (msg.type == 1) {

    }
    // let roll_number = Math.floor((Math.random() * msg.segments));
    // console.log(roll_number)
    io.emit('games.tower.bet', params)
  })

  let skip;  // 变量设置
  socket.on('games.hilo.bet', msg => {
    let roll_number, card;
    let pai = ['hei', 'hong', 'mei', 'fang'];
    if (msg.ac == 0 && msg.type == 0) {
      skip = 0;
      roll_number = Math.floor((Math.random() * 52)) + 1; // 1 - 13
      // card = `${pai[Math.floor((Math.random() * 4))]}_${roll_number}`;
    }
    if (msg.ac == 3 && msg.type == 1) {
      skip++;
      roll_number = Math.floor((Math.random() * 52)) + 1; // 1 - 13
      // card = `${pai[Math.floor((Math.random() * 4))]}_${roll_number}`;
    }
    // console.log(roll_number)
    io.emit('games.hilo.bet', { roll_number, winAmount: 0 })
  })

  socket.on('games.cryptos.bet', msg => {
    let arr = [];
    for (let i = 0; i < 5; i++) {
      let roll_number = Math.floor((Math.random() * 9));
      arr.push(roll_number)
    }
    io.emit('games.cryptos.bet', { roll_number: arr, winAmount: 0 })
  })

  socket.on('games.triple.bet', msg => {
    // 随机排序
    function ranSort (arr) {
      let newArr = []
      while (arr.length > 0) {
        let ranIndex = Math.floor(Math.random() * arr.length)
        newArr.push(arr[ranIndex])
        arr.splice(ranIndex, 1)
      }
      return newArr
    }
    let arr = [2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let randomSeed = ranSort(arr);
    io.emit('games.triple.bet', { randomSeed })
  })

  let bomb, count_mines, number_pick, oddsSet;

  socket.on('games.mines.bet', msg => {
    // console.log(msg);
    function probabilityFun (x) {
      let arr = [];
      for (let i = 0; i < x; i++) {
        let n = (x - i) / (25 - i);
        n *= arr[i - 1] || 1;
        arr.push(n);
      }
      return arr;
    }
    // 创建炸弹
    let status, winAmount;
    if (msg.type == 0) {
      let Balance = userBalance * 1 - msg.amount * 1;
      bomb = [], count_mines = '', number_pick = 0, oddsSet = [];
      for (let i = 0; i < msg.count; i++) {
        let roll_number = Math.floor(Math.random() * 25) + 1;  // 1 - 25;
        while (bomb.includes(roll_number)) {
          roll_number = Math.floor(Math.random() * 25) + 1;
        }
        bomb.push(roll_number);
      }
      status = true;
      winAmount = msg.amount * 1;
      count_mines = msg.count;   // 炸弹规模
      oddsSet = probabilityFun(25 - count_mines);

      userBalance = Balance;

      io.emit('games.mines.bet', { win: status, winAmount });
      io.emit('userBalance', { 'userBalance': Balance });
    } else if (msg.type == 1) {
      // pick 环节;
      // console.log(bomb)
      // console.log(msg.prediction)
      if (bomb.includes(msg.prediction)) {
        status = false;
        winAmount = 0;
        let fields = bomb;
        io.emit('games.mines.bet', { win: status, fields });
      } else {
        status = true;
        winAmount = (0.99 / oddsSet[number_pick]) * msg.amount;
        number_pick += 1;
        io.emit('games.mines.bet', { win: status, winAmount });
      }

    } else if (msg.type == 2) {
      // cash out  返回炸弹
      status = true;
      winAmount = (0.99 / oddsSet[number_pick - 1]) * msg.amount;
      let fields = bomb;

      Balance = userBalance * 1 + winAmount * 1;
      userBalance = Balance;
      io.emit('games.mines.bet', { win: status, winAmount, fields })
      io.emit('userBalance', { 'userBalance': Balance });
    }
    console.log(bomb);
  })
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
