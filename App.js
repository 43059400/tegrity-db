const db = require('./helpers/db')
const cookieParser = require('cookie-parser')
let cors = require('cors')
const app = require('express')()
const fs = require('fs')

const https = require('https').createServer({
  key: fs.readFileSync('/etc/letsencrypt/live/tegritydatabase.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/tegritydatabase.com/cert.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/tegritydatabase.com/fullchain.pem')
}, app)

const io = require('socket.io')(https, { cors: {
  origin: ["https://www.tegritygaming.com", "https://localhost"],
  methods: ["GET", "POST"]
  }
})

const axios = require('axios')
const port = process.env.PORT || 443
const CLIENT_ID = '769370226835193876'
const CLIENT_SECRET = 'I1nJFdJrIw1P6SAV-ba3TMPqLZE_Yfpl'
const REDIRECT_URI = 'https://tegritydatabase.com/api/discord/callback'

let connected_users = []
let interval

app.use(cors())
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send('You have activated Skynet!')
})

app.get('/api/discord/callback', async (req, res) => {
  if (!req.query.code) throw new Error('NoCodeProvided')

  const code = req.query.code
  const params = new URLSearchParams()

  params.append('grant_type', 'authorization_code')
  params.append('client_id', CLIENT_ID)
  params.append('client_secret', CLIENT_SECRET)
  params.append('code', code)
  params.append('redirect_uri', REDIRECT_URI)
  params.append('Content-Type', 'application/x-www-form-urlencoded')

  axios.post(`https://discordapp.com/api/oauth2/token`, params)
    .then(token => {
      axios.get('https://discordapp.com/api/users/@me', {
          headers: {
            'Authorization': `Bearer ${token.data.access_token}`
          }
        })
        .then(userData => {
            let user = userData.data
            db.addUser(user, () => {
              updateUserList()
            })

            console.log('cookie id: ',user.id)
res.cookie('id',  user.id)
res.redirect('https://www.tegritygaming.com?id=' + encodeURIComponent(user.id))

          })
    	})
})

io.on('connection', (socket) => {
  console.log('New client connected')
  connected_users.push({
    socket: socket
  })
  console.log('users: ', connected_users.length)

  if (interval) {
    clearInterval(interval)
  }

  interval = setInterval(() => getApiAndEmit(socket), 1000)

  socket.on('disconnect', () => {

    connected_users.forEach((item, index) => {
      if (item.socket = socket) {
        connected_users.splice(index, 1)
      }
    })
    clearInterval(interval)
  })

  socket.on('getUserData', (user) => {
    db.getUserData(user, (userData) => {
      socket.emit('user', userData)
    })
  })

  socket.on('getAllAlias', (user) => {
    db.getAllAlias(user, (aliasData) => {
      socket.emit('alias', aliasData)
    })
  })

  socket.on('addAlias', (user, alias) => {
    db.addAlias(user, alias, () => {
      db.getAllAlias(user, (aliasData) => {
        socket.emit('alias', aliasData)
      })
    })
  })

  socket.on('getItems', (user) => {
    db.getItems(user, (items) => {
      socket.emit('items', items)
    })
  })

  socket.on('delete_wish', (user, item, alias) => {
    db.deleteWish(user, item, alias, () => {
      db.upatePriorty(user, item, alias, (wishes) => {
        db.getWishList(user, (wishes) => {
          socket.emit('update_wishes', wishes)
        })
       // updateUsersAuditTrail()
        updateUsersReserves()
      })
    })
  })
  
  socket.on('insert_wish', (user, item, alias) => {
    db.insertWish(user, item, alias, () => {
      db.upatePriorty(user, item, alias, () => {
        db.getWishList(user, (wishes) => {
          socket.emit('update_wishes', wishes)
        })
      //  updateUsersAuditTrail()
        updateUsersReserves()
      })
    })
  })

  socket.on('update_wish_priority', (user, item, alias, priority) => {
    db.upatePriorty(user, item, alias, () => {
      db.getWishList(user, (wishes) => {
        socket.emit('update_wishes', wishes)
      })
      //updateUsersAuditTrail()
      updateUsersReserves()
    }, priority)
  })

  socket.on('get_wish_list', (user) => {
    db.getWishList(user, (wishes) => {
      socket.emit('update_wishes', wishes)
    })
  })

  socket.on('get_user_alias_list', (user) => {
    db.getUserAliasList(user, (alias_list) => {
      socket.emit('update_alias_list', alias_list)
    })
  })

  socket.on('delete_user_alias', (user, alias) => {
    db.deleteAlias(user, alias, () => {
      db.getUserAliasList(user, (alias_list) => {
        socket.emit('update_alias_list', alias_list)
      })
    })
  })

  socket.on('insert_user_alias', (user, alias) => {
    db.insertAlias(user, alias, () => {
      db.getUserAliasList(user, (alias_list) => {
        socket.emit('update_alias_list', alias_list)
      })
    })
  })

  //socket.on('get_audit_trail', () => {
  //  db.getUsersAuditTrail((audit_trail) => {
  //      socket.emit('update_audit_trail', audit_trail)
 //   })
 // })

  socket.on('get_user_list', () => {
    db.getUserList((users) => {
      socket.emit('update_user_list', users)
    })
  })

  socket.on('get_reserves', () => {
    db.getUsersReserves((reserves_data) => {
      socket.emit('update_reserves', reserves_data)
    })
  })
})

socket.on('get_all_alias', () => {
  db.getAllAlias((alias_data) => {
    socket.emit('update_reserves', alias_data)
  })
})

//const updateUsersAuditTrail = () => {
 // db.getUsersAuditTrail((audit_trail) => {
 //   connected_users.forEach((user) => {
  //    user.socket.emit('update_audit_trail', JSON.parse(JSON.stringify(audit_trail)))
   // })
  //})
//}

const updateUsersReserves = () => {
  db.getUsersReserves((reserves_data) => {
    connected_users.forEach((user) => {
      user.socket.emit('update_reserves', reserves_data)
    })
  })
}

const updateUserList = () => {
  db.getUserList((users) => {
    connected_users.forEach((user) => {
      user.socket.emit('update_user_list', users)
    })
  })
}

const getApiAndEmit = socket => {
  const response = new Date()
  // Emitting a new message. Will be consumed by the client
  socket.emit('FromAPI', response)
}

https.listen(port, () => {
  console.log(`listening on *:${port}`)
})