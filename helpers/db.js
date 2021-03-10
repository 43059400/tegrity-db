const e = require('express')
const mysql = require('mysql')

const pool = mysql.createPool({
    host: 'tegritygaming.com',
    user: 'hellsvalt',
    password: 'Trump2020!',
    database: 'tegrity'
})

module.exports = {
    addUser: (user, cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT * FROM users WHERE id=${user.id}`, (error, result) => {
		console.log(result)

                if (error) {
                    console.log(error)
                }

                if (result.length === 0) {
                    connection.query(`INSERT INTO users (id, username, discriminator, avatar, admin) VALUES ('${user.id}', '${user.username}', '${user.discriminator}', '${user.avatar}', '0')`, (error, result) => {
                        console.log('Added user: ', user.username)
                        error ? console.log(error) : console.log(`Created new user ${user.username}`)
                        cb()
                    })
                }
                connection.release()
            })
        })
    },

    addAlias: (user, alias, cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT * FROM alias WHERE name='${alias}'`, (error, result) => {
		        console.log(result)

                if (error) {
                    console.log(error)
                }
                else {
                    if (result.length === 0) {
                        connection.query(`INSERT INTO alias (user_id, name) VALUES ('${user.id}', '${alias}')`, (error, result) => {
                            console.log('Added alias: ', alias.name)
                            error ? console.log(error) : console.log(`Created new alias name ${user.username}:${alias}`)
                            cb()
                        })
                    }
                }
                connection.release()
            })
        })
    },

    getAllAlias: (user, cb) => {
        pool.getConnection((err, conn) => {
            conn.query(`SELECT * FROM alias WHERE user_id='${user.id}'`, (err, result) => {
                if (result.length === 0) {
                    cb([{user_id: user.id, name: user.username}])
                } else {
                    result.unshift({user_id: user.id, name: user.username})
                    cb(result)
                }
                conn.release()
            })
        })

    },

    getUserData: (user, cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT * FROM users WHERE id='${user}'`, (error, result) => {
                if (result.length === 0) {
                    cb(user)
                } else {
                    cb(result[0])
                }
                connection.release()
            })
        })
    },
    getUserAliasList: (user, cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT * FROM alias WHERE user_id='${user || user.id}'`, (error, result) => {
                if (result.length === undefined) {
                    cb([])
                } else {
                    cb(JSON.parse(JSON.stringify(result)))
                }
                connection.release()
            })
        })
    },

    getUsersAuditTrail: (cb) => {
       pool.getConnection((error, connection) => {
            connection.query(`SELECT users.username, actions.name as 'action', items.name, items.img_name, items.id as item_id, wish_list_items_tracking.details, wish_list_items_tracking.time_stamp  FROM wish_list_items_tracking INNER JOIN users on wish_list_items_tracking.user_id = users.id INNER JOIN actions on actions.id = wish_list_items_tracking.action_id INNER JOIN items on items.id = wish_list_items_tracking.item_id ORDER BY wish_list_items_tracking.time_stamp DESC`, (error, result) => {
                if(result.length === undefined) {
                    cb([])
                } else {
                    cb(JSON.parse(JSON.stringify(result)))
                }
                connection.release()
            })
        })
    },

    getUsersReserves: (cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT users.username as 'username', wish_list_items.priority as 'priority', items.name as 'item_name', items.img_name, items.id as 'item_id', zones.id as 'zone_id', zones.name as 'zone_name'  FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id INNER JOIN users on users.id = wish_list_items.user_id INNER JOIN zones on zones.id = items.zone_id`, (error, result) => {
                if(result.length === undefined) {
                    cb([])
                } else {
                    cb(result)
                }
                connection.release()
            })
        })
    },

    getUserList: (cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT * FROM users`, (error, result) => {
                if (result.length === undefined) {
                    cb([])
                } else {
                    cb(result)
                }
                connection.release()
            })
        })
    },

    getItems: (user, cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT items.id as 'id', items.name as 'name', items.img_name as 'img_name', items.level, npcs.name as 'npc', items.type, items.slot, items.percentage, npcs.name as 'npc', zones.name as 'zone', npcs.id as 'npcs_id', zones.id as 'zone_id' FROM items INNER JOIN npcs on npcs.id =items.npc_id INNER JOIN zones on zones.id = items.zone_id`, (error, result) => {
                if (result.length === undefined) {
                    cb([])
                } else {
                    cb(result)
                }
            })

            connection.release()
        })
    },

    upatePriorty: (user, item, alias, cb, pos) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT * FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id INNER JOIN users on users.id = wish_list_items.user_id WHERE users.id = '${user.id}' users.id = '${alias.user_id}' AND zone_id = '${item.zone_id}'`, (error, result) => {
                result = result || []
                let newPriorityList = []
                let check_pos = pos || 20
                let findIndex = -1
                let index_tracker = 1

                result.sort((a, b) => {
                    return a.priority - b.priority
                })
    
                result.forEach((element, index) => {
                    if (element.item_id == String(item.item_id)) {
                        findIndex = index
                    }
                })
                if (findIndex !== -1) {
                    result.splice(findIndex, 1)
                }
    
                if (check_pos > result.length) {
                    check_pos = result.length + 1
                }

                connection.query(`INSERT INTO wish_list_items_tracking(action_id, user_id, alias_id, item_id, details, time_stamp) VALUES ('3', '${user.id}', '${alias.user_id}', '${item.id || item.item_id}', '${JSON.stringify(item)}', now())`, (error, result) => {
                    error ? console.log(error) : console.log(`Create new wish_list_items_tracking ${user.id} ${item.item_id || item.id} ${alias.user_id}`)
                })

                result.forEach((element) => {
                    if (check_pos == index_tracker) {
                        item.priority = index_tracker
                        newPriorityList.push(item)
    
                        if ((result.length + 1) >= index_tracker) {
                            index_tracker++
                            element.priority = index_tracker
                            newPriorityList.push(element)
                        }
                    } else if ((result.length + 1) >= index_tracker) {
                        element.priority = index_tracker
                        newPriorityList.push(element)
                    }
                    index_tracker++
                })
                
                if (check_pos == index_tracker) {
                    item.priority = index_tracker
                    newPriorityList.push(item)
                }

                newPriorityList.forEach((element) => {
                    connection.query(`UPDATE wish_list_items SET priority='${element.priority}', time_stamp=Now() WHERE user_id='${user.id}' AND alias_id='${alias.user_id}' AND item_id='${String(element.item_id)}'`, (error, result) => {
                        if (error) 
                        { console.log(error) }
                    })
                })

                connection.query(`SELECT wish_list_items.priority as 'priority', items.name as 'item_name', items.id as 'item_id', items.img_uri,items.level, zones.name as 'zone_name', npcs.name as 'npc_name', npcs.id as 'npc_id', items.slot as 'item_slot', items.type as 'item_type', items.img_name as 'item_image_name', zones.id as 'zone_id' FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id INNER JOIN zones on zones.id = items.zone_id INNER JOIN users on wish_list_items.user_id = users.id INNER JOIN npcs on npcs.id = items.npc_id WHERE users.id = ${user.id}`, (error, result) => {
                    if(error) {
                        console.log(error)
                        cb([])
                    } else {
                        cb(result)
                    }
                })
                connection.release()
            })
        })
    },

    insertWish: (user, item, alias, cb) => {
        pool.getConnection((error, connection) => { 
            let query = `SELECT * FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id WHERE user_id='${user.id}' AND alias_id=${alias.user_id} AND zone_id='${item.zone_id}'`
            connection.query(query, (error, result) => {
                if(result.length >= 5) {
                    console.log(`5+ wishes already for ${user.id} ${alias.user_id} ${item.zone_id}`)
                    query = `SELECT wish_list_items.priority as 'priority', items.name as 'item_name', items.id as 'item_id', items.img_uri,items.level, zones.name as 'zone_name', npcs.name as 'npc_name', npcs.id as 'npc_id', items.slot as 'item_slot', items.type as 'item_type', items.img_name as 'item_image_name', zones.id as 'zone_id' FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id INNER JOIN zones on zones.id = items.zone_id INNER JOIN users on wish_list_items.user_id = users.id INNER JOIN npcs on npcs.id = items.npc_id WHERE users.id = '${user.id}'`
                    connection.query(query, (err, rows) => {
                        if (err) {
                            console.log(err)
                            cb([])
                        } else {
                            cb(rows)
                        }
                    })
                } else {
                    if (result !== undefined) {
                        query = `INSERT INTO wish_list_items(user_id, item_id, alias_id, time_stamp) VALUES (${user.id},${alias.user_id},${item.id}, NOW())`
                        connection.query(query, (err, result) => {
                            err ? console.log(err) : console.log(`inserted wish ${user.id} ${alias.user_id} ${item.id}`)
                        })
                        query = `INSERT INTO wish_list_items_tracking(action_id, user_id, alias_id, item_id, details, time_stamp) VALUES (1, ${user.id}, ${alias.user_id}, ${item.id}, '${JSON.stringify(item)}', NOW())`
                        connection.query(query, (err, result) => {
                            err ? console.log(err) : console.log(`inserted wish into tracking ${user.id},${alias.user_id}, ${item.id}`)
                        })
                    } else {
                        cb([])
                    }
                    query = `SELECT wish_list_items.priority as 'priority', items.name as 'item_name', items.id as 'item_id', items.img_uri,items.level, zones.name as 'zone_name', npcs.name as 'npc_name', npcs.id as 'npc_id', items.slot as 'item_slot', items.type as 'item_type', items.img_name as 'item_image_name', zones.id as 'zone_id' FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id INNER JOIN zones on zones.id = items.zone_id INNER JOIN users on wish_list_items.user_id = users.id INNER JOIN npcs on npcs.id = items.npc_id WHERE users.id = ${user.id}`
                    connection.query(query, (err, rows) => {
                        if (err) {
                            console.log(err)
                            cb([])
                        } else {
                            cb(rows)
                        }  
                    })
                }
            })
            connection.release()
        })
    },

    deleteWish: (user, item, alias, cb) => {
        pool.getConnection((error, connection) => {     
            let query = `SELECT * FROM wish_list_items WHERE user_id=${user.id} AND alias_id=${alias.user_id} AND item_id="${item.item_id || item.id}"`
            connection.query(query, (err, row) => {
                if(row !== undefined) {
                    query = `DELETE FROM wish_list_items WHERE user_id=${user.id} AND alias_id=${alias.user_id} AND item_id=${item.item_id || item.id}`
                    connection.query(query, (err, result) => {
                        err ? console.log(err) : console.log(`Removed item ${user.id} ${item.item_id || item.id}:${alias.user_id || ''}`)
                        query = `INSERT INTO wish_list_items_tracking(action_id, user_id, item_id, alias_id, details, time_stamp) VALUES (2, ${user.id}, ${item.id || item.item_id}, ${alias.user_id}, '${JSON.stringify(row)}', NOW())`
                        connection.query(query, (err, result) => {
                            err ? console.log(err) : console.log(`Row inserted into wish_list_items_tracking ${user.id} ${item.item_id || item.id} ${alias.user_id}`)
                        })
                        query = `SELECT wish_list_items.priority as 'priority', items.name as 'item_name', items.id as 'item_id', items.img_uri,items.level, zones.name as 'zone_name', npcs.name as 'npc_name', npcs.id as 'npc_id', items.slot as 'item_slot', items.type as 'item_type', items.img_name as 'item_image_name', zones.id as 'zone_id' FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id INNER JOIN zones on zones.id = items.zone_id INNER JOIN users on wish_list_items.user_id = users.id INNER JOIN npcs on npcs.id = items.npc_id WHERE users.id = ${user.id}`
                        connection.query(query, (err, rows) => {
                            if (err) {
                                console.log(err)
                                cb([])
                            } else {
                                cb(rows)
                            }
                        })
                    })
                }
            })
            connection.release()
        })
    },
    getWishList: (user, cb) => {
        pool.getConnection((error, connection) => {
            connection.query(`SELECT items.name as 'item_name', wish_list_items.user_id as 'user_id', wish_list_items.alias_id as 'alias_id', items.id as 'item_id', items.img_uri,items.level, zones.name as 'zone_name', npcs.name as 'npc_name', npcs.id as 'npc_id', items.slot as 'item_slot', items.type as 'item_type', items.img_name as 'item_image_name', zones.id as 'zone_id', wish_list_items.priority as 'priority' FROM wish_list_items INNER JOIN items on items.id = wish_list_items.item_id INNER JOIN zones on zones.id = items.zone_id INNER JOIN users on wish_list_items.user_id = users.id INNER JOIN npcs on npcs.id = items.npc_id WHERE users.id = ${user.id}`, (error, result) => {
                if (error) {
                    console.log(error)
                    cb([])
                } else {
                    cb(result)
                }
                connection.release()
            })
        })
    }
}